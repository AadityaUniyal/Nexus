import asyncio
import os
import sys
import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Configure testing environment
os.environ["APP_ENV"] = "test"
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_nexus.db"
os.environ["CLERK_SECRET_KEY"] = "sk_test_mock_clerk_secret_key_12345"
os.environ["AZURE_MAPS_CLIENT_ID"] = "mock-maps-client-id"

from app.db.base import Base
import app.models  # load all models
from app.main import app
from app.db.session import get_db
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal, RoleEnum
from app.models.workspace import Workspace, WorkspaceMember

TEST_DB_URL = "sqlite+aiosqlite:///./test_nexus.db"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

# Tenant A Principal
principal_tenant_a = RequestPrincipal(
    user_id="user_tenant_a",
    email="alice@tenant-a.com",
    display_name="Alice Owner",
    workspace_id="ws_tenant_a",
    role=RoleEnum.OWNER,
    needs_onboarding=False,
)

# Tenant B Principal
principal_tenant_b = RequestPrincipal(
    user_id="user_tenant_b",
    email="bob@tenant-b.com",
    display_name="Bob Owner",
    workspace_id="ws_tenant_b",
    role=RoleEnum.OWNER,
    needs_onboarding=False,
)


# Let pytest-asyncio manage event loop per test


@pytest.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed Tenant A and Tenant B Workspaces
    async with TestSessionLocal() as session:
        ws_a = Workspace(
            id="ws_tenant_a",
            name="Tenant A Logistics",
            country="US",
            timezone="America/New_York",
            locale="en-US",
            distance_unit="mi",
        )
        ws_b = Workspace(
            id="ws_tenant_b",
            name="Tenant B Freight",
            country="DE",
            timezone="Europe/Berlin",
            locale="de-DE",
            distance_unit="km",
        )
        session.add_all([ws_a, ws_b])
        await session.flush()

        member_a = WorkspaceMember(
            workspace_id="ws_tenant_a",
            user_id="user_tenant_a",
            email="alice@tenant-a.com",
            name="Alice Owner",
            role=RoleEnum.OWNER.value,
        )
        member_b = WorkspaceMember(
            workspace_id="ws_tenant_b",
            user_id="user_tenant_b",
            email="bob@tenant-b.com",
            name="Bob Owner",
            role=RoleEnum.OWNER.value,
        )
        session.add_all([member_a, member_b])
        await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from fastapi import Request, HTTPException

async def override_get_current_principal(request: Request) -> RequestPrincipal:
    tenant = request.headers.get("X-Test-Tenant")
    if tenant == "b":
        return principal_tenant_b
    elif tenant == "a":
        return principal_tenant_a
    raise HTTPException(status_code=401, detail="Authentication required")


@pytest.fixture
async def client_a() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_principal] = override_get_current_principal
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"X-Test-Tenant": "a"}) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def client_b() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_principal] = override_get_current_principal
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"X-Test-Tenant": "b"}) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def unauth_client() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_principal] = override_get_current_principal
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
