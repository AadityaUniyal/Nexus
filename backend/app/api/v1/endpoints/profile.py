import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.user import User

logger = logging.getLogger("nexus.profile")

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    department: Optional[str] = None
    avatarUrl: Optional[str] = None

@router.get("")
async def get_profile(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve current authenticated user profile details from database.
    """
    try:
        stmt = select(User).where(User.id == principal.nexus_user_id)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        return {
            "id": principal.nexus_user_id,
            "email": principal.email,
            "name": user.name if user else principal.display_name,
            "role": principal.role.value,
            "department": user.department if user else "Logistics Command",
            "workspaceId": principal.workspace_id,
            "avatarUrl": user.avatar_url if user else None,
        }
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.patch("")
async def update_profile(
    profile: ProfileUpdate,
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Update authenticated user profile details.
    """
    try:
        stmt = select(User).where(User.id == principal.nexus_user_id)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if user:
            if profile.name:
                user.name = profile.name
            if profile.department:
                user.department = profile.department
            if profile.avatarUrl:
                user.avatar_url = profile.avatarUrl
            await db.commit()

        return {
            "success": True,
            "message": "Profile updated successfully",
            "name": profile.name or principal.display_name
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
