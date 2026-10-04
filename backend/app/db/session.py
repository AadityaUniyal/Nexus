from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

import os
import sys
from sqlalchemy.pool import NullPool

db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
db_url_lower = db_url.lower()

# Create async engine with robust, low-latency pool configuration
engine_kwargs: dict = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if "pytest" in sys.modules or os.environ.get("VERCEL"):
    engine_kwargs["poolclass"] = NullPool
    if "ssl=require" in db_url_lower or "sslmode=require" in db_url_lower or "neon.tech" in db_url_lower:
        engine_kwargs["connect_args"] = {"ssl": "require"}
elif "neon.tech" in db_url_lower:
    # Neon Serverless PostgreSQL with built-in connection pooler
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 120,
        "connect_args": {"ssl": "require"},
    })
elif "sqlite" not in db_url_lower:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 15,
    })
    if "ssl=require" in db_url_lower or "sslmode=require" in db_url_lower:
        engine_kwargs["connect_args"] = {"ssl": "require"}

engine = create_async_engine(
    db_url,
    **engine_kwargs
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Alias for background workers
async_session_factory = AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for yielding an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
