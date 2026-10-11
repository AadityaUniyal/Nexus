import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_live_endpoint(async_client: AsyncClient):
    response = await async_client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LIVE"
    assert "timestamp" in data

@pytest.mark.asyncio
async def test_health_ready_endpoint(async_client: AsyncClient):
    response = await async_client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["READY", "DEGRADED"]

@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "NEXUS" in data["name"]

@pytest.mark.asyncio
async def test_overview_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "totalVehicles" in data["stats"]

@pytest.mark.asyncio
async def test_incidents_list_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))

@pytest.mark.asyncio
async def test_simulations_list_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/simulations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))

@pytest.mark.asyncio
async def test_evaluate_simulation_endpoint(async_client: AsyncClient):
    payload = {
        "base_metrics": {
            "totalDistanceKm": 1620.0,
            "avgDurationMins": 940,
            "currentDelayMins": 180,
            "baseCostUsd": 1450.0,
            "ordersCount": 14
        },
        "variables": {
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 0.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": False
        }
    }
    response = await async_client.post("/api/v1/simulations/evaluate", json=payload)
    assert response.status_code in [200, 201]
    data = response.json()
    assert "totalDistanceKm" in data or "slaBreachRiskPct" in data or "verdict" in data

@pytest.mark.asyncio
async def test_ai_briefing_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/briefing")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)

@pytest.mark.asyncio
async def test_overview_stats_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/overview/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_orders" in data
    assert "active_vehicles" in data
    assert "warehouse_utilization" in data
    assert "on_time_delivery_rate" in data

@pytest.mark.asyncio
async def test_operations_summary_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/operations/summary")
    assert response.status_code == 200
    data = response.json()
    assert "warehouses" in data
    assert "vehicles" in data
    assert "routes" in data
    assert "orders" in data

@pytest.mark.asyncio
async def test_location_locations_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/location/locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "latitude" in data[0]
    assert "longitude" in data[0]

@pytest.mark.asyncio
async def test_health_azure_unified_endpoint(async_client: AsyncClient):
    response = await async_client.get("/health/azure")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["platform"] in ["nexus-unified", "Azure Free Tier"]

@pytest.mark.asyncio
async def test_api_v1_health_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "databaseConnected" in data or "database_connected" in data


@pytest.mark.asyncio
async def test_driver_manifest_and_status(async_client: AsyncClient):
    # Test driver manifest retrieval
    res_manifest = await async_client.get("/api/v1/driver/manifest?vehicle_code=NX-804")
    assert res_manifest.status_code == 200
    data = res_manifest.json()
    assert data["vehicle_code"] == "NX-804"
    assert "route_code" in data
    assert "cargo" in data
    assert len(data["stops"]) > 0

    # Test driver status update
    res_status = await async_client.post("/api/v1/driver/status", json={
        "vehicle_code": "NX-804",
        "status": "EN_ROUTE",
        "current_lat": 28.5355,
        "current_lng": 77.2612
    })
    assert res_status.status_code == 200
    assert res_status.json()["success"] is True


@pytest.mark.asyncio
async def test_driver_proof_of_delivery(async_client: AsyncClient):
    res_pod = await async_client.post("/api/v1/driver/pod", json={
        "vehicle_code": "NX-804",
        "recipient_name": "Arun Kumar (Hub Manager)",
        "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "notes": "Delivered to Dock 4, seal verified intact."
    })
    assert res_pod.status_code == 200
    pod_data = res_pod.json()
    assert pod_data["success"] is True
    assert pod_data["status"] == "DELIVERED"
    assert "pod_id" in pod_data


@pytest.mark.asyncio
async def test_admin_roles_endpoint(async_client: AsyncClient):
    res = await async_client.get("/api/v1/admin/roles")
    assert res.status_code == 200
    data = res.json()
    assert "roles" in data
    assert "permissions" in data
    assert len(data["roles"]) >= 5


@pytest.mark.asyncio
async def test_notification_rules_and_toggle(async_client: AsyncClient):
    res_rules = await async_client.get("/api/v1/notifications/rules")
    assert res_rules.status_code == 200
    rules = res_rules.json()
    assert len(rules) >= 3

    # Toggle first rule
    rule_id = rules[0]["id"]
    res_toggle = await async_client.patch(f"/api/v1/notifications/rules/{rule_id}/toggle")
    assert res_toggle.status_code == 200
    assert res_toggle.json()["success"] is True


@pytest.mark.asyncio
async def test_download_executive_pdf(async_client: AsyncClient):
    res_pdf = await async_client.get("/api/v1/reports/board-briefing.pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers.get("content-type", "")
    assert len(res_pdf.content) > 1000  # Valid binary PDF stream
    assert res_pdf.content.startswith(b"%PDF")

