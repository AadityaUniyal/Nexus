import logging
from typing import Optional, List
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.clerk_jwt import verify_clerk_token
from app.auth.principal import RequestPrincipal, RoleEnum
from app.models.workspace import WorkspaceMember

logger = logging.getLogger("nexus.auth")


async def get_current_user_claims(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Verifies Clerk JWT and returns authenticated claims."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        claims = await verify_clerk_token(token)
        return claims
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_principal(
    claims: dict = Depends(get_current_user_claims),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    db: AsyncSession = Depends(get_db)
) -> RequestPrincipal:
    """
    Derives the authoritative tenant-scoped RequestPrincipal from the database.
    Strictly forbids access if the user has no workspace membership.
    """
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub claim")

    email = claims.get("email") or f"{sub}@nexus.user"
    display_name = claims.get("name") or "Operator"

    # Query memberships for this user
    stmt = select(WorkspaceMember).where(WorkspaceMember.user_id == sub)
    result = await db.execute(stmt)
    memberships = result.scalars().all()

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "NO_WORKSPACE", "needs_onboarding": True}
        )

    active_membership: Optional[WorkspaceMember] = None

    if x_workspace_id:
        active_membership = next((m for m in memberships if m.workspace_id == x_workspace_id), None)
        if not active_membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User is not a member of requested workspace {x_workspace_id}"
            )
    else:
        active_membership = memberships[0]

    try:
        role = RoleEnum(active_membership.role)
    except ValueError:
        role = RoleEnum.VIEWER

    return RequestPrincipal(
        user_id=sub,
        email=email,
        display_name=display_name,
        workspace_id=active_membership.workspace_id,
        role=role,
        needs_onboarding=False
    )


def require_roles(allowed_roles: List[RoleEnum]):
    """Enforces server-side RBAC."""
    def role_checker(principal: RequestPrincipal = Depends(get_current_principal)) -> RequestPrincipal:
        if principal.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action not permitted for role '{principal.role.value}'"
            )
        return principal
    return role_checker


require_owner = require_roles([RoleEnum.OWNER])
require_dispatcher = require_roles([RoleEnum.OWNER, RoleEnum.DISPATCHER])
