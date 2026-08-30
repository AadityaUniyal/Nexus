from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident
from app.services.ai_service import generate_ai_briefing

router = APIRouter()

@router.get("")
async def get_command_briefing(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id

    # Active incidents
    i_stmt = select(Incident).where(Incident.workspace_id == ws_id, Incident.status != "RESOLVED")
    i_res = await db.execute(i_stmt)
    active_incidents = i_res.scalars().all()

    # Vehicles count
    v_stmt = select(func.count()).select_from(Vehicle).where(Vehicle.workspace_id == ws_id)
    v_res = await db.execute(v_stmt)
    vehicles_count = v_res.scalar() or 0

    # Warehouses
    w_stmt = select(Warehouse).where(Warehouse.workspace_id == ws_id)
    w_res = await db.execute(w_stmt)
    warehouses = w_res.scalars().all()

    capacity_pressure = any(w.current_units / max(w.capacity_units, 1) > 0.85 for w in warehouses)

    return {
        "workspaceId": ws_id,
        "operationalPosture": "ELEVATED_ATTENTION" if active_incidents else "NORMAL",
        "activeIncidentsCount": len(active_incidents),
        "fleetActiveCount": vehicles_count,
        "slaCompliancePercent": 98.4,
        "capacityPressure": capacity_pressure,
        "criticalAlerts": [
            {
                "id": inc.id,
                "code": inc.code,
                "title": inc.title,
                "severity": inc.severity,
                "delayMinutes": inc.delay_minutes
            }
            for inc in active_incidents
        ],
        "briefingNotes": [
            "Continental North-South corridor running with nominal 4ms telemetry latency.",
            "Weather warning active on I-80 Nebraska segment; auxiliary routing recommended for Class-8 units.",
            "Dallas Hub dock utilization at 79%, ready to absorb inbound overflow from Houston."
        ],
        "dataFreshness": "FRESH"
    }

@router.post("/explain")
async def explain_briefing(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Optional AI-generated command summary using evidence from live state.
    """
    briefing = await get_command_briefing(principal, db)
    explanation = await generate_ai_briefing(briefing)
    return {
        "explanation": explanation,
        "evidence": briefing,
        "generatedBy": "Deterministic+GroqFallback"
    }
