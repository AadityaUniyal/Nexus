import uuid
from typing import Dict, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, Workspace, WorkspaceMembership
from app.auth.principal import PermissionEnum, RequestPrincipal
from app.core.errors import ForbiddenException
from app.schemas.onboarding import (
    OnboardingStateRead,
    WorkspaceCreateRequest,
    EnvironmentSetupRequest,
    RolePreferenceRequest,
    NotificationsSetupRequest,
    OnboardingCompleteResponse
)
from app.services.audit_service import log_audit_action
from app.services.event_service import record_operational_event

STEP_MAP = {
    "NOT_STARTED": 1,
    "WELCOME_COMPLETED": 2,
    "WORKSPACE_COMPLETED": 3,
    "ENVIRONMENT_COMPLETED": 4,
    "ROLE_PREFERENCE_COMPLETED": 5,
    "NOTIFICATIONS_COMPLETED": 5,
    "COMPLETE": 5,
}

async def get_onboarding_state(db: AsyncSession, principal: RequestPrincipal) -> OnboardingStateRead:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    status = user.onboarding_status if user else "NOT_STARTED"
    return OnboardingStateRead(
        status=status,
        completed=(status == "COMPLETE"),
        currentStep=STEP_MAP.get(status, 1),
        totalSteps=5,
        workspaceId=user.workspace_id if user else None,
        rolePreference=user.role if user else None
    )

async def advance_welcome(db: AsyncSession, principal: RequestPrincipal) -> OnboardingStateRead:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user:
        user.onboarding_status = "WELCOME_COMPLETED"
        await db.commit()
    return await get_onboarding_state(db, principal)

async def create_workspace_step(db: AsyncSession, principal: RequestPrincipal, req: WorkspaceCreateRequest) -> OnboardingStateRead:
    if not principal.has_permission(PermissionEnum.MANAGE_SYSTEM):
        raise ForbiddenException("Only an organization administrator can create workspaces")
    if not principal.organization_id:
        raise ForbiddenException("An organization is required to create a workspace")
    ws_id = f"ws-{uuid.uuid4().hex[:8]}"
    slug = req.name.lower().replace(" ", "-") + f"-{uuid.uuid4().hex[:4]}"
    workspace = Workspace(
        id=ws_id,
        name=req.name,
        slug=slug,
        type=req.type,
        region=req.region,
        timezone=req.timezone,
        scale=req.scale,
        is_demo=req.isDemo,
        is_active=True,
        organization_id=principal.organization_id,
    )
    db.add(workspace)
    await db.flush()

    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user:
        user.workspace_id = ws_id
        user.onboarding_status = "WORKSPACE_COMPLETED"
        # Add membership as OWNER / ADMIN
        membership = WorkspaceMembership(
            workspace_id=ws_id,
            user_id=user.id,
            role=principal.role.value
        )
        db.add(membership)
        await db.commit()

    await log_audit_action(
        db=db,
        workspace_id=ws_id,
        actor_id=principal.nexus_user_id,
        actor_name=principal.display_name,
        action="WORKSPACE_PROVISIONED",
        entity_type="WORKSPACE",
        entity_id=ws_id,
        details=f"Created workspace {req.name} with scale {req.scale}"
    )
    return await get_onboarding_state(db, principal)

async def setup_environment_step(db: AsyncSession, principal: RequestPrincipal, req: EnvironmentSetupRequest) -> OnboardingStateRead:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user:
        user.onboarding_status = "ENVIRONMENT_COMPLETED"
        await db.commit()
    return await get_onboarding_state(db, principal)

async def set_role_preference_step(db: AsyncSession, principal: RequestPrincipal, req: RolePreferenceRequest) -> OnboardingStateRead:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user:
        user.department = req.department
        user.onboarding_status = "ROLE_PREFERENCE_COMPLETED"
        await db.commit()
    return await get_onboarding_state(db, principal)

async def setup_notifications_step(db: AsyncSession, principal: RequestPrincipal, req: NotificationsSetupRequest) -> OnboardingStateRead:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if user:
        user.onboarding_status = "NOTIFICATIONS_COMPLETED"
        await db.commit()
    return await get_onboarding_state(db, principal)

async def finalize_onboarding(db: AsyncSession, principal: RequestPrincipal) -> OnboardingCompleteResponse:
    stmt = select(User).where(User.email == principal.email)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=403, detail="User is not registered in a Nexus workspace.")
    user.onboarding_status = "COMPLETE"
    await db.commit()
    ws_id = user.workspace_id

    await record_operational_event(
        db=db,
        workspace_id=ws_id,
        event_type="onboarding.completed",
        entity_type="USER",
        entity_id=principal.nexus_user_id,
        message=f"Operator {principal.display_name} completed workspace provisioning.",
        severity="SUCCESS"
    )

    return OnboardingCompleteResponse(
        success=True,
        workspaceId=ws_id,
        destination="/app/overview",
        message="Workspace setup completed. Operational integrations can be configured from Settings."
    )
