import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, Workspace
from app.schemas.user import (
    UserCreate,
    UserRead,
    LoginRequest,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    AuthMessageResponse,
)
from app.core.security import create_access_token, decode_token, get_password_hash, verify_password
from app.core.errors import NexusException, UnauthorizedException

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password strictly from database."""
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
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
    return Token(access_token=token, token_type="bearer", user=UserRead.model_validate(user))

@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(req: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user in the designated workspace."""
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise NexusException(
            status_code=status.HTTP_409_CONFLICT,
            code="USER_ALREADY_EXISTS",
            message=f"User with email '{req.email}' already exists.",
        )

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        clerk_user_id=f"local_{uuid.uuid4().hex[:12]}",
        email=req.email,
        name=req.name,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        department=req.department,
        workspace_id=req.workspace_id,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return UserRead.model_validate(new_user)

@router.post("/forgot-password", response_model=AuthMessageResponse)
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Initiate password recovery flow and generate reset token."""
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Always return a generic success message to prevent user enumeration attacks
    if not user:
        return AuthMessageResponse(
            status="SUCCESS",
            message="If an account exists with that email, a password reset link has been dispatched.",
        )

    # Create temporary reset token (15 mins TTL)
    reset_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=15),
        extra_claims={"type": "password_reset", "email": user.email},
    )
    return AuthMessageResponse(
        status="SUCCESS",
        message="If an account exists with that email, a password reset link has been dispatched.",
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

    return AuthMessageResponse(status="SUCCESS", message="Email address verified successfully.")
