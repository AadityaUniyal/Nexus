import pytest
import pytest_asyncio
from app.db.session import engine
from app.db.base import Base
import app.models  # Register all models on Base.metadata

@pytest_asyncio.fixture(autouse=True)
async def init_db_tables():
    """Ensure database tables exist for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
