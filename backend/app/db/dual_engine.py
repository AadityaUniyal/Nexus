"""Clean PostgreSQL engine provider (Zero-Azure)."""

from sqlalchemy.ext.asyncio import AsyncEngine
from app.db.session import engine


def get_engine(use_azure: bool = False) -> AsyncEngine:
    """Return the application's async SQLAlchemy engine (Neon PostgreSQL).
    
    The use_azure flag is accepted for backward compatibility and ignored.
    """
    return engine
