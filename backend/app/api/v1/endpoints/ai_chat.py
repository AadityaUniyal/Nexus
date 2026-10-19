"""AI endpoints backed by the Groq -> Gemini -> deterministic provider chain."""
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_workspace, require_permission
from app.auth.principal import PermissionEnum, RequestPrincipal
from app.db.session import get_db
from app.services.ai_service import ai_service
from app.services.analytics_service import AnalyticsService
from app.services.copilot_tools import CopilotToolRegistry
from app.services.quota_guard import quota_guard

router = APIRouter(prefix="/ai", tags=["AI"])

def _workspace(principal: RequestPrincipal) -> str:
    return principal.workspace_id


class AIChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[str] = None
    provider: Optional[str] = Field(None, pattern="^(groq|gemini)$")


class AIChatResponse(BaseModel):
    conversation_id: str
    reply: str
    source: str
    model: str


class InsightRequest(BaseModel):
    timeframe: str = Field("7d", pattern="^(24h|7d|30d|90d)$")
    question: Optional[str] = Field(None, max_length=500)


@router.get("/status")
async def ai_status(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
) -> Dict[str, Any]:
    """Which providers are configured, and their live usage counters."""
    return ai_service.status()


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    req: AIChatRequest,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    quota_guard.check_ai_tokens(max(1, len(req.prompt) // 4))
    workspace_id = _workspace(principal)
    overview = await AnalyticsService.get_overview(db=db, workspace_id=workspace_id, timeframe="7d")
    fleet = await CopilotToolRegistry.get_fleet_summary(db, workspace_id)
    incidents = await CopilotToolRegistry.get_active_incidents(db, workspace_id)
    delayed_deliveries = await CopilotToolRegistry.get_at_risk_deliveries(db, workspace_id)
    context = {
        "analytics": {k: overview.get(k) for k in ("slaComplianceRate", "avgTurnaroundMins", "totalNetworkUnits")},
        "fleet": fleet,
        "activeIncidents": incidents,
        "atRiskDeliveries": delayed_deliveries,
    }
    system = (
        "You are NEXUS Assistant, an analytics copilot for logistics teams. "
        "Answer clearly and briefly in markdown using only the provided, tenant-scoped workspace evidence. "
        "If a metric is null or a record is absent, say it is not available; never invent values, assets, locations, "
        "weather, predictions, or actions. You can analyze records but cannot execute operational changes. "
        "Workspace evidence: "
        f"{context}"
    )
    result = await ai_service.complete(system, req.prompt, temperature=0.4, max_tokens=700, prefer=req.provider)
    conv_id = req.conversation_id or f"conv-{uuid.uuid4().hex[:10]}"
    if result:
        return AIChatResponse(conversation_id=conv_id, reply=result.text, source=result.provider, model=result.model)
    fleet_count = fleet["total_vehicles"]
    order_count = fleet["total_orders"]
    fallback = (
        "I couldn't reach an AI provider, so I haven't generated a narrative. "
        f"Recorded workspace data: {fleet_count} vehicles, {order_count} orders, "
        f"{fleet['active_incidents']} active incidents. "
        "Metrics not present in the workspace are unavailable."
    )
    return AIChatResponse(
        conversation_id=conv_id,
        reply=fallback,
        source="deterministic",
        model="none",
    )


@router.post("/insights")
async def analytics_insights(
    req: InsightRequest,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Narrative insights generated from the workspace's live analytics."""
    overview = await AnalyticsService.get_overview(db=db, workspace_id=_workspace(principal), timeframe=req.timeframe)
    slim = {k: v for k, v in overview.items() if not isinstance(v, list)}
    slim["slaTrendTail"] = (overview.get("slaTrends") or [])[-7:]
    slim["topHubs"] = (overview.get("hubThroughput") or [])[:5]
    return await ai_service.explain_metrics(slim, req.question)


@router.post("/briefing")
async def ai_briefing(
    timeframe: str = Query("24h", pattern="^(24h|7d|30d|90d)$"),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Executive briefing used by Overview and Reports pages."""
    overview = await AnalyticsService.get_overview(db=db, workspace_id=_workspace(principal), timeframe=timeframe)
    state = {
        "slaCompliancePercent": overview.get("slaComplianceRate"),
        "avgTurnaroundMins": overview.get("avgTurnaroundMins"),
        "totalNetworkUnits": overview.get("totalNetworkUnits"),
        "activeIncidentsCount": (overview.get("incidentsSummary") or {}).get("activeIncidents", 0),
        "capacityPressure": any(
            h.get("volume", 0) / max(h.get("capacity") or 1, 1) > 0.85
            for h in (overview.get("hubThroughput") or [])
            if isinstance(h, dict)
        ),
    }
    text = await ai_service.generate_executive_briefing(state)
    return {
        "briefing": text,
        "evidence": state,
        "generatedBy": ai_service.active_providers[0] if ai_service.is_enabled else "deterministic",
    }
