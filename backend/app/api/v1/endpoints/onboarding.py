from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import require_authenticated
from app.auth.principal import RequestPrincipal
from app.schemas.onboarding import (
    OnboardingStateRead,
    WorkspaceCreateRequest,
    EnvironmentSetupRequest,
    RolePreferenceRequest,
    NotificationsSetupRequest,
    OnboardingCompleteResponse
)
from app.services.onboarding_service import (
    get_onboarding_state,
    advance_welcome,
    create_workspace_step,
    setup_environment_step,
    set_role_preference_step,
    setup_notifications_step,
    finalize_onboarding
)

router = APIRouter()

@router.get("", response_model=OnboardingStateRead)
async def get_state(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await get_onboarding_state(db, principal)

@router.patch("/welcome", response_model=OnboardingStateRead)
async def step_welcome(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await advance_welcome(db, principal)

@router.patch("/workspace", response_model=OnboardingStateRead)
async def step_workspace(
    req: WorkspaceCreateRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await create_workspace_step(db, principal, req)

@router.patch("/environment", response_model=OnboardingStateRead)
async def step_environment(
    req: EnvironmentSetupRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await setup_environment_step(db, principal, req)

@router.patch("/role-preference", response_model=OnboardingStateRead)
async def step_role(
    req: RolePreferenceRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await set_role_preference_step(db, principal, req)

@router.patch("/notifications", response_model=OnboardingStateRead)
async def step_notifications(
    req: NotificationsSetupRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await setup_notifications_step(db, principal, req)

@router.post("/complete", response_model=OnboardingCompleteResponse)
async def step_complete(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    return await finalize_onboarding(db, principal)
