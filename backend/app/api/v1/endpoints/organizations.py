import re
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field
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

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

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
        # Fallback to org-nexus-demo
        stmt = select(Organization).where(Organization.id == "org-nexus-demo")
        res = await db.execute(stmt)
        org = res.scalar_one_or_none()
        if not org:
            # Create demo org
            org = Organization(
                id="org-nexus-demo",
                name="Nexus Enterprise Demo Organization",
                slug="nexus-demo-org",
                industry="GLOBAL_LOGISTICS",
                country="United States",
                plan="ENTERPRISE",
            )
            db.add(org)
            await db.commit()
            await db.refresh(org)
        return org

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
    org_id = principal.organization_id or "org-nexus-demo"
    stmt = select(Workspace).where(Workspace.organization_id == org_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/workspaces", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    req: WorkspaceCreate,
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workspace within the current organization."""
    org_id = principal.organization_id or "org-nexus-demo"
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
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Invite a new colleague to the organization/workspace."""
    ws_id = req.workspace_id or principal.workspace_id
    token = f"inv-{uuid.uuid4().hex}"
    
    inv = Invitation(
        workspace_id=ws_id,
        email=req.email,
        role=req.role.upper(),
        token=token,
        expires_at="2026-12-31T23:59:59Z",
    )
    db.add(inv)
    await db.commit()

    return {
        "status": "INVITATION_SENT",
        "email": req.email,
        "role": req.role.upper(),
        "inviteToken": token,
        "inviteUrl": f"/signup?invite={token}",
    }

@router.get("/members", response_model=List[MemberRead])
async def list_members(
    principal: RequestPrincipal = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """List members of current workspace and their role permissions."""
    stmt = select(User).where(User.workspace_id == principal.workspace_id)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return [
        MemberRead(
            id=u.id,
            user_id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            joined_at=str(u.created_at),
        )
        for u in users
    ]
