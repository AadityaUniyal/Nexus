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
