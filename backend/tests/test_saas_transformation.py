import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_organization_endpoints(async_client: AsyncClient):
    # Test GET /api/v1/organizations/me
    res = await async_client.get("/api/v1/organizations/me")
    assert res.status_code in [200, 404]

    # Test GET /api/v1/organizations/workspaces
    ws_res = await async_client.get("/api/v1/organizations/workspaces")
    assert ws_res.status_code == 200
    assert isinstance(ws_res.json(), list)

    # Test POST /api/v1/organizations/invite
    inv_res = await async_client.post("/api/v1/organizations/invite", json={
        "email": "dispatcher@logistics-corp.com",
        "role": "DISPATCHER"
    })
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert inv_data["status"] == "INVITATION_SENT"
    assert inv_data["role"] == "DISPATCHER"
    assert "inviteToken" in inv_data

@pytest.mark.asyncio
async def test_data_import_preview_csv(async_client: AsyncClient):
    csv_sample = """registrationNumber,truckName,driver,latitude,longitude,speedKmh,batteryPercentage
NX-201,Freightliner eCascadia #201,John Doe,41.8781,-87.6298,68.5,88
NX-202,Freightliner eCascadia #202,Jane Smith,39.7392,-104.9903,72.0,94
"""
    res = await async_client.post("/api/v1/import/preview", json={
        "file_content": csv_sample,
        "filename": "fleet_import.csv",
        "entity_type": "VEHICLES"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 2
    assert data["valid_rows_count"] == 2
    assert "detected_columns" in data
    assert "suggested_mapping" in data

@pytest.mark.asyncio
async def test_telemetry_normalized_ingestion(async_client: AsyncClient):
    packet = {
        "vehicle_identifier": "NX-104",
        "latitude": 41.2565,
        "longitude": -95.9345,
        "speed_kmh": 68.0,
        "heading": 90.0,
        "battery_pct": 78,
        "engine_state": "RUNNING",
        "source_provider": "DIRECT_API"
    }
    res = await async_client.post("/api/v1/telemetry", json=packet)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROCESSED"
    assert data["vehicle_id"] is not None

@pytest.mark.asyncio
async def test_telemetry_provider_webhooks(async_client: AsyncClient):
    # Test Samsara telematics webhook
    samsara_payload = {
        "vehicleId": "NX-SAMSARA-01",
        "location": {
            "coords": {
                "latitude": 41.8781,
                "longitude": -87.6298
            }
        },
        "speedMilesPerHour": 55.0,
        "fuelPercent": 82
    }
    res = await async_client.post("/api/v1/telemetry/webhooks/samsara", json=samsara_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "WEBHOOK_PROCESSED"
    assert data["provider"] == "SAMSARA"

@pytest.mark.asyncio
async def test_copilot_chat_and_controlled_tools(async_client: AsyncClient):
    # 1. Fleet summary inquiry
    res = await async_client.post("/api/v1/copilot/chat", json={
        "prompt": "Give me a summary of fleet status and active incidents."
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["tool_calls"]) > 0
    assert data["tool_calls"][0]["tool"] == "get_fleet_summary"

    # 2. Simulation and approval request inquiry
    res_sim = await async_client.post("/api/v1/copilot/chat", json={
        "prompt": "Simulate route options for vehicle NX-104 to bypass weather."
    })
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert "simulation_result" in sim_data or "approval_card" in sim_data
    assert sim_data["approval_card"] is not None
    assert sim_data["approval_card"]["status"] == "PENDING_APPROVAL"

@pytest.mark.asyncio
async def test_governance_approvals_and_audit(async_client: AsyncClient):
    # List approvals
    res = await async_client.get("/api/v1/governance/approvals")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # List audit history
    audit_res = await async_client.get("/api/v1/governance/audit")
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)
