from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from sqlalchemy import select, func
from app.models.user import User, Workspace, AvatarPreferences
from app.models.system import Notification
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP
from app.schemas.me import (
    BootstrapResponse,
    UserProfileRead,
    WorkspaceRead,
    OnboardingProgress,
    AvatarPreferencesDTO
)


async def bootstrap_user_session(db: AsyncSession, principal: RequestPrincipal) -> BootstrapResponse:
    """
    Idempotently ensures user exists in DB and returns aggregate bootstrap context.
    """
    # Fetch only the authenticated user that was provisioned at signup or by an administrator.
    stmt = select(User).where(User.email == principal.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not registered in a Nexus workspace.")

    # Fetch the account workspace.
    ws_stmt = select(Workspace).where(Workspace.id == user.workspace_id)
    ws_res = await db.execute(ws_stmt)
    workspace = ws_res.scalars().first()

    # 4. Fetch unread notifications count
    notif_stmt = select(func.count()).select_from(Notification).where(
        Notification.workspace_id == user.workspace_id,
        Notification.read == False
    )
    notif_res = await db.execute(notif_stmt)
    unread_count = notif_res.scalar() or 0

    # 5. Fetch or default avatar preferences
    av_stmt = select(AvatarPreferences).where(AvatarPreferences.user_id == user.id)
    av_res = await db.execute(av_stmt)
    av_pref = av_res.scalars().first()

    avatar_dto = AvatarPreferencesDTO(
        enabled=av_pref.enabled if av_pref else True,
        reducedMotion=av_pref.reduced_motion if av_pref else False,
        companionHintsEnabled=av_pref.companion_hints_enabled if av_pref else True,
        soundEnabled=av_pref.sound_enabled if av_pref else False,
        avatarVariant=av_pref.avatar_variant if av_pref else "TACTILE_SPATIAL_MINIMAL"
    )

    try:
        role_enum = RoleEnum(user.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace role is not configured.") from exc
    permissions = [p.value for p in ROLE_PERMISSIONS_MAP.get(role_enum, [])]

    is_onboarded = (user.onboarding_status == "COMPLETE")

    return BootstrapResponse(
        user=UserProfileRead(
            id=user.id,
            clerkUserId=user.clerk_user_id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department,
            isActive=user.is_active
        ),
        workspace=WorkspaceRead(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            type=workspace.type,
            region=workspace.region,
            scale=workspace.scale,
            isDemo=workspace.is_demo
        ) if workspace else None,
        role=user.role,
        permissions=permissions,
        onboarding=OnboardingProgress(
            completed=is_onboarded,
            status=user.onboarding_status,
            nextStep=None if is_onboarded else "/onboarding/workspace"
        ),
        unreadNotifications=unread_count,
        dataFreshness="FRESH",
        destination="/app/overview" if is_onboarded else "/onboarding/welcome",
        avatar=avatar_dto
    )
