import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import async_session_factory
from sqlalchemy import select
from app.models.user import User
from app.models.operations import Vehicle, Route, Warehouse, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation, Decision
from app.models.system import AuditLog, EventOutbox, Notification
from app.core.security import create_access_token

# =========================================================================
# 1. BOUNDARY & MALFORMED PAYLOAD TESTS (Must return 4xx, never 500)
# =========================================================================

@pytest.mark.asyncio
async def test_adversarial_empty_payload_rejections():
    """Verify all POST/PATCH mutation endpoints reject empty JSON body with 422."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        endpoints = [
            ("POST", "/api/v1/auth/signup"),
            ("POST", "/api/v1/auth/login"),
            ("POST", "/api/v1/incidents"),
            ("PATCH", "/api/v1/incidents/inc-test-01"),
            ("POST", "/api/v1/incidents/inc-test-01/transition"),
            ("POST", "/api/v1/operations/warehouses"),
            ("POST", "/api/v1/operations/vehicles"),
            ("POST", "/api/v1/operations/routes"),
            ("POST", "/api/v1/operations/orders"),
            ("POST", "/api/v1/simulations"),
            ("PATCH", "/api/v1/admin/users/usr-test/role"),
        ]
        for method, endpoint in endpoints:
            if method == "POST":
                res = await client.post(endpoint, json={})
            else:
                res = await client.patch(endpoint, json={})
            assert res.status_code in [422, 400, 401, 403, 404, 409], f"Expected 4xx for {method} {endpoint} with empty payload, got {res.status_code}: {res.text}"

@pytest.mark.asyncio
async def test_adversarial_invalid_data_types():
    """Verify endpoints strictly reject invalid data types (e.g. strings where numbers expected)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/incidents", json={
            "title": "Invalid Type Test",
            "summary": "Testing schema validation",
            "severity": "HIGH",
            "affectedEntityType": "VEHICLE",
            "affectedEntityId": "v-104",
            "affectedEntityName": "Volvo VNR NX-104",
            "delayMinutes": ["invalid", "type"],
            "costEstimate": "not_a_float",
        })
        assert res.status_code in [400, 422], f"Expected 422/400, got {res.status_code}"

        res_rt = await client.post("/api/v1/operations/routes", json={
            "code": "RT-INV-01",
            "name": "Invalid Route",
            "originWarehouseId": "wh-chi",
            "originWarehouseName": "Chicago",
            "destWarehouseId": "wh-den",
            "destWarehouseName": "Denver",
            "distanceKm": {"nested": "value"},
            "avgDurationMins": "not-an-int",
            "workspaceId": "ws-test",
        })
        assert res_rt.status_code in [400, 422], f"Expected 422/400, got {res_rt.status_code}"

# =========================================================================
# 2. NON-EXISTENT ENTITY & STATE MACHINE VIOLATIONS (404 / 409)
# =========================================================================

@pytest.mark.asyncio
async def test_adversarial_non_existent_entity_lookups():
    """Verify 404 is returned for non-existent entities."""
    transport = ASGITransport(app=app)
    fake_id = "non-existent-id-999999"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(f"/api/v1/incidents/{fake_id}")
        assert res.status_code == 404

        res = await client.get(f"/api/v1/operations/warehouses/{fake_id}")
        assert res.status_code == 404

        res = await client.get(f"/api/v1/operations/vehicles/{fake_id}")
        assert res.status_code == 404

        res = await client.get(f"/api/v1/operations/routes/{fake_id}")
        assert res.status_code == 404

        res = await client.get(f"/api/v1/simulations/{fake_id}")
        assert res.status_code == 404

        admin_token = create_access_token(
            subject="usr-admin-adversarial",
            extra_claims={"email": "admin@nexus.continental", "name": "Admin", "role": "ADMINISTRATOR"}
        )
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        res = await client.post(
            f"/api/v1/simulations/{fake_id}/apply-decision",
            json={"actorName": "Tester"},
            headers=auth_headers
        )
        assert res.status_code == 404

        res = await client.get(f"/api/v1/admin/users/{fake_id}", headers=auth_headers)
        assert res.status_code == 404

        res = await client.patch(
            f"/api/v1/admin/users/{fake_id}/role",
            json={"role": "ADMINISTRATOR"},
            headers=auth_headers
        )
        assert res.status_code == 404

@pytest.mark.asyncio
async def test_adversarial_illegal_state_transition():
    """Verify illegal incident transitions trigger handled status code."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        c_res = await client.post("/api/v1/incidents", json={
            "title": "State Transition Test",
            "summary": "Testing illegal state transitions",
            "severity": "MEDIUM",
            "affectedEntityType": "VEHICLE",
            "affectedEntityId": "v-104",
            "affectedEntityName": "Volvo VNR NX-104",
        })
        assert c_res.status_code == 201
        inc_id = c_res.json()["id"]

        bad_trans = await client.post(f"/api/v1/incidents/{inc_id}/transition", json={
            "status": "RESOLVED",
            "note": "Skipping directly to resolved",
        })
        assert bad_trans.status_code in [200, 400, 409]

# =========================================================================
# 3. SECURITY & INJECTION VULNERABILITY TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_adversarial_sql_injection_resilience():
    """Verify SQL injection payloads in strings are safely handled and persisted verbatim without executing SQL."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sqli_title = "Corridor Incident '; DROP TABLE incidents; --"
        sqli_desc = "' OR '1'='1"
        res = await client.post("/api/v1/incidents", json={
            "title": sqli_title,
            "summary": sqli_desc,
            "severity": "CRITICAL",
            "affectedEntityType": "VEHICLE",
            "affectedEntityId": "v-104",
            "affectedEntityName": "Volvo VNR NX-104",
        })
        assert res.status_code == 201
        inc_data = res.json()
        assert inc_data["title"] == sqli_title
        created_id = inc_data["id"]

    async with async_session_factory() as session:
        inc = (await session.execute(
            select(Incident).where(Incident.id == created_id)
        )).scalars().first()
        assert inc is not None
        assert inc.title == sqli_title
        assert inc.summary == sqli_desc

@pytest.mark.asyncio
async def test_adversarial_warehouse_crud_persistence():
    """Verify Warehouse creation and persistence."""
    transport = ASGITransport(app=app)
    wh_code = f"WH-TEST-{uuid.uuid4().hex[:4].upper()}"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/operations/warehouses", json={
            "code": wh_code,
            "name": "Salt Lake Regional Superhub",
            "city": "Salt Lake City",
            "state": "UT",
            "lat": 40.7608,
            "lng": -111.8910,
            "capacityUnits": 12000,
            "currentUnits": 5000,
            "dockCount": 10,
            "activeDocks": 6,
            "efficiencyPct": 98.2,
            "status": "OPERATIONAL",
            "workspaceId": "ws-continental-fleet-01",
        })
        assert res.status_code == 201
        wh_id = res.json()["id"]

    async with async_session_factory() as session:
        wh = (await session.execute(
            select(Warehouse).where(Warehouse.id == wh_id)
        )).scalars().first()
        assert wh is not None
        assert wh.code == wh_code
        assert wh.capacity_units == 12000
        assert wh.efficiency_pct == 98.2

@pytest.mark.asyncio
async def test_adversarial_vehicle_crud_and_telemetry_patch():
    """Verify Vehicle creation and PATCH telemetry updates are persisted."""
    transport = ASGITransport(app=app)
    v_code = f"NX-TEST-{uuid.uuid4().hex[:4].upper()}"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/operations/vehicles", json={
            "code": v_code,
            "name": f"Freightliner Cascadia {v_code}",
            "model": "Cascadia e126",
            "driverName": "Jordan Reed",
            "status": "IN_TRANSIT",
            "currentLat": 41.8781,
            "currentLng": -87.6298,
            "speedKmh": 65.0,
            "batteryPct": 88,
            "healthScore": 99,
            "workspaceId": "ws-continental-fleet-01",
        })
        assert res.status_code == 201
        v_id = res.json()["id"]

        patch_res = await client.patch(f"/api/v1/operations/vehicles/{v_id}", json={
            "currentLat": 41.9000,
            "currentLng": -87.7000,
            "speedKmh": 72.5,
            "batteryPct": 82,
            "healthScore": 95,
            "status": "IN_TRANSIT",
        })
        assert patch_res.status_code == 200

    async with async_session_factory() as session:
        v = (await session.execute(
            select(Vehicle).where(Vehicle.id == v_id)
        )).scalars().first()
        assert v is not None
        assert v.speed_kmh == 72.5
        assert v.battery_pct == 82
        assert v.health_score == 95

@pytest.mark.asyncio
async def test_adversarial_order_crud_persistence():
    """Verify Order creation and persistence."""
    transport = ASGITransport(app=app)
    ord_num = f"ORD-2026-{uuid.uuid4().hex[:6].upper()}"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/operations/orders", json={
            "orderNumber": ord_num,
            "customerName": "Quantum Logistics Global",
            "destination": "Chicago Central Superhub",
            "priority": "CRITICAL",
            "status": "IN_TRANSIT",
            "totalCost": 34500.0,
            "deadline": "2026-09-10T12:00:00Z",
            "workspaceId": "ws-continental-fleet-01",
        })
        assert res.status_code == 201
        ord_id = res.json()["id"]

    async with async_session_factory() as session:
        ord_db = (await session.execute(
            select(Order).where(Order.id == ord_id)
        )).scalars().first()
        assert ord_db is not None
        assert ord_db.order_number == ord_num
        assert ord_db.total_cost == 34500.0

@pytest.mark.asyncio
async def test_adversarial_duplicate_signup_conflict():
    """Verify duplicate user registration returns 409 USER_ALREADY_EXISTS."""
    transport = ASGITransport(app=app)
    dup_email = f"dup_{uuid.uuid4().hex[:6]}@nexus.ops"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res1 = await client.post("/api/v1/auth/signup", json={
            "email": dup_email,
            "name": "First User",
            "password": "Password123!",
            "role": "OPERATOR",
            "workspaceId": "ws-continental-fleet-01",
        })
        assert res1.status_code == 201

        res2 = await client.post("/api/v1/auth/signup", json={
            "email": dup_email,
            "name": "Duplicate User",
            "password": "Password123!",
            "role": "OPERATOR",
            "workspaceId": "ws-continental-fleet-01",
        })
        assert res2.status_code == 409
