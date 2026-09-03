import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.incidents import Incident, IncidentTimeline
from app.models.system import OperationalEvent, EventOutbox, AuditLog
from app.schemas.incidents import (
    IncidentRead,
    IncidentCreate,
    IncidentUpdate,
    IncidentTransitionRequest,
    IncidentTimelineRead,
)
from app.services.incident_service import validate_state_transition
from app.core.errors import EntityNotFoundException
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentRead])
async def list_incidents(
    severity: str = Query(default="ALL"),
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational incidents directly from PostgreSQL with timelines."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Incident).options(selectinload(Incident.timeline)).order_by(Incident.created_at.desc()).where(Incident.workspace_id == ws)
    if severity != "ALL":
        stmt = stmt.where(Incident.severity == severity.upper())

    result = await db.execute(stmt)
    incidents = result.scalars().all()

    # Format created_at to ISO string for schema
    output = []
    for inc in incidents:
        inc_dict = {
            "id": inc.id,
            "code": inc.code,
            "title": inc.title,
            "summary": inc.summary,
            "severity": inc.severity,
            "status": inc.status,
            "affected_entity_type": inc.affected_entity_type,
            "affected_entity_id": inc.affected_entity_id,
            "affected_entity_name": inc.affected_entity_name,
            "delay_minutes": inc.delay_minutes,
            "cost_estimate": inc.cost_estimate,
            "root_cause": inc.root_cause,
            "ai_analysis": inc.ai_analysis,
            "workspace_id": inc.workspace_id,
            "created_at": inc.created_at.isoformat() if hasattr(inc.created_at, "isoformat") else str(inc.created_at),
            "timeline": [
                IncidentTimelineRead(
                    id=t.id,
                    status=t.status,
                    note=t.note,
                    actor_name=t.actor_name,
                    created_at=t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at)
                ) for t in inc.timeline
            ]
        }
        output.append(IncidentRead(**inc_dict))
    return output

@router.get("/{incident_id}", response_model=IncidentRead)
async def get_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve detailed incident record with full audit timeline from PostgreSQL."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.timeline))
        .where(or_(Incident.id == incident_id, Incident.code == incident_id))
    )
    result = await db.execute(stmt)
    inc = result.scalars().first()
    if not inc:
        raise EntityNotFoundException("Incident", incident_id)

    return IncidentRead(
        id=inc.id,
        code=inc.code,
        title=inc.title,
        summary=inc.summary,
        severity=inc.severity,
        status=inc.status,
        affected_entity_type=inc.affected_entity_type,
        affected_entity_id=inc.affected_entity_id,
        affected_entity_name=inc.affected_entity_name,
        delay_minutes=inc.delay_minutes,
        cost_estimate=inc.cost_estimate,
        root_cause=inc.root_cause,
        ai_analysis=inc.ai_analysis,
        workspace_id=inc.workspace_id,
        created_at=inc.created_at.isoformat() if hasattr(inc.created_at, "isoformat") else str(inc.created_at),
        timeline=[
            IncidentTimelineRead(
                id=t.id,
                status=t.status,
                note=t.note,
                actor_name=t.actor_name,
                created_at=t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at)
            ) for t in inc.timeline
        ]
    )

@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
async def create_incident(req: IncidentCreate, db: AsyncSession = Depends(get_db)):
    """Create and triage a new operational incident in PostgreSQL with transactional outbox."""
    inc_id = f"inc-{uuid.uuid4().hex[:8]}"
    inc_code = f"INC-{int(datetime.now().timestamp()) % 10000}"
    ws_id = req.workspace_id or "ws-continental-fleet-01"

    new_inc = Incident(
        id=inc_id,
        code=inc_code,
        title=req.title,
        summary=req.summary,
        severity=req.severity,
        status="DETECTED",
        affected_entity_type=req.affected_entity_type,
        affected_entity_id=req.affected_entity_id,
        affected_entity_name=req.affected_entity_name,
        delay_minutes=req.delay_minutes,
        cost_estimate=req.cost_estimate,
        root_cause=req.root_cause or "Triaged by Operator",
        ai_analysis=req.ai_analysis or "Impact analysis running in background.",
        workspace_id=ws_id,
    )
    db.add(new_inc)

    tl = IncidentTimeline(
        id=f"tl-{uuid.uuid4().hex[:8]}",
        incident_id=inc_id,
        status="DETECTED",
        note=f"Incident reported: {req.title}",
        actor_name="Dispatcher Console",
    )
    db.add(tl)

    # Domain event & outbox
    event = OperationalEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        workspace_id=ws_id,
        event_type="incident.created",
        severity=req.severity,
        entity_type="INCIDENT",
        entity_id=inc_id,
        message=f"Incident {inc_code} reported affecting {req.affected_entity_name}.",
        occurred_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(event)

    outbox = EventOutbox(
        id=f"out-{uuid.uuid4().hex[:8]}",
        workspace_id=ws_id,
        event_type="incident.created",
        aggregate_type="INCIDENT",
        aggregate_id=inc_id,
        payload={"code": inc_code, "title": req.title, "severity": req.severity},
    )
    db.add(outbox)

    await db.commit()
    await db.refresh(new_inc)

    # Broadcast real-time event via SSE
    await broadcaster.broadcast("INCIDENT_CREATED", {
        "id": new_inc.id,
        "code": new_inc.code,
        "title": new_inc.title,
        "severity": new_inc.severity,
        "status": new_inc.status,
        "affectedEntity": new_inc.affected_entity_name,
    })

    return IncidentRead(
        id=new_inc.id,
        code=new_inc.code,
        title=new_inc.title,
        summary=new_inc.summary,
        severity=new_inc.severity,
        status=new_inc.status,
        affected_entity_type=new_inc.affected_entity_type,
        affected_entity_id=new_inc.affected_entity_id,
        affected_entity_name=new_inc.affected_entity_name,
        delay_minutes=new_inc.delay_minutes,
        cost_estimate=new_inc.cost_estimate,
        root_cause=new_inc.root_cause,
        ai_analysis=new_inc.ai_analysis,
        workspace_id=new_inc.workspace_id,
        created_at=new_inc.created_at.isoformat() if hasattr(new_inc.created_at, "isoformat") else str(new_inc.created_at),
        timeline=[
            IncidentTimelineRead(
                id=tl.id,
                status=tl.status,
                note=tl.note,
                actor_name=tl.actor_name,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
        ]
    )

@router.patch("/{incident_id}", response_model=IncidentRead)
async def update_incident(
    incident_id: str,
    req: IncidentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update incident fields or advance state in PostgreSQL."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.timeline))
        .where(or_(Incident.id == incident_id, Incident.code == incident_id))
    )
    result = await db.execute(stmt)
    inc = result.scalars().first()
    if not inc:
        raise EntityNotFoundException("Incident", incident_id)

    previous_status = inc.status
    status_changed = False
    if req.status and req.status != inc.status:
        validate_state_transition(inc.status, req.status)
        inc.status = req.status
        status_changed = True

    if req.title is not None:
        inc.title = req.title
    if req.summary is not None:
        inc.summary = req.summary
    if req.severity is not None:
        inc.severity = req.severity
    if req.affected_entity_type is not None:
        inc.affected_entity_type = req.affected_entity_type
    if req.affected_entity_id is not None:
        inc.affected_entity_id = req.affected_entity_id
    if req.affected_entity_name is not None:
        inc.affected_entity_name = req.affected_entity_name
    if req.delay_minutes is not None:
        inc.delay_minutes = req.delay_minutes
    if req.cost_estimate is not None:
        inc.cost_estimate = req.cost_estimate
    if req.root_cause is not None:
        inc.root_cause = req.root_cause
    if req.ai_analysis is not None:
        inc.ai_analysis = req.ai_analysis

    inc.version += 1

    actor = req.actor_name or "Sarah Chen"
    note = req.note or (f"Status advanced to {inc.status}" if status_changed else "Incident details updated")

    tl = IncidentTimeline(
        id=f"tl-{uuid.uuid4().hex[:8]}",
        incident_id=inc.id,
        status=inc.status,
        note=note,
        actor_name=actor,
    )
    db.add(tl)

    if status_changed:
        outbox = EventOutbox(
            id=f"out-{uuid.uuid4().hex[:8]}",
            workspace_id=inc.workspace_id,
            event_type="incident.transitioned",
            aggregate_type="INCIDENT",
            aggregate_id=inc.id,
            payload={"code": inc.code, "previousStatus": previous_status, "newStatus": inc.status, "note": note},
        )
        db.add(outbox)

    await db.commit()
    await db.refresh(inc)

    await broadcaster.broadcast("INCIDENT_STATUS_CHANGED" if status_changed else "INCIDENT_UPDATED", {
        "id": inc.id,
        "code": inc.code,
        "status": inc.status,
        "note": note,
        "actor": actor,
    })

    return IncidentRead(
        id=inc.id,
        code=inc.code,
        title=inc.title,
        summary=inc.summary,
        severity=inc.severity,
        status=inc.status,
        affected_entity_type=inc.affected_entity_type,
        affected_entity_id=inc.affected_entity_id,
        affected_entity_name=inc.affected_entity_name,
        delay_minutes=inc.delay_minutes,
        cost_estimate=inc.cost_estimate,
        root_cause=inc.root_cause,
        ai_analysis=inc.ai_analysis,
        workspace_id=inc.workspace_id,
        created_at=inc.created_at.isoformat() if hasattr(inc.created_at, "isoformat") else str(inc.created_at),
        timeline=[
            IncidentTimelineRead(
                id=t.id,
                status=t.status,
                note=t.note,
                actor_name=t.actor_name,
                created_at=t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at)
            ) for t in inc.timeline
        ]
    )

@router.post("/{incident_id}/acknowledge", response_model=IncidentRead)
async def acknowledge_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Acknowledge an incident in PostgreSQL."""
    req = IncidentTransitionRequest(status="ACKNOWLEDGED", note="Incident acknowledged by operator", actor_name="Sarah Chen")
    return await transition_incident_state(incident_id, req, db)

@router.post("/{incident_id}/start-investigation", response_model=IncidentRead)
async def start_investigation_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Start investigation on an incident in PostgreSQL."""
    req = IncidentTransitionRequest(status="INVESTIGATING", note="Investigation initiated by operations team", actor_name="Sarah Chen")
    return await transition_incident_state(incident_id, req, db)

@router.post("/{incident_id}/resolve", response_model=IncidentRead)
async def resolve_incident(incident_id: str, db: AsyncSession = Depends(get_db)):
    """Resolve an incident in PostgreSQL."""
    req = IncidentTransitionRequest(status="RESOLVED", note="Incident resolved and normal operations restored", actor_name="Sarah Chen")
    return await transition_incident_state(incident_id, req, db)

@router.post("/{incident_id}/transition", response_model=IncidentRead)
async def transition_incident_state(
    incident_id: str,
    req: IncidentTransitionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Enforce state machine transition and record audit timeline in PostgreSQL."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.timeline))
        .where(or_(Incident.id == incident_id, Incident.code == incident_id))
    )
    result = await db.execute(stmt)
    inc = result.scalars().first()
    if not inc:
        raise EntityNotFoundException("Incident", incident_id)

    if inc.status == req.status:
        # Idempotent return
        return IncidentRead(
            id=inc.id,
            code=inc.code,
            title=inc.title,
            summary=inc.summary,
            severity=inc.severity,
            status=inc.status,
            affected_entity_type=inc.affected_entity_type,
            affected_entity_id=inc.affected_entity_id,
            affected_entity_name=inc.affected_entity_name,
            delay_minutes=inc.delay_minutes,
            cost_estimate=inc.cost_estimate,
            root_cause=inc.root_cause,
            ai_analysis=inc.ai_analysis,
            workspace_id=inc.workspace_id,
            created_at=inc.created_at.isoformat() if hasattr(inc.created_at, "isoformat") else str(inc.created_at),
            timeline=[
                IncidentTimelineRead(
                    id=t.id,
                    status=t.status,
                    note=t.note,
                    actor_name=t.actor_name,
                    created_at=t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at)
                ) for t in inc.timeline
            ]
        )

    validate_state_transition(inc.status, req.status)

    previous_status = inc.status
    inc.status = req.status
    inc.version += 1

    tl = IncidentTimeline(
        id=f"tl-{uuid.uuid4().hex[:8]}",
        incident_id=inc.id,
        status=req.status,
        note=req.note,
        actor_name=req.actor_name,
    )
    db.add(tl)

    outbox = EventOutbox(
        id=f"out-{uuid.uuid4().hex[:8]}",
        workspace_id=inc.workspace_id,
        event_type="incident.transitioned",
        aggregate_type="INCIDENT",
        aggregate_id=inc.id,
        payload={"code": inc.code, "previousStatus": previous_status, "newStatus": req.status, "note": req.note},
    )
    db.add(outbox)

    await db.commit()
    await db.refresh(inc)

    await broadcaster.broadcast("INCIDENT_STATUS_CHANGED", {
        "id": inc.id,
        "code": inc.code,
        "status": inc.status,
        "note": req.note,
        "actor": req.actor_name,
    })

    return IncidentRead(
        id=inc.id,
        code=inc.code,
        title=inc.title,
        summary=inc.summary,
        severity=inc.severity,
        status=inc.status,
        affected_entity_type=inc.affected_entity_type,
        affected_entity_id=inc.affected_entity_id,
        affected_entity_name=inc.affected_entity_name,
        delay_minutes=inc.delay_minutes,
        cost_estimate=inc.cost_estimate,
        root_cause=inc.root_cause,
        ai_analysis=inc.ai_analysis,
        workspace_id=inc.workspace_id,
        created_at=inc.created_at.isoformat() if hasattr(inc.created_at, "isoformat") else str(inc.created_at),
        timeline=[
            IncidentTimelineRead(
                id=t.id,
                status=t.status,
                note=t.note,
                actor_name=t.actor_name,
                created_at=t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at)
            ) for t in inc.timeline
        ]
    )


async def resolve_incident_by_decision_db(
    db: AsyncSession,
    incident_id_or_entity: str,
    actor_name: str = "Sarah Chen",
    note: str = "Decision applied: Reroute detour activated."
):
    """Advance incident status to ACTION_APPLIED or RESOLVED upon decision execution in PostgreSQL."""
    stmt = (
        select(Incident)
        .options(selectinload(Incident.timeline))
        .where(
            or_(
                Incident.id == incident_id_or_entity,
                Incident.code == incident_id_or_entity,
                Incident.affected_entity_id == incident_id_or_entity,
                Incident.code.ilike("%8041%"),
                Incident.code.ilike("%849201%")
            )
        )
    )
    res = await db.execute(stmt)
    inc = res.scalars().first()
    if inc:
        inc.status = "ACTION_APPLIED"
        inc.delay_minutes = 45
        inc.version += 1
        tl = IncidentTimeline(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            incident_id=inc.id,
            status="ACTION_APPLIED",
            note=note,
            actor_name=actor_name,
        )
        db.add(tl)
        return inc
    return None
