import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
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
    Idempotently ensures user exists in DB and returns the aggregate bootstrap context.
    """
    # 1. Fetch user or ensure created
    stmt = select(User).where(User.email == principal.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Check if default workspace exists
        ws_stmt = select(Workspace).limit(1)
        ws_res = await db.execute(ws_stmt)
        default_ws = ws_res.scalars().first()

        if not default_ws:
            default_ws = Workspace(
                id="ws-continental-fleet-01",
                name="Continental Freight Network",
                slug="continental-freight-network",
                type="ENTERPRISE_LOGISTICS",
                region="US_CENTRAL",
                scale="NATIONAL_NETWORK",
                is_demo=True,
                is_active=True
            )
            db.add(default_ws)
            await db.flush()

        user = User(
            id=principal.nexus_user_id or f"usr-{uuid.uuid4().hex[:8]}",
            clerk_user_id=principal.clerk_user_id,
            email=principal.email,
            name=principal.display_name or "Sarah Chen",
            role=principal.role.value if hasattr(principal.role, "value") else str(principal.role),
            department="Continental Logistics",
            onboarding_status="COMPLETE",
            workspace_id=default_ws.id,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 2. Fetch workspace
    ws_stmt = select(Workspace).where(Workspace.id == user.workspace_id)
    ws_res = await db.execute(ws_stmt)
    workspace = ws_res.scalars().first()

    # 3. Fetch unread notifications count
    notif_stmt = select(func.count()).select_from(Notification).where(
        Notification.workspace_id == user.workspace_id,
        Notification.read == False
    )
    notif_res = await db.execute(notif_stmt)
    unread_count = notif_res.scalar() or 0

    # 4. Fetch or default avatar preferences
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

    role_enum = RoleEnum(user.role) if user.role in RoleEnum.__members__ else RoleEnum.OPERATIONS_MANAGER
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
