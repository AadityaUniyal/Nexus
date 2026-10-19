import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import require_workspace
from app.auth.principal import RequestPrincipal
from app.models.system import Notification
from app.schemas.system import NotificationRead
from app.core.errors import EntityNotFoundException

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_tenant_workspace(principal: RequestPrincipal) -> str:
    if not principal.workspace_id:
        raise EntityNotFoundException("Workspace", "active")
    return principal.workspace_id

@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational notifications from PostgreSQL with pagination."""
    ws = get_tenant_workspace(principal)
    stmt = select(Notification).where(Notification.workspace_id == ws).order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
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
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Mark all operational notifications as read in PostgreSQL."""
    ws = get_tenant_workspace(principal)
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
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Notification).where(Notification.id == notification_id, Notification.workspace_id == ws)
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




_NOTIFICATION_RULES = [
    {"id": "rule-sla-breach", "name": "Critical SLA Breach Alerts", "channel": "EMAIL_SMS", "enabled": True, "threshold": "delay > 30m"},
    {"id": "rule-geofence-detention", "name": "Dock Detention Geofence Alarm", "channel": "IN_APP", "enabled": True, "threshold": "dwell > 120m"},
    {"id": "rule-cold-chain-excursion", "name": "Reefer Temperature Excursion", "channel": "PUSH_NOTIFICATION", "enabled": True, "threshold": "temp > 4C"},
]

@router.get("/rules")
async def get_notification_rules(principal: RequestPrincipal = Depends(require_workspace)) -> List[dict]:
    return _NOTIFICATION_RULES


@router.patch("/rules/{rule_id}/toggle")
async def toggle_notification_rule(rule_id: str, principal: RequestPrincipal = Depends(require_workspace)) -> dict:
    for r in _NOTIFICATION_RULES:
        if r["id"] == rule_id:
            r["enabled"] = not r["enabled"]
            return {"success": True, "rule_id": rule_id, "enabled": r["enabled"]}
    return {"success": True, "rule_id": rule_id, "enabled": True}
