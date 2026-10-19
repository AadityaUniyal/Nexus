import logging
from typing import Optional, Callable, List
from fastapi import Depends, Header, Cookie, HTTPException, status
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
    session_cookie: Optional[str] = Cookie(None, alias="nexus_session_token"),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    db: AsyncSession = Depends(get_db)
) -> RequestPrincipal:
    """
    Extracts and verifies the JWT bearer token, builds the authoritative RequestPrincipal.
    Derives organization and workspace strictly from authenticated user memberships.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif session_cookie:
        token = session_cookie
    else:
        raise UnauthenticatedException("An authenticated session is required to access operational resources")
    claims = await verify_clerk_token(token)
    sub = claims.get("sub")
    if not sub:
        raise UnauthenticatedException("Invalid token payload: missing subject (sub)")

    # The signed subject is the identity key. Email and display-name claims are
    # profile metadata and must never select which local account is authenticated.
    stmt = select(User).where(or_(User.id == sub, User.clerk_user_id == sub))
    result = await db.execute(stmt)
    user = result.scalars().first()

    role: Optional[RoleEnum] = None
    organization_id: Optional[str] = None
    workspace_id: Optional[str] = None
    is_active = True

    if user:
        email = user.email
        display_name = user.name
        try:
            role = RoleEnum(user.role.upper())
        except Exception as exc:
            logger.error("User %s has an unsupported role configured", user.id)
            raise ForbiddenException("Your workspace role is not configured correctly") from exc
        nexus_user_id = user.id
        workspace_id = user.workspace_id
        organization_id = user.organization_id
        is_active = user.is_active

        # Workspace selection is a request, never an authority source. Resolve both the
        # selected workspace and its role from the persisted membership row.
        if isinstance(x_workspace_id, str) and x_workspace_id.strip() and x_workspace_id != workspace_id:
            from app.models.user import WorkspaceMembership
            m_stmt = select(WorkspaceMembership).where(
                WorkspaceMembership.user_id == user.id,
                WorkspaceMembership.workspace_id == x_workspace_id
            )
            m_res = await db.execute(m_stmt)
            membership = m_res.scalar_one_or_none()
            if not membership:
                raise ForbiddenException("You are not a member of the requested workspace")
            try:
                role = RoleEnum(membership.role.upper())
            except Exception as exc:
                logger.error("User %s has an unsupported role for workspace %s", user.id, x_workspace_id)
                raise ForbiddenException("Your workspace role is not configured correctly") from exc

            ws_stmt = select(Workspace).where(Workspace.id == x_workspace_id)
            ws_res = await db.execute(ws_stmt)
            selected_workspace = ws_res.scalar_one_or_none()
            if not selected_workspace or not selected_workspace.is_active:
                raise ForbiddenException("The requested workspace is unavailable")
            workspace_id = selected_workspace.id
            organization_id = selected_workspace.organization_id

        # Resolve organization_id from workspace if not set directly on user
        if not organization_id and workspace_id:
            ws_stmt = select(Workspace).where(Workspace.id == workspace_id)
            ws_res = await db.execute(ws_stmt)
            ws_obj = ws_res.scalar_one_or_none()
            if ws_obj and ws_obj.organization_id:
                organization_id = ws_obj.organization_id

    else:
        raise ForbiddenException("This account is authenticated but is not provisioned in a Nexus workspace")

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
    session_cookie: Optional[str] = Cookie(None, alias="nexus_session_token"),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    db: AsyncSession = Depends(get_db)
) -> Optional[RequestPrincipal]:
    """Optional authentication for endpoints that support public or anonymous access."""
    if not authorization and not session_cookie:
        return None
    return await get_current_principal(
        authorization=authorization,
        session_cookie=session_cookie,
        x_workspace_id=x_workspace_id if isinstance(x_workspace_id, str) else None,
        db=db
    )

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
