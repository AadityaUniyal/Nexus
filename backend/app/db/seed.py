"""Database schema bootstrap without inserting sample users or operations data.

This module keeps the historical ``seed_database`` entry point used by the
one-off migration command, but deliberately creates schema only. Real workspace
and operational records are created by authenticated users or integrations.
"""

import asyncio

from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401 - register mapped models before schema creation


async def seed_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(seed_database())
