import uuid
import pytest
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 1: Health Endpoints (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_live_root(async_client: AsyncClient):
    """Test root liveness probe endpoint."""
    response = await async_client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LIVE"
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_health_ready_root(async_client: AsyncClient):
    """Test root readiness probe endpoint confirming database connectivity."""
    response = await async_client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["READY", "DEGRADED"]
    assert "database" in data
    assert "redis" in data

@pytest.mark.asyncio
async def test_health_live_api_v1(async_client: AsyncClient):
    """Test /api/v1/health/live endpoint."""
    response = await async_client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LIVE"
    assert "version" in data
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_health_ready_api_v1(async_client: AsyncClient):
    """Test /api/v1/health/ready endpoint confirming DB pool and integrations."""
    response = await async_client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["READY", "DEGRADED"]
    assert data["databaseConnected"] is True
    assert "version" in data

@pytest.mark.asyncio
async def test_health_alias_api_v1(async_client: AsyncClient):
    """Test /api/v1/health endpoint as alias to readiness probe."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["READY", "DEGRADED"]
    assert "databaseConnected" in data

@pytest.mark.asyncio
async def test_root_operational_info(async_client: AsyncClient):
    """Test root `/` endpoint providing platform metadata and documentation URL."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "NEXUS" in data["name"]
    assert data["docsUrl"] == "/docs"
    assert data["apiPrefix"] == "/api/v1"


# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 2: Clerk Authentication & Security Headers (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auth_login_valid_credentials(async_client: AsyncClient):
    """Test user login with valid credentials issuing authentic JWT bearer token."""
    payload = {
        "email": "test@nexus.continental",
        "password": "Password123!"
    }
    response = await async_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@nexus.continental"
    assert data["user"]["role"] == "ADMINISTRATOR"

@pytest.mark.asyncio
async def test_auth_signup_new_operator(async_client: AsyncClient):
    """Test self-service registration of a new operator in workspace."""
    unique_email = f"operator_{uuid.uuid4().hex[:6]}@nexus.continental"
    payload = {
        "email": unique_email,
        "name": "Alex Mercer",
        "password": "StrongPassword123!",
        "role": "OPERATOR",
        "department": "Interstate Dispatch",
        "workspace_id": "ws-continental-fleet-01"
    }
    response = await async_client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "OPERATOR"

@pytest.mark.asyncio
async def test_auth_bearer_token_access_protected_endpoint(auth_client: AsyncClient):
    """Test accessing protected telematics endpoint using authentic JWT bearer token."""
    response = await auth_client.get("/api/v1/telemetry/live")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_auth_x_workspace_id_header_handling(async_client: AsyncClient, admin_token: str):
    """Test passing X-Workspace-ID header in authenticated requests."""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Workspace-ID": "ws-continental-fleet-01"
    }
    response = await async_client.get("/api/v1/operations/warehouses", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_auth_owasp_security_headers_enforced(async_client: AsyncClient):
    """Verify standard OWASP security response headers on all API responses."""
    response = await async_client.get("/health/live")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "X-Request-ID" in response.headers

@pytest.mark.asyncio
async def test_auth_forgot_password_generic_response(async_client: AsyncClient):
    """Test password reset request returns generic safe response preventing email enumeration."""
    response = await async_client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@nexus.fake"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "password reset link" in data["message"]


# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 3: Fleet & Operations (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_operations_list_warehouses(auth_client: AsyncClient):
    """Test listing warehouses in workspace."""
    response = await auth_client.get("/api/v1/operations/warehouses")
    assert response.status_code == 200
    warehouses = response.json()
    assert isinstance(warehouses, list)
    assert len(warehouses) >= 2
    codes = [w["code"] for w in warehouses]
    assert "WH-ORD-01" in codes
    assert "WH-DEN-01" in codes

@pytest.mark.asyncio
async def test_operations_get_warehouse_by_id_or_code(auth_client: AsyncClient):
    """Test retrieving warehouse details by ID or code."""
    response = await auth_client.get("/api/v1/operations/warehouses/wh-chi-01")
    assert response.status_code == 200
    wh = response.json()
    assert wh["id"] == "wh-chi-01"
    assert wh["city"] == "Chicago"
    assert wh.get("capacityUnits") == 15000 or wh.get("capacity_units") == 15000

@pytest.mark.asyncio
async def test_operations_create_warehouse(auth_client: AsyncClient):
    """Test registering a new logistics hub warehouse."""
    wh_code = f"WH-SEA-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "code": wh_code,
        "name": "Seattle Puget Distribution Center",
        "city": "Seattle",
        "state": "WA",
        "lat": 47.6062,
        "lng": -122.3321,
        "capacityUnits": 18000,
        "dockCount": 12,
        "efficiencyPct": 96.5,
        "status": "OPERATIONAL",
        "workspaceId": "ws-continental-fleet-01"
    }
    response = await auth_client.post("/api/v1/operations/warehouses", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["code"] == wh_code
    assert data["city"] == "Seattle"
    assert "id" in data

@pytest.mark.asyncio
async def test_operations_list_vehicles(auth_client: AsyncClient):
    """Test listing commercial fleet vehicles in workspace."""
    response = await auth_client.get("/api/v1/operations/vehicles")
    assert response.status_code == 200
    vehicles = response.json()
    assert isinstance(vehicles, list)
    assert len(vehicles) >= 1
    codes = [v["code"] for v in vehicles]
    assert "NX-104" in codes

@pytest.mark.asyncio
async def test_operations_get_vehicle_by_id(auth_client: AsyncClient):
    """Test retrieving vehicle details by ID."""
    response = await auth_client.get("/api/v1/operations/vehicles/v-104")
    assert response.status_code == 200
    veh = response.json()
    assert veh["id"] == "v-104"
    assert veh["code"] == "NX-104"
    assert veh.get("driverName") == "Marcus Vance" or veh.get("driver_name") == "Marcus Vance"
    assert veh.get("batteryPct") == 88 or veh.get("battery_pct") == 88

@pytest.mark.asyncio
async def test_operations_create_vehicle(auth_client: AsyncClient):
    """Test adding a new commercial vehicle to the fleet."""
    v_code = f"NX-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "code": v_code,
        "name": f"Freightliner eCascadia {v_code}",
        "model": "eCascadia-2026",
        "driverName": "Elena Rostova",
        "status": "AVAILABLE",
        "currentLat": 39.7392,
        "currentLng": -104.9903,
        "speedKmh": 0.0,
        "batteryPct": 100,
        "healthScore": 99,
        "workspaceId": "ws-continental-fleet-01"
    }
    response = await auth_client.post("/api/v1/operations/vehicles", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["code"] == v_code
    assert data.get("driverName") == "Elena Rostova" or data.get("driver_name") == "Elena Rostova"

@pytest.mark.asyncio
async def test_operations_patch_vehicle_telemetry(auth_client: AsyncClient):
    """Test updating live vehicle telemetry (speed, coords, battery)."""
    payload = {
        "currentLat": 41.5000,
        "currentLng": -95.5000,
        "speedKmh": 72.5,
        "batteryPct": 82,
        "status": "IN_TRANSIT"
    }
    response = await auth_client.patch("/api/v1/operations/vehicles/v-104/telemetry", json=payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated.get("currentLat") == 41.5000 or updated.get("current_lat") == 41.5000
    assert updated.get("speedKmh") == 72.5 or updated.get("speed_kmh") == 72.5
    assert updated.get("batteryPct") == 82 or updated.get("battery_pct") == 82


# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 4: Incidents Management (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_incidents_list(auth_client: AsyncClient):
    """Test listing operational incidents."""
    response = await auth_client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_incidents_create_incident(auth_client: AsyncClient):
    """Test creating an operational incident with outbox and timeline."""
    payload = {
        "title": "I-80 Blizzard Corridor Disruption",
        "summary": "Severe winter blizzard closed Interstate 80 between North Platte and Lincoln.",
        "severity": "CRITICAL",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 180,
        "cost_estimate": 14500.0,
        "root_cause": "Winter storm warning closure",
        "ai_analysis": "Recommend routing south via Denver I-70 corridor."
    }
    response = await auth_client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    inc = response.json()
    assert inc["title"] == payload["title"]
    assert inc["severity"] == "CRITICAL"
    assert inc["status"] == "DETECTED"
    assert len(inc["timeline"]) >= 1
    assert inc["timeline"][0]["status"] == "DETECTED"

@pytest.mark.asyncio
async def test_incidents_get_by_id(auth_client: AsyncClient):
    """Test retrieving an incident with audit timeline."""
    # Create incident first
    payload = {
        "title": "Minor Sensor Fault",
        "summary": "Tire pressure telemetry sensor intermittent ping failure.",
        "severity": "LOW",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 15,
        "cost_estimate": 250.0
    }
    create_res = await auth_client.post("/api/v1/incidents", json=payload)
    assert create_res.status_code == 201
    inc_id = create_res.json()["id"]

    get_res = await auth_client.get(f"/api/v1/incidents/{inc_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == inc_id
    assert data["title"] == "Minor Sensor Fault"
    assert len(data["timeline"]) >= 1

@pytest.mark.asyncio
async def test_incidents_filter_by_severity(auth_client: AsyncClient):
    """Test filtering incident queries by severity parameter."""
    response = await auth_client.get("/api/v1/incidents?severity=CRITICAL")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)
    for inc in incidents:
        assert inc["severity"] == "CRITICAL"

@pytest.mark.asyncio
async def test_incidents_acknowledge_transition(auth_client: AsyncClient):
    """Test operator acknowledgement state machine transition."""
    # Create incident
    payload = {
        "title": "Congestion Incident",
        "summary": "Severe traffic congestion in Chicago metro sector.",
        "severity": "MEDIUM",
        "affected_entity_type": "ROUTE",
        "affected_entity_id": "rt-den-chi",
        "affected_entity_name": "I-80 Continental Corridor",
        "delay_minutes": 45,
        "cost_estimate": 1200.0
    }
    create_res = await auth_client.post("/api/v1/incidents", json=payload)
    inc_id = create_res.json()["id"]

    ack_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    statuses = [t["status"] for t in ack_data["timeline"]]
    assert "ACKNOWLEDGED" in statuses

@pytest.mark.asyncio
async def test_incidents_investigate_and_resolve_flow(auth_client: AsyncClient):
    """Test progressing incident through INVESTIGATING to RESOLVED."""
    payload = {
        "title": "Fuel Sensor Fluctuation",
        "summary": "Auxiliary battery BMS reporting temporary voltage drop.",
        "severity": "LOW",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 10,
        "cost_estimate": 100.0
    }
    create_res = await auth_client.post("/api/v1/incidents", json=payload)
    inc_id = create_res.json()["id"]

    # Start investigation
    inv_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/start-investigation")
    assert inv_res.status_code == 200
    assert inv_res.json()["status"] == "INVESTIGATING"

    # Resolve incident
    res_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/resolve")
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"


# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 5: Simulations & What-If Physics Engine (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_simulations_list(auth_client: AsyncClient):
    """Test listing What-If simulation scenarios."""
    response = await auth_client.get("/api/v1/simulations")
    assert response.status_code == 200
    sims = response.json()
    assert isinstance(sims, list)
    assert len(sims) >= 1

@pytest.mark.asyncio
async def test_simulations_evaluate_deterministic(async_client: AsyncClient):
    """Test physics-based deterministic simulation evaluation."""
    payload = {
        "base_metrics": {
            "totalDistanceKm": 1620.0,
            "avgDurationMins": 940,
            "currentDelayMins": 180,
            "ordersCount": 14,
            "totalOrderValue": 45000.0,
            "baseCostUsd": 1450.0,
            "slaBreachRiskPct": 88.0
        },
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": True
        }
    }
    response = await async_client.post("/api/v1/simulations/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "totalDistanceKm" in data
    assert "netTimeSavedMins" in data
    assert "recommendationScore" in data
    assert data["recommendationScore"] >= 0
    assert "verdict" in data
    assert isinstance(data["insights"], list)

@pytest.mark.asyncio
async def test_simulations_evaluate_stochastic_monte_carlo(async_client: AsyncClient):
    """Test Monte Carlo stochastic simulation computing confidence percentiles."""
    payload = {
        "base_metrics": {
            "totalDistanceKm": 1250.0,
            "avgDurationMins": 750,
            "currentDelayMins": 90,
            "ordersCount": 8,
            "totalOrderValue": 25000.0,
            "baseCostUsd": 1100.0
        },
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "HIGHWAY_BYPASS",
            "speedDeltaPct": 5.0,
            "fuelCostPerKm": 0.45
        }
    }
    response = await async_client.post("/api/v1/simulations/evaluate-stochastic?iterations=100", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "stochastic_confidence" in data or "deterministic" in data
    stoch = data.get("stochastic_confidence", {})
    assert stoch.get("iterations") == 100 or "p50" in str(data)

@pytest.mark.asyncio
async def test_simulations_create_scenario(auth_client: AsyncClient):
    """Test creating and persisting a What-If scenario in PostgreSQL/SQLite."""
    payload = {
        "title": "Denver South Detour Evaluation",
        "description": "Bypass I-80 corridor via southern I-70 alignment.",
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 8.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": True
        }
    }
    response = await auth_client.post("/api/v1/simulations", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["status"] == "EVALUATED"
    assert "simulatedMetrics" in data or "simulated_metrics" in data

@pytest.mark.asyncio
async def test_simulations_run_existing(auth_client: AsyncClient):
    """Test re-executing an existing simulation scenario."""
    # List simulations to obtain an ID
    list_res = await auth_client.get("/api/v1/simulations")
    sims = list_res.json()
    sim_id = sims[0]["id"]

    run_res = await auth_client.post(f"/api/v1/simulations/{sim_id}/run")
    assert run_res.status_code == 200
    data = run_res.json()
    assert data["id"] == sim_id
    assert data["status"] == "EVALUATED"

@pytest.mark.asyncio
async def test_simulations_apply_decision(auth_client: AsyncClient):
    """Test committing and applying simulation decision to operational state."""
    # Create scenario
    payload = {
        "title": "Apply Detour Decision Scenario",
        "description": "Commit reroute decision for immediate dispatch execution.",
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 5.0
        }
    }
    create_res = await auth_client.post("/api/v1/simulations", json=payload)
    sim_id = create_res.json()["id"]

    apply_payload = {
        "action": "REROUTE_APPROVED",
        "notes": "Operations Commander approved emergency bypass.",
        "approver_id": "usr-test-101"
    }
    apply_res = await auth_client.post(f"/api/v1/simulations/{sim_id}/apply-decision", json=apply_payload)
    assert apply_res.status_code == 200
    data = apply_res.json()
    assert data["status"] == "APPLIED"
    assert data.get("appliedAt") is not None or data.get("applied_at") is not None


# ---------------------------------------------------------------------------
# Tier 1 - Core Feature Area 6: Azure Integrations (>=5 tests)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_azure_health_aggregation_endpoint(async_client: AsyncClient):
    """Test /health/azure reports comprehensive status across all integrated Azure services."""
    response = await async_client.get("/health/azure")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert data["platform"] == "Azure Free Tier"
    assert "services" in data
    assert "monthlyCost" in data

@pytest.mark.asyncio
async def test_azure_application_insights_reported(async_client: AsyncClient):
    """Test Application Insights service status and free tier limits in Azure health."""
    response = await async_client.get("/health/azure")
    services = response.json()["services"]
    assert "applicationInsights" in services
    ai_status = services["applicationInsights"]
    assert "status" in ai_status
    assert "freeTierLimit" in ai_status
    assert "5 GB" in ai_status["freeTierLimit"]

@pytest.mark.asyncio
async def test_azure_blob_storage_medallion_architecture_reported(async_client: AsyncClient):
    """Test Blob Storage medallion bronze/silver/gold containers reported in Azure health."""
    response = await async_client.get("/health/azure")
    services = response.json()["services"]
    assert "blobStorage" in services
    blob_info = services["blobStorage"]
    assert "medallionContainers" in blob_info
    assert "telemetry-bronze" in blob_info["medallionContainers"]
    assert "telemetry-silver" in blob_info["medallionContainers"]
    assert "analytics-gold" in blob_info["medallionContainers"]

@pytest.mark.asyncio
async def test_azure_iot_hub_webhook_adapter(async_client: AsyncClient):
    """Test receiving external IoT Hub telematics payload via webhook adapter."""
    payload = {
        "deviceId": "NX-104",
        "latitude": 41.2565,
        "longitude": -95.9345,
        "speed": 65.0,
        "battery": 87
    }
    response = await async_client.post("/api/v1/telemetry/webhooks/AZURE_IOT", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "WEBHOOK_PROCESSED"
    assert data["provider"] in ["AZURE_IOT", "IOT_HUB"]

@pytest.mark.asyncio
async def test_azure_keyvault_manager_status(async_client: AsyncClient):
    """Test Azure Key Vault service status reported in health check."""
    response = await async_client.get("/health/azure")
    services = response.json()["services"]
    assert "keyVault" in services
    kv_info = services["keyVault"]
    assert "status" in kv_info
    assert "freeTierLimit" in kv_info

@pytest.mark.asyncio
async def test_azure_functions_tasks_scheduled(async_client: AsyncClient):
    """Test Azure Functions scheduled automation tasks listed in Azure health check."""
    response = await async_client.get("/health/azure")
    services = response.json()["services"]
    assert "functions" in services
    fn_info = services["functions"]
    assert "scheduledTasks" in fn_info
    tasks = fn_info["scheduledTasks"]
    assert len(tasks) >= 5
    task_names = [t.get("name") or t.get("task") for t in tasks]
    assert "daily_analytics_summary" in task_names
    assert "telemetry_cleanup" in task_names
