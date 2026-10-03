import os
import sys
from pathlib import Path

# Ensure backend and project root are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Safe test environment configuration to prevent background telemetry threads
os.environ["AZURE_MONITOR_ENABLED"] = "false"
os.environ["APPLICATIONINSIGHTS_CONNECTION_STRING"] = ""
os.environ["TESTING"] = "true"
os.environ["APP_ENV"] = "test"
os.environ["LOCATION_PROVIDER"] = "mock"

import asyncio
from datetime import timedelta
from typing import AsyncGenerator, Callable, Dict, Any

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.models  # Register all ORM models
from app.main import app as fastapi_app
from app.db.base import Base
from app.db.session import get_db
from app.models.organization import Organization, OrganizationMembership
from app.models.user import Workspace, User
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.core.security import create_access_token, get_password_hash
from app.core.rate_limit import rate_limiter

TEST_WORKSPACE_ID = "ws-continental-fleet-01"
ALT_WORKSPACE_ID = "ws-alt-workspace-02"
TEST_ORG_ID = "org-nexus-demo"
ADMIN_CLERK_ID = "user_clerk_test_101"
VIEWER_CLERK_ID = "user_clerk_viewer_102"

@pytest.fixture
async def db_engine():
    """Initialize in-memory SQLite engine and create all application tables."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()

@pytest.fixture
def session_factory(db_engine):
    """Provides async session factory bound to the in-memory test engine."""
    return async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)

@pytest.fixture(autouse=True)
async def seed_test_database(session_factory):
    """Seed baseline multi-tenant database records for tests."""
    async with session_factory() as session:
        # 1. Organizations
        org = Organization(
            id=TEST_ORG_ID,
            name="Nexus Continental Freight",
            slug="nexus-continental",
            industry="LOGISTICS_AND_FREIGHT",
            is_active=True
        )
        alt_org = Organization(
            id="org-alt-demo",
            name="Alternative Logistics Corp",
            slug="alt-logistics",
            is_active=True
        )
        session.add_all([org, alt_org])
        await session.flush()

        # 2. Workspaces
        ws = Workspace(
            id=TEST_WORKSPACE_ID,
            name="Continental Fleet Ops",
            slug="continental-fleet-01",
            type="ENTERPRISE_LOGISTICS",
            organization_id=TEST_ORG_ID,
            is_active=True
        )
        alt_ws = Workspace(
            id=ALT_WORKSPACE_ID,
            name="Secondary Regional Operations",
            slug="secondary-regional-02",
            type="REGIONAL_DISTRIBUTION",
            organization_id="org-alt-demo",
            is_active=True
        )
        session.add_all([ws, alt_ws])
        await session.flush()

        # 3. Users
        admin_user = User(
            id="usr-test-101",
            clerk_user_id=ADMIN_CLERK_ID,
            email="test@nexus.continental",
            name="Test Lead Dispatcher",
            hashed_password=get_password_hash("Password123!"),
            role="ADMINISTRATOR",
            workspace_id=TEST_WORKSPACE_ID,
            organization_id=TEST_ORG_ID,
            is_active=True
        )
        viewer_user = User(
            id="usr-test-viewer",
            clerk_user_id=VIEWER_CLERK_ID,
            email="viewer@nexus.continental",
            name="Fleet Read-Only Viewer",
            hashed_password=get_password_hash("Password123!"),
            role="VIEWER",
            workspace_id=TEST_WORKSPACE_ID,
            organization_id=TEST_ORG_ID,
            is_active=True
        )
        session.add_all([admin_user, viewer_user])
        await session.flush()

        # 4. Warehouses
        wh_chi = Warehouse(
            id="wh-chi-01",
            code="WH-ORD-01",
            name="Chicago Logistics Hub",
            city="Chicago",
            state="IL",
            lat=41.8781,
            lng=-87.6298,
            capacity_units=15000,
            workspace_id=TEST_WORKSPACE_ID
        )
        wh_den = Warehouse(
            id="wh-den-01",
            code="WH-DEN-01",
            name="Denver Central Depot",
            city="Denver",
            state="CO",
            lat=39.7392,
            lng=-104.9903,
            capacity_units=12000,
            workspace_id=TEST_WORKSPACE_ID
        )
        session.add_all([wh_chi, wh_den])
        await session.flush()

        # 5. Route
        route_den_chi = Route(
            id="rt-den-chi",
            code="RT-DEN-CHI",
            name="I-80 Continental Corridor",
            origin_warehouse_id="wh-den-01",
            origin_warehouse_name="Denver Central Depot",
            dest_warehouse_id="wh-chi-01",
            dest_warehouse_name="Chicago Logistics Hub",
            distance_km=1620.0,
            avg_duration_mins=940,
            traffic_condition="NORMAL",
            workspace_id=TEST_WORKSPACE_ID
        )
        session.add(route_den_chi)
        await session.flush()

        # 6. Vehicle
        vehicle_104 = Vehicle(
            id="v-104",
            code="NX-104",
            name="Freightliner eCascadia #104",
            model="eCascadia-2026",
            driver_name="Marcus Vance",
            status="IN_TRANSIT",
            current_lat=41.2565,
            current_lng=-95.9345,
            speed_kmh=68.0,
            battery_pct=88,
            health_score=97,
            current_route_id="rt-den-chi",
            current_route_name="I-80 Continental Corridor",
            workspace_id=TEST_WORKSPACE_ID
        )
        session.add(vehicle_104)

        # 7. Order
        order_101 = Order(
            id="ord-101",
            order_number="ORD-9901-CHI",
            customer_name="AeroTech Avionics",
            destination="O'Hare Logistics Sector 4",
            priority="CRITICAL",
            status="IN_TRANSIT",
            total_cost=45000.0,
            deadline="2026-10-04T18:00:00Z",
            warehouse_id="wh-den-01",
            route_id="rt-den-chi",
            vehicle_id="v-104",
            vehicle_code="NX-104",
            workspace_id=TEST_WORKSPACE_ID
        )
        session.add(order_101)

        await session.commit()

@pytest.fixture(autouse=True)
def override_database_dependency(session_factory):
    """Overrides FastAPI's get_db dependency with session from test SQLite engine."""
    async def _test_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = _test_get_db
    yield
    fastapi_app.dependency_overrides.pop(get_db, None)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter state before each test to prevent cross-test throttle spillover."""
    rate_limiter.history.clear()
    yield

@pytest.fixture
def token_factory() -> Callable[..., str]:
    """Utility factory to mint authentic JWT tokens with custom claims."""
    def _create(
        sub: str = ADMIN_CLERK_ID,
        role: str = "ADMINISTRATOR",
        email: str = "test@nexus.continental",
        workspace_id: str = TEST_WORKSPACE_ID,
        expires_delta: timedelta = timedelta(minutes=60),
        extra_claims: Dict[str, Any] = None
    ) -> str:
        claims = {
            "email": email,
            "name": "Test Operator",
            "role": role,
            "workspace_id": workspace_id,
            "organization_id": TEST_ORG_ID,
        }
        if extra_claims:
            claims.update(extra_claims)
        return create_access_token(
            subject=sub,
            expires_delta=expires_delta,
            extra_claims=claims
        )
    return _create

@pytest.fixture
def admin_token(token_factory) -> str:
    """Standard valid admin token."""
    return token_factory(sub=ADMIN_CLERK_ID, role="ADMINISTRATOR")

@pytest.fixture
def viewer_token(token_factory) -> str:
    """Standard valid viewer token."""
    return token_factory(sub=VIEWER_CLERK_ID, role="VIEWER", email="viewer@nexus.continental")

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated HTTP client targeting the ASGI application directly."""
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.fixture
async def auth_client(admin_token: str) -> AsyncGenerator[AsyncClient, None]:
    """Pre-authenticated HTTP client with Bearer token and Workspace header."""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Workspace-ID": TEST_WORKSPACE_ID,
    }
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test", headers=headers) as client:
        yield client
