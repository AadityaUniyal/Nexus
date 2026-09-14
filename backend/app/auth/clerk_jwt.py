from typing import Optional, Dict, Any
from jose import jwt, jws
from app.core.config import settings
from app.auth.jwks_cache import jwks_cache
from app.core.errors import UnauthenticatedException

async def verify_clerk_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Clerk session JWT token against Clerk JWKS or local development secret.
    """
    if not token:
        raise UnauthenticatedException("Missing authorization bearer token")

    # If Clerk JWKS is configured, verify using public keys
    if settings.CLERK_JWKS_URL:
        try:
            unverified_headers = jwt.get_unverified_header(token)
            kid = unverified_headers.get("kid")
            if not kid:
                raise UnauthenticatedException("Token header missing key identifier (kid)")

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

    # In local development mode without Clerk JWKS, verify strictly with local secret key
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception as e:
        raise UnauthenticatedException(f"Invalid or expired authorization token: {str(e)}")

