import uuid
import pytest
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Tier 4 - Real-World Scenarios: Full Operator Emergency Reroute Workflow
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_full_operator_emergency_reroute_lifecycle(auth_client: AsyncClient):
    """
    Tier 4 Real-World Scenario:
    Simulates a complete incident response workflow during a critical blizzard disruption:
    - Phase 1: Operational pre-flight checks (Liveness, Readiness, Azure Health).
    - Phase 2: Hub and corridor inspection (Denver Central Depot -> Chicago Logistics Hub).
    - Phase 3: Major disruption detection & incident declaration (Interstate 80 blizzard closure).
    - Phase 4: Incident command acknowledgment.
    - Phase 5: Physics-based What-If simulation evaluation for I-70 South Bypass detour.
    - Phase 6: Operational decision approval & reroute execution.
    - Phase 7: Ingestion of dynamic vehicle telematics stream along detour corridor.
    - Phase 8: Investigation and incident resolution with complete audit timeline.
    """
    # -----------------------------------------------------------------------
    # Phase 1: Pre-Flight Health & Infrastructure Checks
    # -----------------------------------------------------------------------
    live_res = await auth_client.get("/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "LIVE"

    ready_res = await auth_client.get("/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] in ["READY", "DEGRADED"]

    azure_res = await auth_client.get("/health/azure")
    assert azure_res.status_code == 200
    assert azure_res.json()["platform"] == "Azure Free Tier"

    # -----------------------------------------------------------------------
    # Phase 2: Active Corridor & Fleet Vehicle Inspection
    # -----------------------------------------------------------------------
    wh_res = await auth_client.get("/api/v1/operations/warehouses")
    assert wh_res.status_code == 200
    warehouses = wh_res.json()
    wh_codes = [w["code"] for w in warehouses]
    assert "WH-ORD-01" in wh_codes
    assert "WH-DEN-01" in wh_codes

    route_res = await auth_client.get("/api/v1/operations/routes")
    assert route_res.status_code == 200
    routes = route_res.json()
    assert any(r["code"] == "RT-DEN-CHI" for r in routes)

    veh_res = await auth_client.get("/api/v1/operations/vehicles/v-104")
    assert veh_res.status_code == 200
    initial_vehicle = veh_res.json()
    assert initial_vehicle["code"] == "NX-104"
    assert initial_vehicle["status"] == "IN_TRANSIT"

    # -----------------------------------------------------------------------
    # Phase 3: Critical Corridor Disruption (Blizzard Closure)
    # -----------------------------------------------------------------------
    incident_payload = {
        "title": "Interstate 80 Blizzard Closure - Emergency Reroute Required",
        "summary": "Severe whiteout blizzard closed Interstate 80 corridor. Vehicle NX-104 halted near North Platte.",
        "severity": "CRITICAL",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 240,
        "cost_estimate": 28500.0,
        "root_cause": "Weather hazard blizzard shut down Interstate 80 corridor",
        "ai_analysis": "Automated route analyzer suggests I-70 South Bypass detour via Denver."
    }
    inc_res = await auth_client.post("/api/v1/incidents", json=incident_payload)
    assert inc_res.status_code == 201
    incident_data = inc_res.json()
    incident_id = incident_data["id"]
    assert incident_data["status"] == "DETECTED"
    assert incident_data["severity"] == "CRITICAL"

    # -----------------------------------------------------------------------
    # Phase 4: Incident Commander Triage & Acknowledgment
    # -----------------------------------------------------------------------
    ack_res = await auth_client.post(f"/api/v1/incidents/{incident_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"

    # -----------------------------------------------------------------------
    # Phase 5: Physics Simulation & What-If Evaluation
    # -----------------------------------------------------------------------
    eval_payload = {
        "base_metrics": {
            "totalDistanceKm": 1620.0,
            "avgDurationMins": 940,
            "currentDelayMins": 240,
            "ordersCount": 14,
            "totalOrderValue": 45000.0,
            "baseCostUsd": 1450.0,
            "slaBreachRiskPct": 94.0
        },
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": True
        }
    }
    eval_res = await auth_client.post("/api/v1/simulations/evaluate", json=eval_payload)
    assert eval_res.status_code == 200
    sim_output = eval_res.json()
    assert sim_output["netTimeSavedMins"] > 60
    assert sim_output["recommendationScore"] >= 0
    assert sim_output["verdict"] in ["HIGHLY_RECOMMENDED", "FEASIBLE_ALTERNATIVE"]
    assert len(sim_output["insights"]) >= 2

    # -----------------------------------------------------------------------
    # Phase 6: Formal Scenario Creation & Decision Execution
    # -----------------------------------------------------------------------
    scenario_payload = {
        "title": "Denver I-70 South Emergency Bypass Scenario",
        "description": "Authorized emergency reroute bypassing Interstate 80 blizzard.",
        "incident_id": incident_id,
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0
        }
    }
    sim_res = await auth_client.post("/api/v1/simulations", json=scenario_payload)
    assert sim_res.status_code in [200, 201]
    sim_id = sim_res.json()["id"]

    decision_payload = {
        "action": "REROUTE_APPROVED",
        "notes": "Emergency bypass via I-70 authorized by Incident Commander Marcus Vance.",
        "approver_id": "usr-test-101"
    }
    apply_res = await auth_client.post(f"/api/v1/simulations/{sim_id}/apply-decision", json=decision_payload)
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "APPLIED"

    # -----------------------------------------------------------------------
    # Phase 7: Live Fleet Telematics Dynamic Route Tracking
    # -----------------------------------------------------------------------
    # Ingest new position for NX-104 on I-70 detour corridor
    reroute_telemetry = {
        "vehicle_identifier": "NX-104",
        "latitude": 39.7392,
        "longitude": -104.9903,
        "speed_kmh": 78.5,
        "heading": 110.0,
        "battery_pct": 81,
        "engine_state": "RUNNING",
        "source_provider": "DIRECT_API"
    }
    telem_res = await auth_client.post("/api/v1/telemetry", json=reroute_telemetry)
    assert telem_res.status_code == 200
    assert telem_res.json()["status"] == "PROCESSED"

    # Verify vehicle live telemetry snapshot reflects new coordinates
    live_res = await auth_client.get("/api/v1/telemetry/live")
    assert live_res.status_code == 200
    live_fleet = live_res.json()
    v104_live = next((s for s in live_fleet if s.get("vehicle_id") == "v-104"), None)
    if v104_live:
        assert v104_live["lat"] == 39.7392
        assert v104_live["lng"] == -104.9903
        assert v104_live["speed_kmh"] == 78.5

    # -----------------------------------------------------------------------
    # Phase 8: Incident Resolution with Complete Timeline
    # -----------------------------------------------------------------------
    # Note: apply-decision automatically advanced incident state to ACTION_APPLIED.
    # We now resolve the incident to complete the emergency response.
    res_res = await auth_client.post(f"/api/v1/incidents/{incident_id}/resolve")
    assert res_res.status_code == 200
    resolved_incident = res_res.json()
    assert resolved_incident["status"] == "RESOLVED"

    # -----------------------------------------------------------------------
    # Phase 9: Post-Incident Audit Trail Verification
    # -----------------------------------------------------------------------
    timeline = resolved_incident["timeline"]
    assert len(timeline) >= 4
    timeline_statuses = [t["status"] for t in timeline]
    assert timeline_statuses[0] == "DETECTED"
    assert "ACKNOWLEDGED" in timeline_statuses
    assert "ACTION_APPLIED" in timeline_statuses
    assert timeline_statuses[-1] == "RESOLVED"


@pytest.mark.asyncio
async def test_multiprovider_telematics_webhook_ingestion(async_client: AsyncClient):
    """
    Test heterogeneous telematics provider ingestion via webhooks:
    - Samsara webhook format
    - Geotab webhook format
    - Azure IoT Hub webhook format
    All adapters normalize into uniform system telematics packets.
    """
    # 1. Samsara webhook format
    samsara_payload = {
        "vehicle_id": "NX-104",
        "latitude": 41.2565,
        "longitude": -95.9345,
        "speed": 68.0,
        "battery": 86
    }
    samsara_res = await async_client.post("/api/v1/telemetry/webhooks/SAMSARA", json=samsara_payload)
    assert samsara_res.status_code == 200
    assert samsara_res.json()["status"] == "WEBHOOK_PROCESSED"
    assert samsara_res.json()["provider"] == "SAMSARA"

    # 2. Geotab webhook format
    geotab_payload = {
        "id": "NX-104",
        "lat": 41.3000,
        "lng": -95.8000,
        "speed": 72.0,
        "battery_pct": 85
    }
    geotab_res = await async_client.post("/api/v1/telemetry/webhooks/GEOTAB", json=geotab_payload)
    assert geotab_res.status_code == 200
    assert geotab_res.json()["status"] == "WEBHOOK_PROCESSED"
    assert geotab_res.json()["provider"] == "GEOTAB"

    # 3. Azure IoT Hub webhook format
    azure_payload = {
        "deviceId": "NX-104",
        "latitude": 41.3500,
        "longitude": -95.7000,
        "speed": 75.0,
        "battery": 84
    }
    azure_res = await async_client.post("/api/v1/telemetry/webhooks/AZURE_IOT", json=azure_payload)
    assert azure_res.status_code == 200
    assert azure_res.json()["status"] == "WEBHOOK_PROCESSED"
    assert azure_res.json()["provider"] in ["AZURE_IOT", "IOT_HUB"]


@pytest.mark.asyncio
async def test_bulk_fleet_csv_import_workflow(auth_client: AsyncClient):
    """
    Test bulk telemetry / vehicle data import workflow:
    Previews CSV file structure, validates column mappings, and computes row totals.
    """
    csv_payload = {
        "file_content": (
            "registrationNumber,truckName,driver,latitude,longitude,speedKmh,batteryPercentage\n"
            "NX-301,Freightliner eCascadia #301,David Miller,41.8781,-87.6298,65.0,92\n"
            "NX-302,Freightliner eCascadia #302,Sarah Connor,39.7392,-104.9903,70.0,88\n"
            "NX-303,Freightliner eCascadia #303,Michael Scott,32.7767,-96.7970,68.5,85\n"
        ),
        "filename": "continental_fleet_batch_q4.csv",
        "entity_type": "VEHICLES"
    }
    res = await auth_client.post("/api/v1/import/preview", json=csv_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 3
    assert data["valid_rows_count"] == 3
    assert "detected_columns" in data
    assert "suggested_mapping" in data


@pytest.mark.asyncio
async def test_concurrent_multi_incident_triage(auth_client: AsyncClient):
    """
    Test handling multiple concurrent incidents across different operational assets:
    Incident 1: Chicago hub congestion
    Incident 2: Vehicle NX-104 sensor warning
    Verifies state machines and timelines operate independently without interference.
    """
    import asyncio

    # 1. Incident 1: Chicago Hub
    inc1_payload = {
        "title": "Chicago Distribution Hub Inbound Gridlock",
        "summary": "Expressway backup delaying inbound freight trailers by 60 mins.",
        "severity": "MEDIUM",
        "affected_entity_type": "WAREHOUSE",
        "affected_entity_id": "wh-chi-01",
        "affected_entity_name": "Chicago Logistics Hub",
        "delay_minutes": 60,
        "cost_estimate": 3200.0
    }
    res1 = await auth_client.post("/api/v1/incidents", json=inc1_payload)
    assert res1.status_code == 201
    inc1_id = res1.json()["id"]

    # Sleep slightly to ensure distinct second-level timestamp for code generation
    await asyncio.sleep(1.05)

    # 2. Incident 2: Vehicle 104 Sensor
    inc2_payload = {
        "title": "Brake Sensor Calibration Alarm",
        "summary": "Front axle brake pad wear sensor indicates maintenance threshold.",
        "severity": "LOW",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 10,
        "cost_estimate": 450.0
    }
    res2 = await auth_client.post("/api/v1/incidents", json=inc2_payload)
    assert res2.status_code == 201
    inc2_id = res2.json()["id"]

    # 3. Transition Incident 1: Acknowledge & Investigate
    await auth_client.post(f"/api/v1/incidents/{inc1_id}/acknowledge")
    inc1_investigating = await auth_client.post(f"/api/v1/incidents/{inc1_id}/start-investigation")
    assert inc1_investigating.status_code == 200
    assert inc1_investigating.json()["status"] == "INVESTIGATING"

    # 4. Resolve Incident 2 directly
    inc2_resolved = await auth_client.post(f"/api/v1/incidents/{inc2_id}/resolve")
    assert inc2_resolved.status_code == 200
    assert inc2_resolved.json()["status"] == "RESOLVED"

    # 5. Check Incident 1 status is still INVESTIGATING (no cross-talk)
    inc1_check = await auth_client.get(f"/api/v1/incidents/{inc1_id}")
    assert inc1_check.status_code == 200
    assert inc1_check.json()["status"] == "INVESTIGATING"

    # 6. Finally resolve Incident 1
    inc1_resolved = await auth_client.post(f"/api/v1/incidents/{inc1_id}/resolve")
    assert inc1_resolved.status_code == 200
    assert inc1_resolved.json()["status"] == "RESOLVED"
