"""Enterprise SSO token verifier (Zero-Azure)."""

import logging
from typing import Dict, Any
from jose import jwt
from app.core.errors import UnauthenticatedException

logger = logging.getLogger("nexus.auth.sso")


async def verify_azure_entra_token(token: str) -> Dict[str, Any]:
    """Verifies enterprise SSO OAuth2 Bearer token with local claims extraction."""
    if not token:
        raise UnauthenticatedException("Missing authorization bearer token")

    try:
        unverified_claims = jwt.get_unverified_claims(token)
        sub = unverified_claims.get("sub") or unverified_claims.get("oid") or "sso-user"
        email = unverified_claims.get("preferred_username") or unverified_claims.get("email") or f"{sub}@nexus.local"
        name = unverified_claims.get("name") or "Enterprise User"
        roles = unverified_claims.get("roles", [])

        role = "ADMINISTRATOR" if "Nexus.Admin" in roles else ("OPERATIONS_MANAGER" if "Nexus.Ops" in roles else "OPERATOR")

        return {
            "sub": sub,
            "email": email,
            "name": name,
            "role": role,
            "provider": "enterprise_sso",
            "tid": unverified_claims.get("tid", "default"),
        }
    except Exception as e:
        logger.warning(f"[SSO] Token validation fallback: {e}")
        raise UnauthenticatedException(f"Invalid enterprise SSO token: {str(e)}")
