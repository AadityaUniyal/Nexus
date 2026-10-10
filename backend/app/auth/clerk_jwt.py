from typing import Dict, Any
from jose import jwt
from app.core.config import settings
from app.auth.jwks_cache import jwks_cache
from app.core.errors import UnauthenticatedException


async def verify_clerk_token(token: str) -> Dict[str, Any]:
    """
    Verifies a Clerk session JWT token against Clerk JWKS using RS256.
    Rejects any non-RS256, demo, or unverified token with 401 UnauthenticatedException.
    """
    if not token or not token.strip():
        raise UnauthenticatedException("Missing authorization bearer token")

    # Strictly reject any demo or fake tokens
    if "demo" in token.lower():
        raise UnauthenticatedException("Invalid bearer token")

    try:
        unverified_headers = jwt.get_unverified_header(token)
    except Exception as e:
        raise UnauthenticatedException(f"Malformed token header: {str(e)}")

    alg = unverified_headers.get("alg")
    if alg != "RS256":
        raise UnauthenticatedException(f"Unsupported token algorithm '{alg}'; only RS256 is accepted")

    kid = unverified_headers.get("kid")
    if not kid:
        raise UnauthenticatedException("Token header missing key identifier (kid)")

    key_dict = await jwks_cache.get_key(kid)
    if not key_dict:
        raise UnauthenticatedException("Unknown or unverified Clerk JWKS signing key")

    try:
        decode_kwargs: Dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": {"verify_aud": False},
        }
        if settings.CLERK_ISSUER:
            decode_kwargs["issuer"] = settings.CLERK_ISSUER

        payload = jwt.decode(token, key_dict, **decode_kwargs)
        if not payload.get("sub"):
            raise UnauthenticatedException("Token payload missing subject ('sub') claim")

        return payload
    except Exception as e:
        raise UnauthenticatedException(f"Invalid or expired Clerk token: {str(e)}")
