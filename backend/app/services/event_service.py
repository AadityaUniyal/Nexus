import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system import OperationalEvent, EventOutbox
from app.realtime.sse import broadcaster

async def record_operational_event(
    db: AsyncSession,
    workspace_id: str,
    event_type: str,
    entity_type: str,
    entity_id: str,
    message: str,
    severity: str = "INFO",
    payload: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> OperationalEvent:
    """
    Creates an OperationalEvent and enqueues an EventOutbox item in the same transaction.
    Also dispatches realtime event through SSE broadcaster.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    event_id = f"evt-{uuid.uuid4().hex[:12]}"

    evt = OperationalEvent(
        id=event_id,
        workspace_id=workspace_id,
        event_type=event_type,
        severity=severity,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
        occurred_at=now_iso,
        request_id=request_id
    )
    db.add(evt)

    outbox = EventOutbox(
        id=f"outbox-{uuid.uuid4().hex[:12]}",
        workspace_id=workspace_id,
        event_type=event_type,
        aggregate_type=entity_type,
        aggregate_id=entity_id,
        payload=payload or {"message": message, "severity": severity},
        attempts=0
    )
    db.add(outbox)

    # Broadcast event via SSE in memory
    await broadcaster.broadcast_event(
        event_type=event_type,
        data={
            "id": event_id,
            "type": event_type,
            "severity": severity,
            "entityType": entity_type,
            "entityId": entity_id,
            "message": message,
            "occurredAt": now_iso,
            "payload": payload or {}
        }
    )

    return evt
