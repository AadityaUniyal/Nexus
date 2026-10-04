import asyncio
import os
import sys

# Ensure testing environment flags are active before importing the app
os.environ["APP_ENV"] = "test"
os.environ["TESTING"] = "1"

import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.auth.dependencies import require_onboarded, require_authenticated, require_workspace
from app.auth.principal import RequestPrincipal, RoleEnum, ROLE_PERMISSIONS_MAP
from app.db.session import get_db

mock_principal = RequestPrincipal(
    nexus_user_id="usr-test-101",
    clerk_user_id="user_clerk_test_101",
    email="test@nexus.continental",
    display_name="Test Operator",
    workspace_id="ws-continental-fleet-01",
    role=RoleEnum.ADMINISTRATOR,
    permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
    onboarding_completed=True,
    is_active=True
)

class MockExecuteResult:
    def __init__(self, items=None, scalar_val=0):
        self._items = items or []
        self._scalar_val = scalar_val

    def scalars(self):
        m = MagicMock()
        m.all.return_value = self._items
        m.first.return_value = self._items[0] if self._items else None
        return m

    def scalar(self):
        return self._scalar_val

    def all(self):
        return self._items

    def first(self):
        return self._items[0] if self._items else None

    def scalar_one_or_none(self):
        return self._items[0] if self._items else None

    def scalar_one(self):
        if not self._items:
            return None
        return self._items[0]

async def mock_get_db() -> AsyncGenerator[AsyncMock, None]:
    session = AsyncMock()
    session.execute.return_value = MockExecuteResult()
    session.scalars = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[]), first=MagicMock(return_value=None)))
    session.scalar = AsyncMock(return_value=0)
    session.commit = AsyncMock(return_value=None)
    session.rollback = AsyncMock(return_value=None)
    session.close = AsyncMock(return_value=None)
    session.add = MagicMock()
    session.add_all = MagicMock()
    yield session

@pytest.fixture(scope="session", autouse=True)
def teardown_telemetry():
    """Teardown fixture ensuring session resources are cleanly finalized."""
    yield

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provides an async HTTP client connected directly to the FastAPI app."""
    app.dependency_overrides[require_onboarded] = lambda: mock_principal
    app.dependency_overrides[require_authenticated] = lambda: mock_principal
    app.dependency_overrides[require_workspace] = lambda: mock_principal
    app.dependency_overrides[get_db] = mock_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

