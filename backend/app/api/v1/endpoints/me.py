from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import get_current_principal, require_authenticated
from app.auth.principal import RequestPrincipal
from app.schemas.me import BootstrapResponse, AvatarPreferencesDTO
from app.services.bootstrap_service import bootstrap_user_session
from app.models.user import AvatarPreferences

router = APIRouter()

@router.get("/bootstrap", response_model=BootstrapResponse)
async def get_bootstrap_context(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns aggregated bootstrap context: identity, workspace, RBAC permissions, onboarding state, avatar prefs.
    """
    return await bootstrap_user_session(db, principal)

@router.get("/avatar", response_model=AvatarPreferencesDTO)
async def get_avatar_preferences(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AvatarPreferences).where(AvatarPreferences.user_id == principal.nexus_user_id)
    res = await db.execute(stmt)
    av = res.scalars().first()
    if not av:
        return AvatarPreferencesDTO()
    return AvatarPreferencesDTO(
        enabled=av.enabled,
        reducedMotion=av.reduced_motion,
        companionHintsEnabled=av.companion_hints_enabled,
        soundEnabled=av.sound_enabled,
        avatarVariant=av.avatar_variant
    )

@router.patch("/avatar", response_model=AvatarPreferencesDTO)
async def update_avatar_preferences(
    req: AvatarPreferencesDTO,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AvatarPreferences).where(AvatarPreferences.user_id == principal.nexus_user_id)
    res = await db.execute(stmt)
    av = res.scalars().first()
    if not av:
        av = AvatarPreferences(
            user_id=principal.nexus_user_id,
            enabled=req.enabled,
            reduced_motion=req.reducedMotion,
            companion_hints_enabled=req.companionHintsEnabled,
            sound_enabled=req.soundEnabled,
            avatar_variant=req.avatarVariant
        )
        db.add(av)
    else:
        av.enabled = req.enabled
        av.reduced_motion = req.reducedMotion
        av.companion_hints_enabled = req.companionHintsEnabled
        av.sound_enabled = req.soundEnabled
        av.avatar_variant = req.avatarVariant
    await db.commit()
    return req
