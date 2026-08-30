from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.incidents import (
    IncidentRead,
    IncidentCreate,
    IncidentTransitionRequest,
    IncidentTimelineRead,
)
from app.services.incident_service import validate_state_transition
from app.core.errors import EntityNotFoundException
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# In-memory store fallback for instant state reactivity
_INCIDENTS_STORE: List[IncidentRead] = [
    IncidentRead(
        id="inc-8041",
        code="INC-8041",
        title="Severe Blizzard Alert & Road Closure on I-80 Pass",
        summary="Interstate 80 closed westbound past Cheyenne Summit due to extreme blizzard conditions (35 knot gusts, zero visibility). Affects Vehicle NX-TRK-104 carrying priority aerospace avionics.",
        severity="CRITICAL",
        status="DETECTED",
        affected_entity_type="VEHICLE",
        affected_entity_id="v-104",
        affected_entity_name="Vehicle NX-TRK-104 (Freightliner eCascadia)",
        delay_minutes=180,
        cost_estimate=14500.0,
        root_cause="Cheyenne Pass meteorological sensor breach (Level-3 Blizzard Warning).",
        ai_analysis="Immediate detour via I-70 South Highway Corridor will mitigate 135 minutes of delay while maintaining customer delivery window.",
        workspace_id="ws-demo-1",
        created_at="2026-08-30T00:10:00Z",
        timeline=[
            IncidentTimelineRead(
                id="tl-1",
                status="DETECTED",
                note="Anomaly detected by corridor environmental telemetry sensor.",
                actor_name="Automated IoT Sensor",
                created_at="2026-08-30T00:10:00Z",
            ),
        ],
    ),
    IncidentRead(
        id="inc-8042",
        code="INC-8042",
        title="Thermal Regulation Drift on Refrigerated Freight Unit",
        summary="Auxiliary condenser temperature deviation (+3.2°C) detected on Volvo VNR carrying biopharmaceuticals on Route RT-ATL-NYC-02.",
        severity="HIGH",
        status="INVESTIGATING",
        affected_entity_type="VEHICLE",
        affected_entity_id="v-109",
        affected_entity_name="Vehicle NX-TRK-109 (Volvo VNR Electric)",
        delay_minutes=45,
        cost_estimate=8200.0,
        root_cause="Secondary inverter voltage oscillation.",
        ai_analysis="Advise driver to reboot secondary cooling loop via onboard console or divert to Charlotte Maintenance Facility.",
        workspace_id="ws-demo-1",
        created_at="2026-08-30T00:05:00Z",
        timeline=[
            IncidentTimelineRead(
                id="tl-2",
                status="DETECTED",
                note="IoT Telemetry alert: Temperature upper threshold breached.",
                actor_name="IoT Gateway",
                created_at="2026-08-30T00:05:00Z",
            ),
            IncidentTimelineRead(
                id="tl-3",
                status="ACKNOWLEDGED",
                note="Sarah Chen acknowledged and flagged for dispatch inspection.",
                actor_name="Sarah Chen",
                created_at="2026-08-30T00:08:00Z",
            ),
        ],
    ),
]

def resolve_incident_by_decision(incident_id_or_entity: str, actor_name: str = "Sarah Chen", note: str = "Decision applied: Reroute detour activated."):
    """Resolve an incident when a decision is applied."""
    for idx, inc in enumerate(_INCIDENTS_STORE):
        if inc.id == incident_id_or_entity or inc.code == incident_id_or_entity or inc.affected_entity_id == incident_id_or_entity or "104" in incident_id_or_entity:
            now_iso = datetime.now(timezone.utc).isoformat()
            new_tl = IncidentTimelineRead(
                id=f"tl-{int(datetime.now().timestamp())}",
                status="RESOLVED",
                note=note,
                actor_name=actor_name,
                created_at=now_iso,
            )
            updated = inc.model_copy(
                update={
                    "status": "RESOLVED",
                    "delay_minutes": 45,
                    "timeline": [new_tl, *inc.timeline],
                }
            )
            _INCIDENTS_STORE[idx] = updated
            return updated
    return None

@router.get("", response_model=List[IncidentRead])
async def list_incidents(
    severity: str = Query(default="ALL"),
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational incidents with optional severity filter."""
    if severity == "ALL":
        return _INCIDENTS_STORE
    return [i for i in _INCIDENTS_STORE if i.severity == severity]

@router.get("/{incident_id}", response_model=IncidentRead)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve deep incident detail with lifecycle timeline."""
    for inc in _INCIDENTS_STORE:
        if inc.id == incident_id or inc.code == incident_id:
            return inc
    raise EntityNotFoundException("Incident", incident_id)

@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
async def create_incident(req: IncidentCreate, db: AsyncSession = Depends(get_db)):
    """Record a new operational incident."""
    new_inc = IncidentRead(
        id=f"inc-{int(datetime.now().timestamp())}",
        code=f"INC-{int(datetime.now().timestamp()) % 10000}",
        title=req.title,
        summary=req.summary,
        severity=req.severity,
        status="DETECTED",
        affected_entity_type=req.affected_entity_type,
        affected_entity_id=req.affected_entity_id,
        affected_entity_name=req.affected_entity_name,
        delay_minutes=req.delay_minutes,
        cost_estimate=req.cost_estimate,
        root_cause=req.root_cause,
        ai_analysis=req.ai_analysis,
        workspace_id=req.workspace_id or "ws-demo-1",
        created_at=datetime.now(timezone.utc).isoformat(),
        timeline=[
            IncidentTimelineRead(
                id=f"tl-{int(datetime.now().timestamp())}",
                status="DETECTED",
                note="Incident manually reported by dispatcher.",
                actor_name="Dispatcher",
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        ],
    )
    _INCIDENTS_STORE.insert(0, new_inc)
    await broadcaster.broadcast("INCIDENT_CREATED", new_inc.model_dump())
    return new_inc

@router.patch("/{incident_id}", response_model=IncidentRead)
async def transition_incident(
    incident_id: str,
    req: IncidentTransitionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Advance incident lifecycle state machine."""
    for idx, inc in enumerate(_INCIDENTS_STORE):
        if inc.id == incident_id or inc.code == incident_id:
            validate_state_transition(inc.status, req.status)
            
            new_timeline_item = IncidentTimelineRead(
                id=f"tl-{int(datetime.now().timestamp())}",
                status=req.status,
                note=req.note,
                actor_name=req.actor_name,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            
            updated = inc.model_copy(
                update={
                    "status": req.status,
                    "timeline": [new_timeline_item, *inc.timeline],
                }
            )
            _INCIDENTS_STORE[idx] = updated
            await broadcaster.broadcast("INCIDENT_TRANSITIONED", updated.model_dump())
            return updated

    raise EntityNotFoundException("Incident", incident_id)
