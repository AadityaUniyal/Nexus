from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.system import NotificationRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])

_NOTIFICATIONS_STORE: List[NotificationRead] = [
    NotificationRead(
        id="notif-1",
        workspace_id="ws-demo-1",
        type="CRITICAL",
        title="Severe Blizzard Alert on I-80 Pass",
        message="Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.",
        deep_link="/incidents/inc-8041",
        read=False,
        created_at="2026-08-30T00:10:00Z",
    ),
    NotificationRead(
        id="notif-2",
        workspace_id="ws-demo-1",
        type="ATTENTION",
        title="Thermal Unit Drift on NX-TRK-109",
        message="Auxiliary condenser temperature deviation (+3.2°C) detected on Volvo VNR Electric.",
        deep_link="/incidents/inc-8042",
        read=False,
        created_at="2026-08-30T00:05:00Z",
    ),
    NotificationRead(
        id="notif-3",
        workspace_id="ws-demo-1",
        type="SIMULATION",
        title="Simulation Ready: I-70 Detour Analysis",
        message="Scenario SIM-SCENARIO-901 shows 135 mins net time recovery with 94% recommendation score.",
        deep_link="/simulations/sim-901",
        read=True,
        created_at="2026-08-30T00:00:00Z",
    ),
]

@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all operational notifications."""
    return _NOTIFICATIONS_STORE

@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(notification_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a notification as read."""
    for idx, notif in enumerate(_NOTIFICATIONS_STORE):
        if notif.id == notification_id:
            updated = notif.model_copy(update={"read": True})
            _NOTIFICATIONS_STORE[idx] = updated
            return updated
    return _NOTIFICATIONS_STORE[0]
