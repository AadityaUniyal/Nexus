from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import ai_service
from app.schemas.system import AiBriefingResponse
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

class RcaRequest(BaseModel):
    incident_code: str
    title: str
    severity: str
    delay_mins: int
    vehicle_code: Optional[str] = "NX-TRK-104"

class SimulationExplainRequest(BaseModel):
    simulation_code: str
    route_type: str
    time_saved_mins: int
    cost_delta_usd: float
    sla_breach_risk_pct: float

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
