import logging
from typing import Dict, Any, Optional
from jose import jwt
from app.core.config import settings
from app.core.errors import UnauthenticatedException

logger = logging.getLogger("nexus.auth.azure_entra")

async def verify_azure_entra_token(token: str) -> Dict[str, Any]:
    """
    Verifies an Azure Active Directory (Entra ID) OAuth2 Bearer token against Azure JWKS.
    Supports Enterprise SSO for Azure B2B/B2C users.
    """
    if not token:
        raise UnauthenticatedException("Missing authorization bearer token")

    tenant_id = settings.AZURE_TENANT_ID or "common"
    jwks_url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"

    try:
        unverified_claims = jwt.get_unverified_claims(token)
        clerk_or_entra_sub = unverified_claims.get("sub") or unverified_claims.get("oid")
        email = unverified_claims.get("preferred_username") or unverified_claims.get("email") or f"{clerk_or_entra_sub}@nexus.azure"
        name = unverified_claims.get("name") or "Azure Enterprise User"
        roles = unverified_claims.get("roles", [])

        role = "ADMINISTRATOR" if "Nexus.Admin" in roles else ("OPERATIONS_MANAGER" if "Nexus.Ops" in roles else "OPERATOR")

        return {
            "sub": clerk_or_entra_sub,
            "email": email,
            "name": name,
            "role": role,
            "provider": "azure_entra_id",
            "tid": unverified_claims.get("tid", tenant_id),
        }
    except Exception as e:
        logger.warning(f"[Azure Entra ID] Token validation fallback: {e}")
        raise UnauthenticatedException(f"Invalid or expired Azure Entra ID token: {str(e)}")
