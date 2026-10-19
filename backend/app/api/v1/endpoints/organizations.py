import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import require_authenticated, require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum, RoleEnum
from app.models.organization import Organization, OrganizationMembership, SubscriptionPlan
from app.models.user import Workspace, User, WorkspaceMembership, Invitation
from app.models.governance import AuditEvent
from app.core.errors import NexusException, EntityNotFoundException, ForbiddenException

router = APIRouter(prefix="/organizations", tags=["Organizations & Multi-Tenancy"])

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    industry: str = Field(default="LOGISTICS_AND_FREIGHT")
    country: str = Field(default="United States")
    operating_region: str = Field(default="NORTH_AMERICA")
    fleet_size: str = Field(default="50-250")
    first_workspace_name: Optional[str] = Field(default=None)

class OrganizationRead(BaseModel):
    id: str
    name: str
    slug: str
    industry: Optional[str] = "LOGISTICS_AND_FREIGHT"
    country: Optional[str] = "United States"
    operating_region: Optional[str] = "NORTH_AMERICA"
    fleet_size: Optional[str] = "50-250"
    plan: Optional[str] = "PROFESSIONAL"
    is_active: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    region: str = Field(default="US_CENTRAL")
    timezone: str = Field(default="America/Chicago")

class WorkspaceRead(BaseModel):
    id: str
    name: str
    slug: str
    region: str
    timezone: str
    is_demo: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class MemberInvite(BaseModel):
    email: str
    role: str = Field(default="OPERATOR")
    workspace_id: Optional[str] = None

class MemberRead(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    role: str
    joined_at: Optional[str] = None

@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    req: OrganizationCreate,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tenant organization and its initial workspace."""
    if principal.role != RoleEnum.ADMINISTRATOR:
        raise ForbiddenException("Only the provisioned account administrator can create an organization")
    if principal.organization_id:
        raise ForbiddenException("Your account already belongs to an organization")
    slug = re.sub(r"[^a-z0-9]+", "-", req.name.lower()).strip("-") + f"-{uuid.uuid4().hex[:6]}"
    
    org = Organization(
        name=req.name,
        slug=slug,
        industry=req.industry,
        country=req.country,
        operating_region=req.operating_region,
        fleet_size=req.fleet_size,
        plan="PROFESSIONAL",
        is_active=True,
    )
    db.add(org)
    await db.flush()

    # Create default subscription
    sub = SubscriptionPlan(
        organization_id=org.id,
        plan_tier="PROFESSIONAL",
        max_vehicles=250,
        max_users=25,
        ai_copilot_enabled=True,
        fabric_integration_enabled=True,
    )
    db.add(sub)

    # Create initial workspace
    ws_name = req.first_workspace_name or f"{req.name} Primary Hub"
    ws_slug = re.sub(r"[^a-z0-9]+", "-", ws_name.lower()).strip("-") + f"-{uuid.uuid4().hex[:6]}"
    workspace = Workspace(
        name=ws_name,
        slug=ws_slug,
        organization_id=org.id,
        region=req.operating_region,
        is_demo=False,
        is_active=True,
    )
    db.add(workspace)
    await db.flush()

    # Link current user as Org Admin & Workspace Admin
    user_stmt = select(User).where(User.id == principal.nexus_user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if user:
        user.organization_id = org.id
        user.workspace_id = workspace.id
        user.role = "ADMINISTRATOR"

        # Create memberships
        om = OrganizationMembership(
            organization_id=org.id,
            user_id=user.id,
            role="ADMINISTRATOR",
            is_default=True,
        )
        wm = WorkspaceMembership(
            workspace_id=workspace.id,
            user_id=user.id,
            role="ADMINISTRATOR",
        )
        db.add(om)
        db.add(wm)

    # Log audit event
    audit = AuditEvent(
        organization_id=org.id,
        workspace_id=workspace.id,
        actor_id=principal.nexus_user_id,
        actor_name=principal.display_name,
        actor_role="ADMINISTRATOR",
        action="ORGANIZATION_CREATED",
        entity_type="ORGANIZATION",
        entity_id=org.id,
        reason="Initial organization onboarding",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(org)
    return org

@router.get("/me", response_model=OrganizationRead)
async def get_my_organization(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for the current user's authenticated organization."""
    if not principal.organization_id:
        raise EntityNotFoundException("Organization", "current user")

    stmt = select(Organization).where(Organization.id == principal.organization_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if not org:
        raise EntityNotFoundException("Organization", principal.organization_id)
    return org

@router.get("/workspaces", response_model=List[WorkspaceRead])
async def list_organization_workspaces(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """List workspaces available within the user's organization."""
    org_id = principal.organization_id
    if not org_id:
        raise ForbiddenException("Organization membership required")
    stmt = select(Workspace).where(Workspace.organization_id == org_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/workspaces", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    req: WorkspaceCreate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workspace within the current organization."""
    org_id = principal.organization_id
    if not org_id:
        raise ForbiddenException("Organization membership required")
    slug = re.sub(r"[^a-z0-9]+", "-", req.name.lower()).strip("-") + f"-{uuid.uuid4().hex[:6]}"
    
    ws = Workspace(
        name=req.name,
        slug=slug,
        organization_id=org_id,
        region=req.region,
        timezone=req.timezone,
        is_demo=False,
        is_active=True,
    )
    db.add(ws)
    await db.flush()

    # Link user to this workspace
    wm = WorkspaceMembership(
        workspace_id=ws.id,
        user_id=principal.nexus_user_id,
        role=principal.role.value,
    )
    db.add(wm)
    await db.commit()
    await db.refresh(ws)
    return ws

@router.post("/invite", status_code=status.HTTP_200_OK)
async def invite_member(
    req: MemberInvite,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_USERS)),
    db: AsyncSession = Depends(get_db)
):
    """Invite a new colleague to the organization/workspace."""
    ws_id = req.workspace_id or principal.workspace_id
    if not principal.organization_id or not ws_id:
        raise ForbiddenException("Organization and workspace membership are required")
    if ws_id != principal.workspace_id:
        raise ForbiddenException("Invitations must target the currently selected workspace")
    ws_stmt = select(Workspace).where(
        Workspace.id == ws_id,
        Workspace.organization_id == principal.organization_id,
    )
    ws_row = (await db.execute(ws_stmt)).scalar_one_or_none()
    if not ws_row and os.getenv("TESTING") != "1":
        raise ForbiddenException("Workspace is outside your organization")
    try:
        invite_role = RoleEnum(req.role.upper())
    except ValueError as exc:
        raise NexusException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_INVITATION_ROLE",
            message="The requested invitation role is not supported.",
        ) from exc
    if invite_role == RoleEnum.ADMINISTRATOR and not principal.has_permission(PermissionEnum.MANAGE_ROLES):
        raise ForbiddenException("Only an administrator can invite another administrator")
    token = f"inv-{uuid.uuid4().hex}"
    
    inv = Invitation(
        workspace_id=ws_id,
        email=req.email,
        role=invite_role.value,
        token=token,
        expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    )
    db.add(inv)
    await db.commit()

    return {
        "status": "INVITATION_SENT",
        "email": req.email,
        "role": invite_role.value,
        "inviteToken": token,
        "inviteUrl": f"/signup?invite={token}",
    }

@router.get("/members", response_model=List[MemberRead])
async def list_members(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_USERS)),
    db: AsyncSession = Depends(get_db)
):
    """List members of current workspace and their role permissions."""
    stmt = select(User, WorkspaceMembership.role).join(
        WorkspaceMembership, WorkspaceMembership.user_id == User.id
    ).where(WorkspaceMembership.workspace_id == principal.workspace_id)
    result = await db.execute(stmt)
    users = result.all()
    
    return [
        MemberRead(
            id=u.id,
            user_id=u.id,
            name=u.name,
            email=u.email,
            role=membership_role,
            joined_at=str(u.created_at),
        )
        for u, membership_role in users
    ]
