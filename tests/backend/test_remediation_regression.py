import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import async_session_factory
from sqlalchemy import select
from app.models.user import User
from app.models.operations import Vehicle, Route, Warehouse
from app.models.incidents import Incident
from app.models.simulations import Simulation, Decision
from app.models.system import EventOutbox, Notification
from app.realtime.sse import broadcaster
from app.services.event_service import record_operational_event
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_remediation_event_broadcaster_alias():
    """Verify that broadcaster.broadcast_event alias exists and functions correctly."""
    assert hasattr(broadcaster, "broadcast_event")
    # Call directly without error
    await broadcaster.broadcast_event(
        event_type="test.event",
        data={"message": "Telemetry pulse nominal", "severity": "INFO"}
    )

@pytest.mark.asyncio
async def test_remediation_record_operational_event_integration():
    """Verify that record_operational_event enqueues outbox and broadcasts event without error."""
    async with async_session_factory() as db:
        evt = await record_operational_event(
            db=db,
            workspace_id="ws-continental-fleet-01",
            event_type="unit.test.event",
            entity_type="SYSTEM",
            entity_id="sys-test-01",
            message="Remediation test event",
            severity="INFO",
            payload={"test": True}
        )
        await db.commit()
        assert evt is not None
        assert evt.id.startswith("evt-")

@pytest.mark.asyncio
async def test_remediation_auth_signup_clerk_user_id_persistence():
    """Verify that signup generates clerk_user_id and persists to DB without NOT NULL error."""
    transport = ASGITransport(app=app)
    unique_email = f"operator_{uuid.uuid4().hex[:6]}@nexus.ops"
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/auth/signup", json={
            "email": unique_email,
            "name": "Alex Mercer",
            "password": "SecurePassword123!",
            "role": "OPERATOR",
            "department": "Superhub Dispatch",
            "workspace_id": "ws-continental-fleet-01",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == unique_email
        assert "id" in data

    # Verify DB persistence and clerk_user_id presence
    async with async_session_factory() as session:
        user = (await session.execute(
            select(User).where(User.email == unique_email)
        )).scalars().first()
        assert user is not None
        assert user.clerk_user_id is not None
        assert user.clerk_user_id.startswith("local_")

@pytest.mark.asyncio
async def test_remediation_strict_demo_password_check():
    """Verify that demo logins reject arbitrary passwords with 401 and accept valid demo credentials."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Arbitrary password must return 401
        res_fail = await client.post("/api/v1/auth/login", json={
            "email": "sarah.chen@nexus.ops",
            "password": "random_unauthorized_pw",
        })
        assert res_fail.status_code == 401

        # 2. Valid demo password returns 200
        res_ok = await client.post("/api/v1/auth/login", json={
            "email": "sarah.chen@nexus.ops",
            "password": "Password123!",
        })
        assert res_ok.status_code == 200
        assert "access_token" in res_ok.json()

@pytest.mark.asyncio
async def test_remediation_incident_camelcase_schema_and_persistence():
    """Verify that IncidentCreate accepts camelCase payload from frontend and persists to DB."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "title": "Interstate Route Congestion Alert",
            "summary": "Severe 2-hour queue due to multi-vehicle incident.",
            "severity": "HIGH",
            "affectedEntityType": "VEHICLE",
            "affectedEntityId": "v-104",
            "affectedEntityName": "Volvo VNR NX-104",
            "delayMinutes": 90,
            "costEstimate": 4200.50,
            "rootCause": "Multi-vehicle traffic collision",
            "aiAnalysis": "Recommended alternate route via I-70.",
            "workspaceId": "ws-continental-fleet-01",
        }
        res = await client.post("/api/v1/incidents", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == payload["title"]
        assert (data.get("affected_entity_name") == "Volvo VNR NX-104" or data.get("affectedEntityName") == "Volvo VNR NX-104")
        assert (data.get("delay_minutes") == 90 or data.get("delayMinutes") == 90)
        created_id = data["id"]

    # Verify DB persistence
    async with async_session_factory() as session:
        inc = (await session.execute(
            select(Incident).where(Incident.id == created_id)
        )).scalars().first()
        assert inc is not None
        assert inc.delay_minutes == 90
        assert inc.cost_estimate == 4200.50

@pytest.mark.asyncio
async def test_remediation_incident_previous_status_audit_trail():
    """Verify that incident state transitions preserve previousStatus in outbox payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create incident
        create_res = await client.post("/api/v1/incidents", json={
            "title": "Outbox Audit Trail Verification Incident",
            "summary": "Testing outbox status recording.",
            "severity": "MEDIUM",
            "affectedEntityType": "WAREHOUSE",
            "affectedEntityId": "wh-chi",
            "affectedEntityName": "Chicago Hub",
            "delayMinutes": 30,
            "costEstimate": 500.0,
        })
        assert create_res.status_code == 201
        inc_id = create_res.json()["id"]

        # Transition DETECTED -> ACKNOWLEDGED
        trans_res = await client.post(f"/api/v1/incidents/{inc_id}/transition", json={
            "status": "ACKNOWLEDGED",
            "note": "Acknowledged by supervisor",
            "actorName": "Sarah Chen",
        })
        assert trans_res.status_code == 200

    # Verify Outbox payload
    async with async_session_factory() as session:
        outbox = (await session.execute(
            select(EventOutbox).where(
                EventOutbox.aggregate_id == inc_id,
                EventOutbox.event_type == "incident.transitioned"
            )
        )).scalars().first()
        assert outbox is not None
        assert outbox.payload["previousStatus"] == "DETECTED"
        assert outbox.payload["newStatus"] == "ACKNOWLEDGED"

@pytest.mark.asyncio
async def test_remediation_incident_missing_endpoints():
    """Verify PATCH and convenience transition endpoints: acknowledge, start-investigation, resolve."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create incident
        c_res = await client.post("/api/v1/incidents", json={
            "title": "Incident Endpoint Test",
            "summary": "Testing PATCH and convenience endpoints",
            "severity": "LOW",
            "affectedEntityType": "VEHICLE",
            "affectedEntityId": "v-109",
            "affectedEntityName": "Vehicle NX-109",
        })
        assert c_res.status_code == 201
        inc_id = c_res.json()["id"]

        # 1. PATCH incident
        p_res = await client.patch(f"/api/v1/incidents/{inc_id}", json={
            "delayMinutes": 45,
            "note": "Updated delay estimate",
        })
        assert p_res.status_code == 200

        # 2. POST acknowledge
        ack_res = await client.post(f"/api/v1/incidents/{inc_id}/acknowledge")
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

        # 3. POST start-investigation
        inv_res = await client.post(f"/api/v1/incidents/{inc_id}/start-investigation")
        assert inv_res.status_code == 200
        assert inv_res.json()["status"] == "INVESTIGATING"

        # 4. POST resolve
        res_res = await client.post(f"/api/v1/incidents/{inc_id}/resolve")
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "RESOLVED"

@pytest.mark.asyncio
async def test_remediation_simulation_decision_without_incident_no_name_error():
    """Verify that applying a simulation decision with no incident does not crash with NameError (inc_ref fix)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create simulation without incident
        sim_res = await client.post("/api/v1/simulations", json={
            "title": "Standalone Fleet Scenario",
            "description": "Simulation without linked incident",
            "incidentId": None,
            "variables": {
                "vehicleId": "v-104",
                "alternateRouteType": "I-70_SOUTH_DETOUR",
                "speedDeltaPct": 5.0,
                "fuelCostPerKm": 0.45,
                "priorityReordering": False,
            },
        })
        assert sim_res.status_code == 201
        sim_id = sim_res.json()["id"]

        # Re-run simulation endpoint
        run_res = await client.post(f"/api/v1/simulations/{sim_id}/run")
        assert run_res.status_code == 200
        assert run_res.json()["status"] == "EVALUATED"

        # Apply decision with authenticated dispatch principal - must not raise NameError: inc_ref
        dispatch_token = create_access_token(
            subject="usr-dispatch-test",
            extra_claims={"email": "sarah.chen@nexus.continental", "name": "Sarah Chen", "role": "OPERATIONS_MANAGER"}
        )
        apply_res = await client.post(
            f"/api/v1/simulations/{sim_id}/apply-decision",
            json={"actorName": "Sarah Chen", "operatorNotes": "Applied standalone detour"},
            headers={"Authorization": f"Bearer {dispatch_token}"}
        )
        assert apply_res.status_code == 200
        assert apply_res.json()["status"] == "APPLIED"

@pytest.mark.asyncio
async def test_remediation_operations_route_creation():
    """Verify POST /api/v1/operations/routes creates and persists new route."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        route_payload = {
            "code": f"RT-TEST-{uuid.uuid4().hex[:4].upper()}",
            "name": "Denver to Salt Lake City Express",
            "originWarehouseId": "wh-den",
            "originWarehouseName": "Denver Hub",
            "destWarehouseId": "wh-chi",
            "destWarehouseName": "Chicago Hub",
            "distanceKm": 850.0,
            "avgDurationMins": 520,
            "trafficCondition": "NORMAL",
            "waypoints": [],
            "workspaceId": "ws-continental-fleet-01",
        }
        res = await client.post("/api/v1/operations/routes", json=route_payload)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Denver to Salt Lake City Express"
        route_id = data["id"]

    # Verify DB persistence
    async with async_session_factory() as session:
        route_db = (await session.execute(
            select(Route).where(Route.id == route_id)
        )).scalars().first()
        assert route_db is not None
        assert route_db.distance_km == 850.0

@pytest.mark.asyncio
async def test_remediation_admin_endpoints():
    """Verify all admin endpoints reject unauthenticated requests with 401, and authorized requests succeed with 200."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Verify unauthenticated requests return 401
        unauth_overview = await client.get("/api/v1/admin/overview")
        assert unauth_overview.status_code == 401

        unauth_users = await client.get("/api/v1/admin/users")
        assert unauth_users.status_code == 401

        # B. Authorize with Admin token
        admin_token = create_access_token(
            subject="usr-admin-test",
            extra_claims={"email": "admin@nexus.continental", "name": "Platform Admin", "role": "ADMINISTRATOR"}
        )
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. GET /admin/overview
        overview_res = await client.get("/api/v1/admin/overview", headers=auth_headers)
        assert overview_res.status_code == 200
        assert "usersCount" in overview_res.json()
        assert overview_res.json()["systemStatus"] == "HEALTHY"

        # 2. GET /admin/system-health
        health_res = await client.get("/api/v1/admin/system-health", headers=auth_headers)
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "HEALTHY"

        # 3. GET /admin/integrations
        integ_res = await client.get("/api/v1/admin/integrations", headers=auth_headers)
        assert integ_res.status_code == 200
        assert len(integ_res.json()) >= 4

        # 4. POST /admin/integrations/{provider}/test
        test_prov_res = await client.post("/api/v1/admin/integrations/groq/test", headers=auth_headers)
        assert test_prov_res.status_code == 200

        # 5. List users, fetch single user, and update role
        users_res = await client.get("/api/v1/admin/users", headers=auth_headers)
        assert users_res.status_code == 200
        users = users_res.json()
        assert len(users) > 0
        target_user = users[0]

        get_u_res = await client.get(f"/api/v1/admin/users/{target_user['id']}", headers=auth_headers)
        assert get_u_res.status_code == 200
        assert get_u_res.json()["id"] == target_user["id"]

        patch_role_res = await client.patch(
            f"/api/v1/admin/users/{target_user['id']}/role",
            json={"role": "ADMINISTRATOR"},
            headers=auth_headers
        )
        assert patch_role_res.status_code == 200
        assert patch_role_res.json()["role"] == "ADMINISTRATOR"

@pytest.mark.asyncio
async def test_remediation_notifications_read_methods():
    """Verify notifications mark-as-read supports PATCH and POST, plus POST /read-all."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List notifications to get an ID
        notifs_res = await client.get("/api/v1/notifications")
        assert notifs_res.status_code == 200
        notifs = notifs_res.json()
        assert len(notifs) > 0
        n_id = notifs[0]["id"]

        # POST /notifications/{id}/read
        post_read_res = await client.post(f"/api/v1/notifications/{n_id}/read")
        assert post_read_res.status_code == 200
        assert post_read_res.json()["read"] is True

        # PATCH /notifications/{id}/read
        patch_read_res = await client.patch(f"/api/v1/notifications/{n_id}/read")
        assert patch_read_res.status_code == 200
        assert patch_read_res.json()["read"] is True

        # POST /notifications/read-all
        read_all_res = await client.post("/api/v1/notifications/read-all")
        assert read_all_res.status_code == 200
        assert read_all_res.json()["success"] is True

@pytest.mark.asyncio
async def test_remediation_ai_explain_endpoint():
    """Verify POST /api/v1/ai/explain generates an explanation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/ai/explain", json={
            "incidentId": "inc-8041",
            "context": "Interstate winter weather disruption",
        })
        assert res.status_code == 200
        data = res.json()
        assert "explanation" in data
        assert len(data["explanation"]) > 10

@pytest.mark.asyncio
async def test_remediation_aggregated_overview_endpoint():
    """Verify GET /api/v1/overview returns aggregated stats, top incident, and briefing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/overview")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "stats" in data
        assert "totalVehicles" in data["stats"]
        assert "activeIncidents" in data["stats"]
        assert "slaCompliance" in data["stats"]
        assert "briefing" in data
