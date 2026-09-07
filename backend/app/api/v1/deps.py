from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Header, status
from app.core.security import decode_token

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
    payload: Optional[Dict[str, Any]] = Depends(get_current_token_payload)
) -> str:
    """Extract workspace_id from JWT payload, defaulting to demo workspace."""
    if payload and "workspace_id" in payload:
        return str(payload["workspace_id"])
    return "ws-continental-fleet-01"

async def get_actor_name(
    payload: Optional[Dict[str, Any]] = Depends(get_current_token_payload)
) -> str:
    """Extract actor name from JWT payload, defaulting to Sarah Chen for demo."""
    if payload and "name" in payload:
        return str(payload["name"])
    return "Sarah Chen"
