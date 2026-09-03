import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt, JWTError
from app.core.config import settings

import bcrypt

def get_password_hash(password: str) -> str:
    """Generate salted bcrypt hash for password storage (truncated safely to 72 bytes)."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash, with fallback verification for legacy SHA256 hashes."""
    if hashed_password and (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
        try:
            pw_bytes = plain_password.encode("utf-8")[:72]
            return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
        except Exception:
            return False
    # Legacy SHA-256 fallback support
    salt = settings.SECRET_KEY[:16]
    legacy_hash = hashlib.sha256(f"{salt}{plain_password}".encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, hashed_password)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    """Create JWT access token with expiration."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
