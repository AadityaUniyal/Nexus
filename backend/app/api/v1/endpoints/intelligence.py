from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.system import OperationalEvent
from app.models.incidents import Incident
from app.models.operations import Route, Vehicle

router = APIRouter()

@router.get("/overview")
async def get_intelligence_overview(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    
    # Active incidents
    i_stmt = select(Incident).where(Incident.workspace_id == ws_id, Incident.status != "RESOLVED")
    i_res = await db.execute(i_stmt)
    incidents = i_res.scalars().all()

    return {
        "workspaceId": ws_id,
        "activeRiskPatterns": 2,
        "corridorAnomaliesDetected": 1,
        "predictiveInterventionsReady": len(incidents),
        "patterns": [
            {
                "id": "pat-01",
                "title": "Recurring Peak Congestion on I-80 Nebraska Corridor",
                "severity": "HIGH",
                "frequency": "4 occurrences in past 14 days",
                "rootCause": "Severe crosswinds and seasonal agricultural convoy movement.",
                "recommendation": "Preemptively divert high-value freight via I-70 South Corridor."
            },
            {
                "id": "pat-02",
                "title": "Cold Chain Battery Degradation in Alpine Transit",
                "severity": "MEDIUM",
                "frequency": "2 occurrences this week",
                "rootCause": "Sub-zero grade ascents increasing auxiliary heater load by 28%.",
                "recommendation": "Schedule 15-minute thermal pre-conditioning at Denver Hub."
            }
        ]
    }

@router.get("/patterns")
async def get_patterns(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    return [
        {
            "id": "pat-01",
            "name": "I-80 Continental Chokepoint",
            "entity": "Route:RT-CHI-DEN-01",
            "confidenceScore": 94.2,
            "impactHours": 3.2,
            "status": "ACTIVE_MITIGATION"
        },
        {
            "id": "pat-02",
            "name": "Dallas Hub Inbound Bay Congestion",
            "entity": "Warehouse:WH-DFW",
            "confidenceScore": 88.5,
            "impactHours": 1.4,
            "status": "MONITORING"
        }
    ]

@router.get("/anomalies")
async def get_anomalies(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    return [
        {
            "id": "anom-01",
            "metric": "Velocity Deviation",
            "entityId": "v-104",
            "deviationPct": -64.0,
            "detectedAt": "2026-08-30T03:45:00Z",
            "status": "INVESTIGATING"
        }
    ]

@router.get("/events")
async def get_intelligence_events(
    limit: int = Query(50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    stmt = (
        select(OperationalEvent)
        .where(OperationalEvent.workspace_id == ws_id)
        .order_by(desc(OperationalEvent.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [
        {
            "id": e.id,
            "eventType": e.event_type,
            "entityType": e.entity_type,
            "entityId": e.entity_id,
            "severity": e.severity,
            "message": e.message,
            "occurredAt": e.occurred_at
        }
        for e in events
    ]
