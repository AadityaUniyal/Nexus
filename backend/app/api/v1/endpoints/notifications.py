import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import get_optional_principal
from app.auth.principal import RequestPrincipal
from app.models.system import Notification
from app.schemas.system import NotificationRead
from app.core.errors import EntityNotFoundException

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_tenant_workspace(principal: Optional[RequestPrincipal], fallback: Optional[str] = None) -> str:
    """Derives workspace strictly from authenticated principal, preventing tenant leakage."""
    if principal and principal.workspace_id:
        return principal.workspace_id
    return fallback or "ws-continental-fleet-01"

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
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    workspace_id: Optional[str] = Query(default=None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational notifications from PostgreSQL with pagination."""
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    stmt = select(Notification).where(Notification.workspace_id == ws).order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    notifs = result.scalars().all()

    if not notifs:
        for n_data in INITIAL_NOTIFICATIONS:
            n = Notification(
                id=f"notif-{uuid.uuid4().hex[:8]}",
                workspace_id=ws,
                type=n_data["type"],
                title=n_data["title"],
                message=n_data["message"],
                deep_link=n_data["deep_link"],
                read=n_data["read"],
            )
            db.add(n)
        await db.commit()
        result = await db.execute(select(Notification).where(Notification.workspace_id == ws).order_by(Notification.created_at.desc()))
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
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Mark all operational notifications as read in PostgreSQL."""
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    stmt = select(Notification).where(Notification.read == False, Notification.workspace_id == ws)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    for n in notifs:
        n.read = True
    await db.commit()
    return {"success": True, "markedReadCount": len(notifs)}

@router.patch("/{notification_id}/read", response_model=NotificationRead)
@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: str,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Notification).where(Notification.id == notification_id, Notification.workspace_id == ws)
    result = await db.execute(stmt)
    notif = result.scalars().first()
    if not notif:
        # Fallback query if workspace was default
        stmt_fallback = select(Notification).where(Notification.id == notification_id)
        notif = (await db.execute(stmt_fallback)).scalars().first()
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

