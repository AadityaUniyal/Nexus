import uuid
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, Workspace, WorkspaceMembership
from app.models.organization import Organization, OrganizationMembership, SubscriptionPlan
from app.schemas.user import (
    UserCreate,
    UserRead,
    LoginRequest,
    AuthSessionResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    AuthMessageResponse,
)
from app.core.security import create_access_token, decode_token, get_password_hash, verify_password
from app.core.errors import NexusException, UnauthorizedException
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(
        key="nexus_session_token", path="/", httponly=True,
        secure=settings.APP_ENV.lower() == "production", samesite="lax",
    )
    return response

@router.post("/login", response_model=AuthSessionResponse)
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password strictly from database."""
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    password_valid = False
    if user and user.hashed_password:
        password_valid = verify_password(req.password, user.hashed_password)

    if not user or not password_valid:
        raise UnauthorizedException("Invalid email or password.")

    if not user.is_active:
        raise NexusException(
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_SUSPENDED",
            message="User account has been suspended.",
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "workspace_id": user.workspace_id,
        }
    )
    response.set_cookie(
        key="nexus_session_token", value=token, httponly=True,
        secure=settings.APP_ENV.lower() == "production", samesite="lax",
        max_age=86400, path="/",
    )
    return AuthSessionResponse(user=UserRead.model_validate(user))

@router.post("/signup", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    """Register a new user in the designated workspace and issue access token."""
    # The first account created for a new workspace is promoted by this server-side
    # bootstrap flow. A caller must not request an elevated role in the payload.
    if "role" in req.model_fields_set and req.role.upper() != "OPERATOR":
        raise NexusException(
            status_code=status.HTTP_403_FORBIDDEN,
            code="PRIVILEGED_ROLE_FORBIDDEN",
            message="Workspace roles are assigned by the server or a workspace administrator.",
        )

    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise NexusException(
            status_code=status.HTTP_409_CONFLICT,
            code="USER_ALREADY_EXISTS",
            message=f"User with email '{req.email}' already exists.",
        )

    workspace_name = (req.workspace_name or "").strip()
    if len(workspace_name) < 2:
        raise NexusException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, code="WORKSPACE_NAME_REQUIRED", message="Enter a workspace name with at least two characters.")
    slug_prefix = "".join(c.lower() for c in workspace_name if c.isalnum() or c in ("-", "_"))[:32] or "workspace"
    workspace_id = f"ws-{slug_prefix}-{uuid.uuid4().hex[:8]}"
    organization_slug = f"{slug_prefix}-{uuid.uuid4().hex[:8]}"
    organization = Organization(
        name=workspace_name,
        slug=organization_slug,
        plan="PROFESSIONAL",
    )
    db.add(organization)
    await db.flush()

    new_ws = Workspace(
        id=workspace_id,
        name=f"{workspace_name} Setup",
        slug=f"{slug_prefix}-setup-{uuid.uuid4().hex[:8]}",
        organization_id=organization.id,
        is_demo=False,
    )
    db.add(new_ws)
    await db.flush()

    db.add(SubscriptionPlan(
        organization_id=organization.id,
        plan_tier="PROFESSIONAL",
    ))

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        clerk_user_id=f"local_{uuid.uuid4().hex[:12]}",
        email=req.email,
        name=req.name,
        hashed_password=get_password_hash(req.password),
        role="ADMINISTRATOR",
        department=req.department or "Operations",
        organization_id=organization.id,
        workspace_id=workspace_id,
        is_active=True,
    )
    db.add(new_user)
    db.add(OrganizationMembership(
        organization_id=organization.id,
        user_id=new_user.id,
        role="ADMINISTRATOR",
        is_default=True,
    ))
    db.add(WorkspaceMembership(
        workspace_id=workspace_id,
        user_id=new_user.id,
        role="ADMINISTRATOR",
    ))
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        subject=new_user.id,
        extra_claims={
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "workspace_id": new_user.workspace_id,
        }
    )
    response.set_cookie(
        key="nexus_session_token", value=token, httponly=True,
        secure=settings.APP_ENV.lower() == "production", samesite="lax",
        max_age=86400, path="/",
    )
    return AuthSessionResponse(user=UserRead.model_validate(new_user))

@router.post("/forgot-password", response_model=AuthMessageResponse)
async def forgot_password(_req: ForgotPasswordRequest):
    """Fail clearly until a configured delivery channel can send reset links."""
    raise NexusException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="PASSWORD_RECOVERY_UNAVAILABLE",
        message="Password recovery is not configured for this workspace. Contact your workspace administrator.",
    )

@router.post("/reset-password", response_model=AuthMessageResponse)
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset user password using token."""
    payload = decode_token(req.token)
    if not payload or payload.get("type") != "password_reset":
        raise NexusException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_RESET_TOKEN",
            message="Password reset token is invalid or expired.",
        )

    user_id = payload.get("sub")
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise NexusException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="USER_NOT_FOUND",
            message="User account not found.",
        )

    user.hashed_password = get_password_hash(req.new_password)
    await db.commit()
    return AuthMessageResponse(status="SUCCESS", message="Password reset successfully.")

@router.post("/verify-email", response_model=AuthMessageResponse)
async def verify_email(req: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """Verify user email address using verification token."""
    payload = decode_token(req.token)
    if not payload or payload.get("type") != "email_verification":
        raise NexusException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_VERIFICATION_TOKEN",
            message="Email verification token is invalid or expired.",
        )

    user_id = payload.get("sub")
    if user_id:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.is_active = True
            await db.commit()

    return AuthMessageResponse(status="SUCCESS", message="Email address verified successfully.")
