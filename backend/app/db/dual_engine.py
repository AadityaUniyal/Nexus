'''Utility for selecting between Neon and Azure PostgreSQL engines.'''

from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from app.core.config import settings


def get_engine(use_azure: bool = False) -> AsyncEngine:
    """Return an async SQLAlchemy engine.

    - If ``use_azure`` is ``True``, the function uses the Azure PostgreSQL
      connection string (``settings.AZURE_POSTGRESQL_URL``).
    - Otherwise, it falls back to the Neon PostgreSQL URL
      (``settings.DATABASE_URL``).
    - The engine is created with ``echo`` enabled when the application log
      level is set to ``DEBUG`` to aid troubleshooting.
    """
    url = settings.AZURE_POSTGRESQL_URL if use_azure else settings.DATABASE_URL
    return create_async_engine(url, echo=settings.LOG_LEVEL == "DEBUG")
