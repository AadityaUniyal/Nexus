"""Enterprise SSO token verifier (Microsoft Entra ID / OpenID Connect)."""

import logging
from typing import Dict, Any, Optional
from jose import jwt
from app.core.config import settings
from app.auth.jwks_cache import jwks_cache
from app.core.errors import UnauthenticatedException

logger = logging.getLogger("nexus.auth.sso")


async def verify_azure_entra_token(token: str) -> Dict[str, Any]:
    """
    Verifies enterprise SSO OAuth2 Bearer token with cryptographic signature validation.
    When AZURE_TENANT_ID is configured, enforces RS256 JWKS verification against Microsoft Entra ID.
    When local dev mode without Entra ID is active, requires a valid signature or development bypass.
    """
    if not token:
        raise UnauthenticatedException("Missing authorization bearer token")

    tenant_id = settings.AZURE_TENANT_ID.strip() if getattr(settings, "AZURE_TENANT_ID", None) else ""
    client_id = settings.AZURE_CLIENT_ID.strip() if getattr(settings, "AZURE_CLIENT_ID", None) else ""

    # Production / Configured Entra ID validation
    if tenant_id:
        jwks_url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        try:
            unverified_headers = jwt.get_unverified_header(token)
            kid = unverified_headers.get("kid")
            if not kid:
                raise UnauthenticatedException("SSO token header missing key identifier (kid)")

            key_dict = await jwks_cache.get_key(kid, jwks_url=jwks_url)
            if not key_dict:
                raise UnauthenticatedException("Unknown or unverified Entra ID signing key")

            issuer_v2 = f"https://login.microsoftonline.com/{tenant_id}/v2.0"
            issuer_v1 = f"https://sts.windows.net/{tenant_id}/"

            # Validate token cryptographically
            payload = jwt.decode(
                token,
                key_dict,
                algorithms=["RS256"],
                options={"verify_aud": bool(client_id), "verify_iss": True},
                audience=client_id if client_id else None,
                issuer=[issuer_v2, issuer_v1]
            )

            sub = payload.get("sub") or payload.get("oid") or "sso-user"
            email = payload.get("preferred_username") or payload.get("email") or f"{sub}@nexus.local"
            name = payload.get("name") or "Enterprise User"
            roles = payload.get("roles", [])

            role = "ADMINISTRATOR" if "Nexus.Admin" in roles else ("OPERATIONS_MANAGER" if "Nexus.Ops" in roles else "OPERATOR")

            return {
                "sub": sub,
                "email": email,
                "name": name,
                "role": role,
                "provider": "enterprise_sso",
                "tid": payload.get("tid", tenant_id),
            }
        except UnauthenticatedException:
            raise
        except Exception as e:
            logger.error(f"[SSO] Cryptographic token verification failed: {e}")
            raise UnauthenticatedException(f"Invalid or expired enterprise SSO token: {str(e)}")

    # In local development mode without Entra ID tenant configured:
    # Reject in production, or attempt HMAC signature with secret
    if settings.APP_ENV == "production":
        raise UnauthenticatedException("Enterprise SSO is not configured with a valid Azure Tenant ID in production")

    try:
        # Check signature with local SECRET_KEY
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub", "dev-sso-user")
        return {
            "sub": sub,
            "email": payload.get("email", f"{sub}@nexus.local"),
            "name": payload.get("name", "Local Dev SSO User"),
            "role": payload.get("role", "OPERATOR"),
            "provider": "enterprise_sso_dev",
            "tid": "dev-tenant"
        }
    except Exception as e:
        logger.warning(f"[SSO] Dev-mode signature verification failed: {e}")
        raise UnauthenticatedException(f"Invalid SSO bearer token signature: {str(e)}")
