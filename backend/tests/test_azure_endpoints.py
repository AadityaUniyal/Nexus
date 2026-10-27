import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_azure_telemetry_status(async_client: AsyncClient):
    response = await async_client.get("/api/v1/admin/azure/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert "iotHub" in data["services"]
    assert "blobStorage" in data["services"]
    assert "applicationInsights" in data["services"]

@pytest.mark.asyncio
async def test_azure_maps_routing_endpoint(async_client: AsyncClient):
    response = await async_client.get(
        "/api/v1/admin/azure/maps/route",
        params={
            "origin_lat": 40.7128,
            "origin_lng": -74.0060,
            "dest_lat": 41.8781,
            "dest_lng": -87.6298,
            "vehicle_weight_kg": 36000.0,
            "vehicle_height_meters": 4.1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "commercial_clearance" in data or "data" in data

@pytest.mark.asyncio
async def test_azure_maps_isoline_endpoint(async_client: AsyncClient):
    response = await async_client.get(
        "/api/v1/admin/azure/maps/isoline",
        params={
            "current_lat": 37.7749,
            "current_lng": -122.4194,
            "battery_soc_percent": 80.0,
            "payload_weight_kg": 20000.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "effective_range_km" in data

@pytest.mark.asyncio
async def test_azure_vision_bol_ocr_endpoint(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/admin/azure/vision/bol-ocr",
        json={"image_base64": "mock_bol_scan_data"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "bol_number" in data
    assert "extracted_fields" in data

@pytest.mark.asyncio
async def test_azure_vision_cargo_damage_endpoint(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/admin/azure/vision/cargo-damage",
        json={"image_base64": "mock_dock_pallet_image"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "defect_metrics" in data
    assert "dock_gate_action" in data

@pytest.mark.asyncio
async def test_azure_pubsub_token_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/v1/admin/azure/pubsub/token")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "url" in data
    assert "nexus_telemetry_live" in data["url"] or data["hub"] == "nexus_telemetry_live"
