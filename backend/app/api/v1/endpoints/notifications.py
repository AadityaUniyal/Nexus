import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.system import Notification
from app.schemas.system import NotificationRead
from app.core.errors import EntityNotFoundException

router = APIRouter(prefix="/notifications", tags=["Notifications"])

INITIAL_NOTIFICATIONS = [
    {
        "id": "notif-1",
        "workspace_id": "ws-continental-fleet-01",
        "type": "CRITICAL",
        "title": "Severe Blizzard Alert on I-80 Pass",
        "message": "Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.",
        "deep_link": "/incidents/inc-8041",
        "read": False,
    },
    {
        "id": "notif-2",
        "workspace_id": "ws-continental-fleet-01",
        "type": "ATTENTION",
        "title": "Thermal Unit Drift on NX-TRK-109",
        "message": "Auxiliary condenser temperature deviation (+3.2°C) detected on Volvo VNR Electric.",
        "deep_link": "/incidents/inc-8042",
        "read": False,
    },
    {
        "id": "notif-3",
        "workspace_id": "ws-continental-fleet-01",
        "type": "SIMULATION",
        "title": "Simulation Ready: I-70 Detour Analysis",
        "message": "Scenario SIM-SCENARIO-901 shows 135 mins net time recovery with 94% recommendation score.",
        "deep_link": "/simulations/sim-901",
        "read": True,
    },
]

@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all operational notifications from PostgreSQL."""
    stmt = select(Notification).order_by(Notification.created_at.desc())
    if workspace_id and workspace_id != "ws-demo-1":
        stmt = stmt.where(Notification.workspace_id == workspace_id)
    result = await db.execute(stmt)
    notifs = result.scalars().all()

    if not notifs:
        ws_id = workspace_id or "ws-continental-fleet-01"
        for n_data in INITIAL_NOTIFICATIONS:
            n = Notification(**{**n_data, "workspace_id": ws_id})
            db.add(n)
        await db.commit()
        result = await db.execute(select(Notification).order_by(Notification.created_at.desc()))
        notifs = result.scalars().all()

    return [
        NotificationRead(
            id=n.id,
            workspace_id=n.workspace_id,
            type=n.type,
            title=n.title,
            message=n.message,
            deep_link=n.deep_link,
            read=n.read,
            created_at=n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at),
        ) for n in notifs
    ]

@router.post("/read-all")
async def mark_all_notifications_read(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Mark all operational notifications as read in PostgreSQL."""
    stmt = select(Notification).where(Notification.read == False)
    if workspace_id and workspace_id != "ws-demo-1":
        stmt = stmt.where(Notification.workspace_id == workspace_id)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    for n in notifs:
        n.read = True
    await db.commit()
    return {"success": True, "markedReadCount": len(notifs)}

@router.patch("/{notification_id}/read", response_model=NotificationRead)
@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(notification_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a notification as read in PostgreSQL."""
    stmt = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(stmt)
    notif = result.scalars().first()
    if not notif:
        raise EntityNotFoundException("Notification", notification_id)

    notif.read = True
    await db.commit()
    await db.refresh(notif)

    return NotificationRead(
        id=notif.id,
        workspace_id=notif.workspace_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        deep_link=notif.deep_link,
        read=notif.read,
        created_at=notif.created_at.isoformat() if hasattr(notif.created_at, "isoformat") else str(notif.created_at),
    )

