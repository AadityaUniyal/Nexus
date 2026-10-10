import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.driver import DriverSession, Driver


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hex digest of a token."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


async def get_current_driver_session(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> DriverSession:
    """
    Validates driver session bearer token.
    Rejects revoked or expired sessions with 401.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Driver session token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raw_token = authorization.split(" ", 1)[1].strip()
    token_hash = hash_token(raw_token)

    stmt = select(DriverSession).where(DriverSession.session_token_hash == token_hash)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid driver session token",
        )

    if session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Driver session has been revoked. Request a new link from your dispatcher.",
        )

    now_utc = datetime.now(timezone.utc)
    exp = session.expires_at if session.expires_at.tzinfo else session.expires_at.replace(tzinfo=timezone.utc)
    if exp < now_utc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Driver session has expired. Request a new link from your dispatcher.",
        )

    return session
