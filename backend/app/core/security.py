import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from jose import jwt, JWTError
from app.core.config import settings

import bcrypt

def _preprocess_password(password: str) -> bytes:
    """Pre-process password using SHA-256 digest to safely normalize strings of any length without UTF-8 slicing errors."""
    return hashlib.sha256(password.encode("utf-8")).digest()

def get_password_hash(password: str) -> str:
    """Generate salted bcrypt hash for password storage using SHA-256 pre-hashing."""
    pw_bytes = _preprocess_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    if not hashed_password or not (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
        return False
    try:
        pw_bytes = _preprocess_password(plain_password)
        # Check preprocessed hash
        if bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8")):
            return True
        # Fallback check for legacy raw passwords (pre-SHA-256)
        raw_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(raw_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

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
