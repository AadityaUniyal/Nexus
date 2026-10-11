from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Header, status
from app.core.security import decode_token
from app.auth.clerk_jwt import verify_clerk_token
from app.auth.dependencies import (
    get_current_principal,
    get_optional_principal,
    require_authenticated,
    require_workspace,
    require_permission,
    require_role,
)
from app.auth.principal import RequestPrincipal

async def get_current_token_payload(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """Extract and decode Bearer token from Authorization header if present."""
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
        
    token = parts[1]
    payload = decode_token(token)
    if not payload:
        try:
            payload = await verify_clerk_token(token)
        except Exception:
            payload = None
    return payload

async def get_current_user_optional(
    payload: Optional[Dict[str, Any]] = Depends(get_current_token_payload)
) -> Optional[Dict[str, Any]]:
    """Return user dict payload if valid token provided, else None."""
    return payload

async def get_current_user(
    payload: Optional[Dict[str, Any]] = Depends(get_current_token_payload)
) -> Dict[str, Any]:
    """Require valid authenticated user JWT token."""
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

async def get_workspace_id(
    principal: RequestPrincipal = Depends(get_current_principal)
) -> str:
    """Extract workspace_id strictly from verified RequestPrincipal, preventing cross-tenant leakage."""
    if principal and principal.workspace_id:
        return str(principal.workspace_id)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Workspace membership required to access tenant operations"
    )

async def get_actor_name(
    principal: RequestPrincipal = Depends(get_current_principal)
) -> str:
    """Extract actor name strictly from verified RequestPrincipal."""
    if principal and principal.display_name:
        return str(principal.display_name)
    return "Operational User"

__all__ = [
    "get_current_token_payload",
    "get_current_user_optional",
    "get_current_user",
    "get_workspace_id",
    "get_actor_name",
    "get_current_principal",
    "get_optional_principal",
    "require_authenticated",
    "require_workspace",
    "require_permission",
    "require_role",
]
