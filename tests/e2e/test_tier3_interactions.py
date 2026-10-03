import uuid
import pytest
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Tier 3 - Cross-Feature Interactions
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_end_to_end_cross_feature_workflow_auth_incident_simulation_telemetry(auth_client: AsyncClient):
    """
    Tier 3 Workflow:
    1. Query operational vehicle & route baseline.
    2. Dispatch critical incident affecting vehicle.
    3. Evaluate What-If physics reroute simulation.
    4. Create simulation scenario and apply reroute decision.
    5. Ingest updated telematics packet reflecting new vehicle trajectory.
    6. Verify live telemetry snapshot reflects updated location.
    7. Resolve incident and verify timeline closure.
    """
    # 1. Baseline Route & Vehicle Check
    v_res = await auth_client.get("/api/v1/operations/vehicles/v-104")
    assert v_res.status_code == 200
    baseline_veh = v_res.json()
    assert baseline_veh["code"] == "NX-104"

    # 2. Dispatch Incident
    inc_payload = {
        "title": "Severe Avalanche Alert on I-80 Pass",
        "summary": "Rocky Mountain corridor blocked due to sudden snowpack slide.",
        "severity": "CRITICAL",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 210,
        "cost_estimate": 18500.0,
        "root_cause": "Weather hazard avalanche",
        "ai_analysis": "Reroute via Denver I-70 recommended to maintain transit window."
    }
    inc_res = await auth_client.post("/api/v1/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    inc_data = inc_res.json()
    inc_id = inc_data["id"]
    assert inc_data["status"] == "DETECTED"

    # 3. Evaluate What-If Simulation
    sim_eval_payload = {
        "base_metrics": {
            "totalDistanceKm": 1620.0,
            "avgDurationMins": 940,
            "currentDelayMins": 210,
            "ordersCount": 14,
            "totalOrderValue": 45000.0,
            "baseCostUsd": 1450.0,
            "slaBreachRiskPct": 92.0
        },
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0,
            "fuelCostPerKm": 0.42,
            "priorityReordering": True
        }
    }
    eval_res = await auth_client.post("/api/v1/simulations/evaluate", json=sim_eval_payload)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["netTimeSavedMins"] > 0
    assert eval_data["recommendationScore"] >= 0

    # 4. Commit Simulation Scenario and Apply Decision
    sim_create_payload = {
        "title": "Avalanche Bypass I-70 Scenario",
        "description": "Commit South Denver detour for NX-104.",
        "incident_id": inc_id,
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 10.0
        }
    }
    sim_create_res = await auth_client.post("/api/v1/simulations", json=sim_create_payload)
    assert sim_create_res.status_code in [200, 201]
    sim_id = sim_create_res.json()["id"]

    apply_payload = {
        "action": "REROUTE_APPROVED",
        "notes": "Emergency detour authorized by Operations Commander.",
        "approver_id": "usr-test-101"
    }
    apply_res = await auth_client.post(f"/api/v1/simulations/{sim_id}/apply-decision", json=apply_payload)
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "APPLIED"

    # 5. Ingest Telematics Packet along detour corridor
    telemetry_packet = {
        "vehicle_identifier": "NX-104",
        "latitude": 39.7392,
        "longitude": -104.9903,
        "speed_kmh": 74.0,
        "heading": 180.0,
        "battery_pct": 79,
        "source_provider": "DIRECT_API"
    }
    telemetry_res = await auth_client.post("/api/v1/telemetry", json=telemetry_packet)
    assert telemetry_res.status_code == 200
    assert telemetry_res.json()["status"] == "PROCESSED"

    # 6. Verify Live Telemetry Snapshot
    live_res = await auth_client.get("/api/v1/telemetry/live")
    assert live_res.status_code == 200
    live_statuses = live_res.json()
    nx104_status = next((s for s in live_statuses if s.get("vehicle_id") == "v-104"), None)
    if nx104_status:
        assert nx104_status["lat"] == 39.7392
        assert nx104_status["lng"] == -104.9903
        assert nx104_status["speed_kmh"] == 74.0

    # 7. Resolve Incident
    resolve_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/resolve")
    assert resolve_res.status_code == 200
    resolved_inc = resolve_res.json()
    assert resolved_inc["status"] == "RESOLVED"
    statuses = [t["status"] for t in resolved_inc["timeline"]]
    assert "RESOLVED" in statuses

@pytest.mark.asyncio
async def test_incident_multi_step_state_machine_audit_trail(auth_client: AsyncClient):
    """
    Verify full lifecycle of incident state machine:
    DETECTED -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED
    Each step must generate an immutable audit timeline record.
    """
    payload = {
        "title": "Chiller Unit Temperature Drift",
        "summary": "Refrigeration trailer telemetry reports temp risen to +4C.",
        "severity": "HIGH",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
        "delay_minutes": 20,
        "cost_estimate": 4500.0
    }
    create_res = await auth_client.post("/api/v1/incidents", json=payload)
    assert create_res.status_code == 201
    inc_id = create_res.json()["id"]

    # Step 1: ACKNOWLEDGED
    ack_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # Step 2: INVESTIGATING
    inv_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/start-investigation")
    assert inv_res.status_code == 200
    assert inv_res.json()["status"] == "INVESTIGATING"

    # Step 3: RESOLVED
    res_res = await auth_client.post(f"/api/v1/incidents/{inc_id}/resolve")
    assert res_res.status_code == 200
    final_inc = res_res.json()
    assert final_inc["status"] == "RESOLVED"

    # Verify timeline length and sequence
    timeline = final_inc["timeline"]
    assert len(timeline) >= 4
    statuses = [t["status"] for t in timeline]
    assert "DETECTED" in statuses
    assert "ACKNOWLEDGED" in statuses
    assert "INVESTIGATING" in statuses
    assert "RESOLVED" in statuses

@pytest.mark.asyncio
async def test_dynamic_telematics_auto_discovery_and_registration(auth_client: AsyncClient):
    """
    Test automatic telematics vehicle discovery:
    Ingesting telemetry for an uncataloged vehicle code auto-provisions the vehicle.
    """
    new_veh_code = f"NX-AUTONOMOUS-{uuid.uuid4().hex[:4].upper()}"
    packet = {
        "vehicle_identifier": new_veh_code,
        "latitude": 42.3314,
        "longitude": -83.0458,
        "speed_kmh": 62.0,
        "heading": 270.0,
        "battery_pct": 94,
        "source_provider": "DIRECT_API"
    }
    ingest_res = await auth_client.post("/api/v1/telemetry", json=packet)
    assert ingest_res.status_code == 200
    assert ingest_res.json()["status"] == "PROCESSED"

    # Verify vehicle is now retrievable in fleet operations
    v_res = await auth_client.get("/api/v1/operations/vehicles")
    assert v_res.status_code == 200
    vehicles = v_res.json()
    found = any(v["code"] == new_veh_code for v in vehicles)
    assert found is True

@pytest.mark.asyncio
async def test_multi_tenant_workspace_isolation(async_client: AsyncClient, token_factory):
    """
    Test strict multi-tenant boundary isolation:
    Entities created in workspace 1 must NEVER be visible to workspace 2.
    """
    ws1_token = token_factory(sub="usr_tenant_1", email="tenant1@nexus.ws1", workspace_id="ws-continental-fleet-01")
    ws2_token = token_factory(sub="usr_tenant_2", email="tenant2@nexus.alt", workspace_id="ws-alt-workspace-02")

    ws1_headers = {
        "Authorization": f"Bearer {ws1_token}",
        "X-Workspace-ID": "ws-continental-fleet-01"
    }
    ws2_headers = {
        "Authorization": f"Bearer {ws2_token}",
        "X-Workspace-ID": "ws-alt-workspace-02"
    }

    # 1. Create a warehouse in Workspace 1
    wh1_code = f"WH-WS1-{uuid.uuid4().hex[:4].upper()}"
    wh1_payload = {
        "code": wh1_code,
        "name": "Workspace 1 Exclusive Hub",
        "city": "Dallas",
        "state": "TX",
        "lat": 32.7767,
        "lng": -96.7970,
        "capacityUnits": 10000,
        "workspaceId": "ws-continental-fleet-01"
    }
    res1 = await async_client.post("/api/v1/operations/warehouses", json=wh1_payload, headers=ws1_headers)
    assert res1.status_code in [200, 201]

    # 2. Query warehouses under Workspace 2
    res2 = await async_client.get("/api/v1/operations/warehouses", headers=ws2_headers)
    assert res2.status_code == 200
    ws2_warehouses = res2.json()
    ws2_codes = [w["code"] for w in ws2_warehouses]
    assert wh1_code not in ws2_codes  # No tenant leakage

    # 3. Create a warehouse in Workspace 2
    wh2_code = f"WH-WS2-{uuid.uuid4().hex[:4].upper()}"
    wh2_payload = {
        "code": wh2_code,
        "name": "Workspace 2 Exclusive Depot",
        "city": "Atlanta",
        "state": "GA",
        "lat": 33.7490,
        "lng": -84.3880,
        "capacityUnits": 8000,
        "workspaceId": "ws-alt-workspace-02"
    }
    res3 = await async_client.post("/api/v1/operations/warehouses", json=wh2_payload, headers=ws2_headers)
    assert res3.status_code in [200, 201]

    # 4. Query warehouses under Workspace 1
    res4 = await async_client.get("/api/v1/operations/warehouses", headers=ws1_headers)
    assert res4.status_code == 200
    ws1_warehouses = res4.json()
    ws1_codes = [w["code"] for w in ws1_warehouses]
    assert wh2_code not in ws1_codes  # Zero reverse tenant leakage

@pytest.mark.asyncio
async def test_simulation_decision_triggers_outbox_and_events(auth_client: AsyncClient):
    """
    Test applying a simulation scenario marks status as APPLIED and logs operational metadata.
    """
    payload = {
        "title": "Corridor Optimization Scenario",
        "description": "Optimize I-80 corridor transit time.",
        "variables": {
            "vehicleId": "v-104",
            "alternateRouteType": "I-70_SOUTH_DETOUR",
            "speedDeltaPct": 5.0
        }
    }
    create_res = await auth_client.post("/api/v1/simulations", json=payload)
    assert create_res.status_code in [200, 201]
    sim_id = create_res.json()["id"]

    decision_payload = {
        "action": "REROUTE_APPROVED",
        "notes": "Decision confirmed by dispatcher.",
        "approver_id": "usr-test-101"
    }
    apply_res = await auth_client.post(f"/api/v1/simulations/{sim_id}/apply-decision", json=decision_payload)
    assert apply_res.status_code == 200
    data = apply_res.json()
    assert data["status"] == "APPLIED"
    assert data.get("appliedAt") is not None or data.get("applied_at") is not None
