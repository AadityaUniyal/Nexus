import asyncio
import os
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.auth.dependencies import require_onboarded, require_authenticated, require_workspace
from app.auth.principal import RequestPrincipal, RoleEnum, ROLE_PERMISSIONS_MAP

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

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provides an async HTTP client connected directly to the FastAPI app."""
    app.dependency_overrides[require_onboarded] = lambda: mock_principal
    app.dependency_overrides[require_authenticated] = lambda: mock_principal
    app.dependency_overrides[require_workspace] = lambda: mock_principal
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
