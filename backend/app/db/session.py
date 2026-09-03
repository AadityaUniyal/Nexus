from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

import sys
from sqlalchemy.pool import NullPool

# Create async engine with robust, low-latency pool configuration
engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if "pytest" in sys.modules:
    engine_kwargs["poolclass"] = NullPool
elif "sqlite" not in settings.DATABASE_URL.lower():
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 5,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
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
