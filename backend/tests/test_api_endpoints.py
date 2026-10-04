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
    assert data["platform"] == "nexus-unified"

@pytest.mark.asyncio
async def test_api_v1_health_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "databaseConnected" in data or "database_connected" in data
