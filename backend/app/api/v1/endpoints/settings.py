import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.user import Workspace

logger = logging.getLogger("nexus.settings")

router = APIRouter()

class SettingsUpdate(BaseModel):
    theme: Optional[str] = "industrial"
    notifications: Optional[bool] = True
    autoRerouteApproval: Optional[bool] = False
    telemetryRefreshSec: Optional[int] = 5

@router.get("")
async def get_settings(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve workspace settings and operational preferences.
    """
    try:
        stmt = select(Workspace).where(Workspace.id == principal.workspace_id)
        res = await db.execute(stmt)
        ws = res.scalar_one_or_none()

        settings_dict = ws.settings if (ws and ws.settings) else {}
        return {
            "workspaceId": principal.workspace_id,
            "theme": settings_dict.get("theme", "industrial"),
            "notifications": settings_dict.get("notifications", True),
            "autoRerouteApproval": settings_dict.get("autoRerouteApproval", False),
            "telemetryRefreshSec": settings_dict.get("telemetryRefreshSec", 5),
            "region": ws.region if ws else "North America Central"
        }
    except Exception as e:
        logger.error(f"Error fetching settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workspace settings")

@router.patch("")
async def update_settings(
    settings: SettingsUpdate,
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Update workspace operating preferences.
    """
    try:
        stmt = select(Workspace).where(Workspace.id == principal.workspace_id)
        res = await db.execute(stmt)
        ws = res.scalar_one_or_none()

        if ws:
            current = ws.settings or {}
            current.update(settings.model_dump(exclude_unset=True))
            ws.settings = current
            await db.commit()

        return {"success": True, "message": "Workspace settings saved"}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save workspace settings")
