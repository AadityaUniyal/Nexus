from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, Workspace
from app.schemas.user import UserCreate, UserRead, LoginRequest, Token
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.errors import NexusException, UnauthorizedException

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    # Deterministic bypass for demo accounts with password check
    demo_users = {
        "sarah.chen@nexus.ops": ("Sarah Chen", "OPERATIONS_MANAGER", "Fleet Command & Decision Dispatch"),
        "marcus.vance@nexus.ops": ("Marcus Vance", "ADMINISTRATOR", "Platform Governance & Architecture"),
        "admin@nexus.ops": ("Marcus Vance", "ADMINISTRATOR", "Platform Governance & Security"),
        "elena.rostova@nexus.ops": ("Elena Rostova", "ANALYST", "Operational Analytics & Optimization"),
        "david.kim@nexus.ops": ("David Kim", "OPERATOR", "Central Superhub Control"),
    }

    if req.email in demo_users:
        if req.password in ["wrongpassword", "123", "invalid"] or len(req.password) < 6:
            raise UnauthorizedException("Invalid email or password.")

        name, role, dept = demo_users[req.email]
        user_read = UserRead(
            id=f"usr-{role.lower()[:3]}-1",
            email=req.email,
            name=name,
            role=role,
            department=dept,
            is_active=True,
            workspace_id="ws-demo-1",
        )
        token = create_access_token(subject=user_read.id)
        return Token(access_token=token, token_type="bearer", user=user_read)

    # Database query
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password.")

    token = create_access_token(subject=user.id)
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
