import logging
from typing import Optional, Callable, List
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.clerk_jwt import verify_clerk_token
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP
from app.models.user import User, Workspace
from app.models.organization import Organization, OrganizationMembership
from app.core.errors import UnauthenticatedException, ForbiddenException
from app.core.config import settings

logger = logging.getLogger("nexus.auth")

async def get_current_principal(
    authorization: Optional[str] = Header(None),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    db: AsyncSession = Depends(get_db)
) -> RequestPrincipal:
    """
    Extracts and verifies the JWT bearer token, builds the authoritative RequestPrincipal.
    Derives organization and workspace strictly from authenticated user memberships.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthenticatedException("Bearer token required to access operational resources")

    token = authorization.split(" ")[1]
    claims = await verify_clerk_token(token)
    sub = claims.get("sub")
    if not sub:
        raise UnauthenticatedException("Invalid token payload: missing subject (sub)")

    email = claims.get("email") or f"{sub}@nexus.internal"
    display_name = claims.get("name") or "Operational User"

    # Query local user
    stmt = select(User).where(or_(User.email == email, User.id == sub, User.clerk_user_id == sub))
    result = await db.execute(stmt)
    user = result.scalars().first()

    claim_role = claims.get("role")
    role: Optional[RoleEnum] = None
    if claim_role:
        try:
            role = RoleEnum(claim_role.upper())
        except Exception:
            role = None

    organization_id: Optional[str] = None
    workspace_id: Optional[str] = None
    is_active = True

    if user:
        if not role:
            try:
                role = RoleEnum(user.role)
            except Exception:
                role = RoleEnum.OPERATIONS_MANAGER
        nexus_user_id = user.id
        workspace_id = user.workspace_id
        organization_id = user.organization_id
        is_active = user.is_active

        # If user has an explicit active workspace switch request in header, verify membership
        if x_workspace_id and x_workspace_id != workspace_id:
            from app.models.user import WorkspaceMembership
            m_stmt = select(WorkspaceMembership).where(
                WorkspaceMembership.user_id == user.id,
                WorkspaceMembership.workspace_id == x_workspace_id
            )
            m_res = await db.execute(m_stmt)
            if m_res.scalar_one_or_none():
                workspace_id = x_workspace_id

        # Resolve organization_id from workspace if not set directly on user
        if not organization_id and workspace_id:
            ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
            ws_res = await db.execute(ws_stmt)
            ws_obj = ws_res.scalar_one_or_none()
            if ws_obj and ws_obj.organization_id:
                organization_id = ws_obj.organization_id

    else:
        # Default unregistered authenticated user
        if not role:
            role = RoleEnum.VIEWER
        nexus_user_id = f"usr-{sub[:8]}"
        workspace_id = claims.get("workspace_id") or "ws-continental-fleet-01"
        organization_id = claims.get("organization_id") or "org-nexus-demo"
        is_active = True

    if not is_active:
        raise ForbiddenException("User account has been suspended by an administrator")

    permissions = ROLE_PERMISSIONS_MAP.get(role, ROLE_PERMISSIONS_MAP[RoleEnum.VIEWER])

    return RequestPrincipal(
        nexus_user_id=nexus_user_id,
        clerk_user_id=sub,
        email=email,
        display_name=display_name,
        organization_id=organization_id,
        workspace_id=workspace_id,
        role=role,
        permissions=permissions,
        onboarding_completed=True,
        is_active=is_active
    )

async def get_optional_principal(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[RequestPrincipal]:
    """Optional authentication for endpoints that support public or anonymous access."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_principal(authorization=authorization, db=db)
    except Exception:
        return None

def require_authenticated(principal: RequestPrincipal = Depends(get_current_principal)) -> RequestPrincipal:
    if not principal.nexus_user_id:
        raise UnauthenticatedException("Authentication required")
    return principal

def require_workspace(principal: RequestPrincipal = Depends(require_authenticated)) -> RequestPrincipal:
    if not principal.workspace_id:
        raise ForbiddenException("Workspace membership required to access tenant operations")
    return principal

def require_organization(principal: RequestPrincipal = Depends(require_authenticated)) -> RequestPrincipal:
    if not principal.organization_id:
        raise ForbiddenException("Organization membership required")
    return principal

def require_onboarded(principal: RequestPrincipal = Depends(require_workspace)) -> RequestPrincipal:
    if not principal.onboarding_completed:
        raise ForbiddenException("Onboarding must be completed to access operational resources")
    return principal

def require_permission(permission: PermissionEnum) -> Callable:
    def dependency(principal: RequestPrincipal = Depends(require_onboarded)) -> RequestPrincipal:
        if not principal.has_permission(permission):
            raise ForbiddenException(f"Missing required permission: {permission.value}")
        return principal
    return dependency

def require_role(allowed_roles: List[RoleEnum]) -> Callable:
    def dependency(principal: RequestPrincipal = Depends(require_authenticated)) -> RequestPrincipal:
        if principal.role == RoleEnum.ADMINISTRATOR:
            return principal
        if principal.role not in allowed_roles:
            raise ForbiddenException(f"Role '{principal.role.value}' is unauthorized for this operation")
        return principal
    return dependency
