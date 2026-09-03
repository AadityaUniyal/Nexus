from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.incidents import Incident
from app.services.ai_service import ai_service
from app.schemas.system import AiBriefingResponse
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

class RcaRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    incident_code: str = Field(..., alias="incidentCode")
    title: str
    severity: str
    delay_mins: int = Field(..., alias="delayMins")
    vehicle_code: Optional[str] = Field("NX-TRK-104", alias="vehicleCode")

class SimulationExplainRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    simulation_code: str = Field(..., alias="simulationCode")
    route_type: str = Field(..., alias="routeType")
    time_saved_mins: int = Field(..., alias="timeSavedMins")
    cost_delta_usd: float = Field(..., alias="costDeltaUsd")
    sla_breach_risk_pct: float = Field(..., alias="slaBreachRiskPct")

class AiExplainRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    incident_id: Optional[str] = Field(None, alias="incidentId")
    context: Optional[str] = None

@router.get("/health")
async def get_ai_health():
    """Verify live Groq API connectivity and model status."""
    return await ai_service.health_check()

@router.post("/briefing", response_model=AiBriefingResponse)
async def generate_briefing(context: Optional[str] = None):
    """Generate executive operational briefing synthesized with Groq LLaMA 3.3 70B."""
    briefing_text = await ai_service.generate_operational_briefing(context_summary=context)
    return AiBriefingResponse(
        briefing=briefing_text,
        model=settings.GROQ_MODEL,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )

@router.post("/explain")
async def explain_ai(
    req: AiExplainRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate executive AI analysis/explanation for an incident or operational context."""
    incident_id = req.incident_id
    context_desc = req.context or ""
    if incident_id:
        stmt = select(Incident).where(or_(Incident.id == incident_id, Incident.code == incident_id))
        res = await db.execute(stmt)
        inc = res.scalars().first()
        if inc:
            context_desc = f"Incident {inc.code}: {inc.title}. Severity: {inc.severity}, Delay: {inc.delay_minutes} mins, Affected Entity: {inc.affected_entity_name}. {context_desc}"

    explanation = await ai_service.generate_operational_briefing(context_summary=context_desc or "Operational incident impact evaluation")
    return {
        "explanation": explanation,
        "incidentId": incident_id,
        "model": settings.GROQ_MODEL,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

@router.post("/rca")
async def generate_rca(req: RcaRequest):
    """Generate AI-powered Root Cause Analysis and immediate mitigation advice."""
    return await ai_service.generate_incident_rca(
        incident_code=req.incident_code,
        title=req.title,
        severity=req.severity,
        delay_mins=req.delay_mins,
        vehicle_code=req.vehicle_code or "NX-TRK-104",
    )

@router.post("/simulation-explain")
async def explain_simulation(req: SimulationExplainRequest):
    """Generate executive rationale for a simulation scenario."""
    explanation = await ai_service.generate_simulation_explanation(
        simulation_code=req.simulation_code,
        route_type=req.route_type,
        time_saved_mins=req.time_saved_mins,
        cost_delta_usd=req.cost_delta_usd,
        sla_breach_risk_pct=req.sla_breach_risk_pct,
    )
    return {"explanation": explanation, "model": settings.GROQ_MODEL}

