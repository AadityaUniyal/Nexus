from typing import Optional, Dict, Any
from jose import jwt, jws
from app.core.config import settings
from app.auth.jwks_cache import jwks_cache
from app.core.errors import UnauthenticatedException

async def verify_clerk_token(token: str) -> Dict[str, Any]:
    """
    Verifies a session JWT token against local secret key (HS256) or Clerk JWKS (RS256).
    Demo sessions are strictly prohibited in production and only active when explicitly enabled.
    """
    if not token:
        raise UnauthenticatedException("Missing authorization bearer token")

    # Fast-path for demo sessions strictly in non-production development environments
    is_prod = getattr(settings, "APP_ENV", "development").lower() == "production"
    if settings.ENABLE_DEMO_AUTH and not is_prod:
        if token in ("demo-admin-token", "demo_admin"):
            return {
                "sub": "usr-admin-alex",
                "name": "Alex Rivera",
                "email": "alex.rivera@continental-logistics.com",
                "role": "ADMINISTRATOR",
                "workspace_id": "ws-continental-fleet-01",
                "organization_id": "org-nexus-demo",
            }
        elif token in ("demo-viewer-token", "demo_viewer"):
            return {
                "sub": "usr-viewer-01",
                "name": "Guest Auditor",
                "email": "auditor@external-esg.org",
                "role": "VIEWER",
                "workspace_id": "ws-continental-fleet-01",
                "organization_id": "org-nexus-demo",
            }
        elif token in ("demo-operator-token", "demo_operator", "nexus_demo_token") or token.startswith("demo_"):
            return {
                "sub": "usr-demo-sarah",
                "name": "Sarah Chen",
                "email": "sarah.chen@nexus.platform",
                "role": "OPERATIONS_MANAGER",
                "workspace_id": "ws-continental-fleet-01",
                "organization_id": "org-nexus-demo",
            }

    # Inspect token header algorithm
    try:
        unverified_headers = jwt.get_unverified_header(token)
    except Exception as e:
        raise UnauthenticatedException(f"Malformed authorization token header: {str(e)}")

    alg = unverified_headers.get("alg")

    # Local HS256 token verification
    if alg == "HS256" or alg == settings.ALGORITHM:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except Exception as e:
            raise UnauthenticatedException(f"Invalid or expired local authorization token: {str(e)}")

    # Clerk RS256 token verification using public JWKS
    if alg == "RS256" and settings.CLERK_JWKS_URL:
        try:
            kid = unverified_headers.get("kid")
            if not kid:
                raise UnauthenticatedException("Clerk token header missing key identifier (kid)")

            key_dict = await jwks_cache.get_key(kid)
            if not key_dict:
                raise UnauthenticatedException("Unknown or unverified Clerk JWKS signing key")

            payload = jwt.decode(
                token,
                key_dict,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER if settings.CLERK_ISSUER else None,
                options={"verify_aud": False}
            )
            return payload
        except Exception as e:
            raise UnauthenticatedException(f"Invalid or expired Clerk token: {str(e)}")

    # Fallback to local secret verification
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception as e:
        raise UnauthenticatedException(f"Invalid or expired authorization token: {str(e)}")
