"""
Adversarial Verification Suite for Milestone 2:
Real-Time SSE Event Pipeline, Multi-Tenant Scoping,
Dock Geofencing & Dwell Detection, and Simulation Decision Application.
"""

import os
from pathlib import Path
import re
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Models & Services
from app.db.base import Base
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.logistics import Trip
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.models.incidents import Incident, IncidentTimeline
from app.models.simulations import Simulation, Decision
from app.models.system import OperationalEvent, EventOutbox
from app.realtime.sse import EventBroadcaster
from app.services.telemetry_service import ingest_telemetry_packet, NormalizedTelemetryPacket
from app.services.detention_service import DetentionService
from app.schemas.simulations import SimulationApplyDecision
from app.api.v1.endpoints.simulations import apply_simulation_decision
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP
from app.core.errors import EntityNotFoundException

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

def read_frontend_file(rel_path: str) -> str:
    path = os.path.join(FRONTEND_DIR, rel_path)
    assert os.path.isfile(path), f"File not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ============================================================================
# 1. EventBroadcaster Multi-Tenant Isolation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_event_broadcaster_tenant_isolation():
    """
    Adversarial verification of EventBroadcaster tenant scoping:
    1. Subscribers to ws-alpha must NEVER receive events broadcast to ws-beta.
    2. Subscribers to ws-beta must NEVER receive events broadcast to ws-alpha.
    3. Global subscribers (None) must receive events from all tenants.
    4. Fallback payload routing (workspace_id / workspaceId inside data) works as expected.
    """
    broadcaster = EventBroadcaster()

    received_alpha: List[Dict[str, Any]] = []
    received_beta: List[Dict[str, Any]] = []
    received_global: List[Dict[str, Any]] = []

    stop_event = asyncio.Event()

    async def consume(ws_id: Optional[str], target_list: List[Dict[str, Any]]):
        async for raw_msg in broadcaster.subscribe(workspace_id=ws_id):
            if raw_msg.startswith("data: "):
                payload = json.loads(raw_msg[6:].strip())
                if payload.get("type") != "CONNECTION_ESTABLISHED":
                    target_list.append(payload)
            if stop_event.is_set():
                break

    task_alpha = asyncio.create_task(consume("ws-alpha", received_alpha))
    task_beta = asyncio.create_task(consume("ws-beta", received_beta))
    task_global = asyncio.create_task(consume(None, received_global))

    # Give tasks a moment to register subscriber queues
    await asyncio.sleep(0.05)

    # 1. Broadcast specifically to ws-alpha
    await broadcaster.broadcast("ALPHA_ALERT", {"msg": "For alpha eyes only"}, workspace_id="ws-alpha")
    await asyncio.sleep(0.05)

    assert len(received_alpha) == 1
    assert received_alpha[0]["type"] == "ALPHA_ALERT"
    assert len(received_beta) == 0, "Security Violation: ws-beta received an event destined for ws-alpha!"
    assert len(received_global) == 1

    # 2. Broadcast specifically to ws-beta
    await broadcaster.broadcast("BETA_ALERT", {"msg": "For beta eyes only"}, workspace_id="ws-beta")
    await asyncio.sleep(0.05)

    assert len(received_alpha) == 1, "Security Violation: ws-alpha received an event destined for ws-beta!"
    assert len(received_beta) == 1
    assert received_beta[0]["type"] == "BETA_ALERT"
    assert len(received_global) == 2

    # 3. Broadcast globally (no workspace_id)
    await broadcaster.broadcast("SYSTEM_MAINTENANCE", {"msg": "All tenants notice"}, workspace_id=None)
    await asyncio.sleep(0.05)

    assert len(received_alpha) == 2
    assert len(received_beta) == 2
    assert len(received_global) == 3

    # 4. Fallback: workspace_id embedded in payload
    await broadcaster.broadcast("EMBEDDED_ALPHA", {"workspace_id": "ws-alpha", "secret": 42})
    await asyncio.sleep(0.05)
    assert len(received_alpha) == 3
    assert len(received_beta) == 2, "Security Violation: ws-beta received embedded alpha event!"

    # 5. Fallback: workspaceId camelCase in payload
    await broadcaster.broadcast("EMBEDDED_BETA", {"workspaceId": "ws-beta", "secret": 99})
    await asyncio.sleep(0.05)
    assert len(received_alpha) == 3, "Security Violation: ws-alpha received embedded beta event!"
    assert len(received_beta) == 3

    # Clean up consumers
    stop_event.set()
    task_alpha.cancel()
    task_beta.cancel()
    task_global.cancel()
    await asyncio.gather(task_alpha, task_beta, task_global, return_exceptions=True)


@pytest.mark.asyncio
async def test_event_broadcaster_lifecycle_and_cleanup():
    """Verify that subscriber disconnection cleans up internal subscriber mappings without leaks."""
    broadcaster = EventBroadcaster()
    ws_id = "ws-cleanup-test"

    assert ws_id not in broadcaster._subscribers

    gen = broadcaster.subscribe(workspace_id=ws_id)
    first_msg = await gen.asend(None)
    assert "CONNECTION_ESTABLISHED" in first_msg
    assert ws_id in broadcaster._subscribers
    assert len(broadcaster._subscribers[ws_id]) == 1

    # Close the generator
    await gen.aclose()
    assert ws_id not in broadcaster._subscribers, "Memory leak: disconnected subscriber workspace not purged"

    # Broadcasting to empty workspace should be a safe no-op
    await broadcaster.broadcast("GHOST_EVENT", {"data": 123}, workspace_id="ws-ghost")


@pytest.mark.asyncio
async def test_event_broadcaster_concurrency_stress():
    """Stress-test EventBroadcaster under high-volume concurrent delivery across tenants."""
    broadcaster = EventBroadcaster()
    ws_a = "ws-concurrency-a"
    ws_b = "ws-concurrency-b"

    sub_counts_a = [0] * 5
    sub_counts_b = [0] * 5
    stop_event = asyncio.Event()

    async def worker(ws: str, idx: int, counts: List[int]):
        async for raw_msg in broadcaster.subscribe(workspace_id=ws):
            if raw_msg.startswith("data: "):
                payload = json.loads(raw_msg[6:].strip())
                if payload.get("type") == "BURST_EVENT":
                    counts[idx] += 1
            if stop_event.is_set():
                break

    tasks = []
    for i in range(5):
        tasks.append(asyncio.create_task(worker(ws_a, i, sub_counts_a)))
        tasks.append(asyncio.create_task(worker(ws_b, i, sub_counts_b)))

    await asyncio.sleep(0.05)

    # Fire 40 events to ws_a and 20 events to ws_b
    burst_tasks = []
    for _ in range(40):
        burst_tasks.append(broadcaster.broadcast("BURST_EVENT", {"n": _}, workspace_id=ws_a))
    for _ in range(20):
        burst_tasks.append(broadcaster.broadcast("BURST_EVENT", {"n": _}, workspace_id=ws_b))

    await asyncio.gather(*burst_tasks)
    await asyncio.sleep(0.1)

    stop_event.set()
    for t in tasks:
        t.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)

    # Every subscriber in ws_a must have received exactly 40 events
    for i in range(5):
        assert sub_counts_a[i] == 40, f"Subscriber {i} in ws_a received {sub_counts_a[i]} events, expected 40"

    # Every subscriber in ws_b must have received exactly 20 events
    for i in range(5):
        assert sub_counts_b[i] == 20, f"Subscriber {i} in ws_b received {sub_counts_b[i]} events, expected 20"


# ============================================================================
# 2. Database Fixtures for Telemetry & Simulations
# ============================================================================

@pytest.fixture
async def async_db():
    """Provides an isolated in-memory SQLite database session with complete schema."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()


# ============================================================================
# 3. Dock Geofence & Dwell Pipeline Tests
# ============================================================================

@pytest.mark.asyncio
async def test_dock_geofence_arrival_detection(async_db: AsyncSession, monkeypatch):
    """
    Test that when a vehicle enters the destination warehouse's 500m geofence:
    1. Trip status updates to ARRIVED.
    2. Trip actual_arrival timestamp is recorded.
    3. DOCK_ARRIVAL_DETECTED event is broadcast with workspace_id scoping.
    4. Vehicle further than 500m does NOT trigger arrival.
    """
    ws = "ws-dock-test-01"
    dock_lat, dock_lng = 19.0760, 72.8777

    # 1. Seed Warehouse
    wh = Warehouse(
        id="wh-mumbai-01",
        code="WH-MUM",
        name="Mumbai Gateway Hub",
        city="Mumbai",
        state="Maharashtra",
        lat=dock_lat,
        lng=dock_lng,
        workspace_id=ws,
    )
    async_db.add(wh)

    # 2. Seed Vehicle
    veh = Vehicle(
        id="veh-nx-501",
        code="NX-501",
        name="Nexus Freightliner 501",
        model="Freightliner Cascadia",
        driver_name="Rajesh Kumar",
        status="IN_TRANSIT",
        current_lat=19.1500,
        current_lng=72.8777,
        workspace_id=ws,
    )
    async_db.add(veh)

    # 3. Seed Trip
    trip = Trip(
        id="trip-101",
        trip_number="TRIP-2026-101",
        vehicle_id=veh.id,
        origin_warehouse_id=wh.id,
        dest_warehouse_id=wh.id,
        status="IN_TRANSIT",
        scheduled_departure="2026-10-20T08:00:00Z",
        scheduled_arrival="2026-10-20T12:00:00Z",
        actual_arrival=None,
        workspace_id=ws,
    )
    async_db.add(trip)
    await async_db.commit()

    broadcasted_events = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasted_events.append((event_type, payload, workspace_id))

    from app.realtime import sse
    monkeypatch.setattr(sse.broadcaster, "broadcast", mock_broadcast)

    # --- Scenario A: Vehicle is 5 km away (outside 500m geofence) ---
    packet_far = NormalizedTelemetryPacket(
        vehicle_identifier="NX-501",
        latitude=19.1200,
        longitude=72.8777,
        speed_kmh=45.0,
    )
    res_far = await ingest_telemetry_packet(async_db, packet_far, workspace_id=ws)
    assert res_far["status"] == "PROCESSED"

    # Verify no arrival detected
    await async_db.refresh(trip)
    assert trip.actual_arrival is None
    assert trip.status == "IN_TRANSIT"
    dock_event_types = [e[0] for e in broadcasted_events]
    assert "DOCK_ARRIVAL_DETECTED" not in dock_event_types

    # --- Scenario B: Vehicle enters 100m from dock (within 500m geofence) ---
    packet_near = NormalizedTelemetryPacket(
        vehicle_identifier="NX-501",
        latitude=19.0765, # ~55 meters away
        longitude=72.8777,
        speed_kmh=5.0,
    )
    res_near = await ingest_telemetry_packet(async_db, packet_near, workspace_id=ws)
    assert res_near["status"] == "PROCESSED"

    # Verify arrival detected
    await async_db.refresh(trip)
    assert trip.actual_arrival is not None
    assert trip.status == "ARRIVED"

    dock_arrivals = [e for e in broadcasted_events if e[0] == "DOCK_ARRIVAL_DETECTED"]
    assert len(dock_arrivals) == 1
    event_type, payload, event_ws = dock_arrivals[0]
    assert event_ws == ws, "Security Violation: DOCK_ARRIVAL_DETECTED missing workspace_id scoping!"
    assert payload["trip_id"] == trip.id
    assert payload["warehouse_id"] == wh.id
    assert payload["wait_minutes"] == 0
    assert payload["detention_status"] == "FREE_WINDOW"
    assert payload["distance_meters"] <= 500.0


@pytest.mark.asyncio
async def test_dock_dwell_warning_and_detention_accruing(async_db: AsyncSession, monkeypatch):
    """
    Test progressive dock dwell state transitions:
    - Under 90m: no dwell alerts emitted.
    - 91m to 120m: DOCK_DWELL_WARNING emitted.
    - Exceeding 120m: DETENTION_ACCRUING emitted with accrued fee calculated.
    """
    ws = "ws-dwell-test-02"
    dock_lat, dock_lng = 19.0760, 72.8777

    wh = Warehouse(
        id="wh-dwell-hub",
        code="WH-DWELL",
        name="Pune Logistics Terminal",
        city="Pune",
        state="Maharashtra",
        lat=dock_lat,
        lng=dock_lng,
        workspace_id=ws,
    )
    veh = Vehicle(
        id="veh-nx-999",
        code="NX-999",
        name="Carrier Heavy 999",
        model="Volvo FH16",
        driver_name="Sunil Patil",
        status="ARRIVED",
        current_lat=dock_lat,
        current_lng=dock_lng,
        workspace_id=ws,
    )
    async_db.add_all([wh, veh])
    await async_db.commit()

    # --- Case 1: 45 minutes elapsed (well within 120m free window, below 90m warning) ---
    arrival_45m = (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()
    trip_45 = Trip(
        id="trip-45",
        trip_number="TRIP-45",
        vehicle_id=veh.id,
        origin_warehouse_id=wh.id,
        dest_warehouse_id=wh.id,
        status="ARRIVED",
        scheduled_departure="2026-10-20T08:00:00Z",
        scheduled_arrival="2026-10-20T10:00:00Z",
        actual_arrival=arrival_45m,
        workspace_id=ws,
    )
    async_db.add(trip_45)
    await async_db.commit()

    broadcasted_events = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasted_events.append((event_type, payload, workspace_id))

    from app.realtime import sse
    monkeypatch.setattr(sse.broadcaster, "broadcast", mock_broadcast)

    packet = NormalizedTelemetryPacket(
        vehicle_identifier="NX-999",
        latitude=dock_lat,
        longitude=dock_lng,
        speed_kmh=0.0,
    )
    await ingest_telemetry_packet(async_db, packet, workspace_id=ws)
    emitted = [e[0] for e in broadcasted_events]
    assert "DOCK_DWELL_WARNING" not in emitted
    assert "DETENTION_ACCRUING" not in emitted

    # --- Case 2: 95 minutes elapsed (exceeds 90m warning threshold, <= 120m) ---
    broadcasted_events.clear()
    trip_45.actual_arrival = (datetime.now(timezone.utc) - timedelta(minutes=95)).isoformat()
    await async_db.commit()

    await ingest_telemetry_packet(async_db, packet, workspace_id=ws)
    dwell_warnings = [e for e in broadcasted_events if e[0] == "DOCK_DWELL_WARNING"]
    assert len(dwell_warnings) == 1, "Expected DOCK_DWELL_WARNING after 95 minutes of dock dwell"
    _, warn_payload, warn_ws = dwell_warnings[0]
    assert warn_ws == ws
    assert warn_payload["wait_minutes"] >= 95
    assert warn_payload["remaining_free_minutes"] <= 25
    assert warn_payload["status"] == "DWELL_WARNING"
    assert "DETENTION_ACCRUING" not in [e[0] for e in broadcasted_events]

    # --- Case 3: 150 minutes elapsed (exceeds 120m free window -> billable detention) ---
    broadcasted_events.clear()
    trip_45.actual_arrival = (datetime.now(timezone.utc) - timedelta(minutes=150)).isoformat()
    await async_db.commit()

    await ingest_telemetry_packet(async_db, packet, workspace_id=ws)
    detention_accruals = [e for e in broadcasted_events if e[0] == "DETENTION_ACCRUING"]
    assert len(detention_accruals) == 1, "Expected DETENTION_ACCRUING after 150 minutes of dock dwell"
    _, det_payload, det_ws = detention_accruals[0]
    assert det_ws == ws
    assert det_payload["wait_minutes"] >= 150
    assert det_payload["detention_minutes"] >= 30
    assert det_payload["hourly_rate_inr"] == 500.0
    # 30 mins billable at ₹500/hr = ₹250.0
    assert det_payload["estimated_charge_inr"] == 250.0
    assert det_payload["status"] == "DETENTION_ACCRUING"
    assert "DOCK_DWELL_WARNING" not in [e[0] for e in broadcasted_events]


@pytest.mark.asyncio
async def test_dock_geofence_cross_tenant_isolation(async_db: AsyncSession, monkeypatch):
    """Verify that a vehicle in Tenant A cannot trigger dock arrival at Tenant B's warehouse."""
    ws_a = "ws-tenant-alpha"
    ws_b = "ws-tenant-bravo"
    dock_lat, dock_lng = 19.0760, 72.8777

    # Warehouse belongs to Tenant A
    wh_a = Warehouse(
        id="wh-tenant-a",
        code="WH-A",
        name="Alpha Port",
        city="Mumbai",
        state="Maharashtra",
        lat=dock_lat,
        lng=dock_lng,
        workspace_id=ws_a,
    )
    # Vehicle and Trip belong to Tenant B
    veh_b = Vehicle(
        id="veh-tenant-b",
        code="NX-BRAVO",
        name="Bravo Freight",
        model="Tata Prima",
        driver_name="Vikram Singh",
        status="IN_TRANSIT",
        current_lat=dock_lat,
        current_lng=dock_lng,
        workspace_id=ws_b,
    )
    trip_b = Trip(
        id="trip-b",
        trip_number="TRIP-B-001",
        vehicle_id=veh_b.id,
        origin_warehouse_id=wh_a.id,
        dest_warehouse_id=wh_a.id,  # Pointed at wh_a
        status="IN_TRANSIT",
        scheduled_departure="2026-10-20T08:00:00Z",
        scheduled_arrival="2026-10-20T10:00:00Z",
        actual_arrival=None,
        workspace_id=ws_b,
    )
    async_db.add_all([wh_a, veh_b, trip_b])
    await async_db.commit()

    broadcasted = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasted.append((event_type, payload, workspace_id))

    from app.realtime import sse
    monkeypatch.setattr(sse.broadcaster, "broadcast", mock_broadcast)

    # Ingest telemetry for Tenant B vehicle located right at Tenant A warehouse
    packet = NormalizedTelemetryPacket(
        vehicle_identifier="NX-BRAVO",
        latitude=dock_lat,
        longitude=dock_lng,
        speed_kmh=0.0,
    )
    await ingest_telemetry_packet(async_db, packet, workspace_id=ws_b)

    # Warehouse lookup is tenant-scoped (Warehouse.workspace_id == ws_b), so wh_a is not found
    await async_db.refresh(trip_b)
    assert trip_b.actual_arrival is None, "Cross-tenant leak: vehicle in Tenant B triggered dock arrival at Tenant A warehouse!"
    assert len([e for e in broadcasted if e[0] == "DOCK_ARRIVAL_DETECTED"]) == 0


@pytest.mark.asyncio
async def test_dock_geofence_safeguards(async_db: AsyncSession):
    """Verify that completed trips and warehouses with missing coordinates are handled safely."""
    ws = "ws-safeguards"
    wh = Warehouse(
        id="wh-safe-hub",
        code="WH-SAFE",
        name="Safe Warehouse",
        city="Pune",
        state="Maharashtra",
        lat=18.5,
        lng=73.8,
        workspace_id=ws,
    )
    veh = Vehicle(
        id="veh-safe-01",
        code="NX-SAFE",
        name="Safe Unit",
        model="Scania R500",
        driver_name="Karan Dave",
        status="IN_TRANSIT",
        current_lat=19.0,
        current_lng=72.0,
        workspace_id=ws,
    )
    trip_completed = Trip(
        id="trip-done",
        trip_number="TRIP-DONE",
        vehicle_id=veh.id,
        origin_warehouse_id=wh.id,
        dest_warehouse_id=wh.id,
        status="COMPLETED",  # Not active
        scheduled_departure="2026-10-20T08:00:00Z",
        scheduled_arrival="2026-10-20T10:00:00Z",
        actual_arrival=None,
        workspace_id=ws,
    )
    async_db.add_all([wh, veh, trip_completed])
    await async_db.commit()

    packet = NormalizedTelemetryPacket(
        vehicle_identifier="NX-SAFE",
        latitude=18.5,
        longitude=73.8,
        speed_kmh=20.0,
    )
    # Must execute smoothly without exception for completed trip
    res = await ingest_telemetry_packet(async_db, packet, workspace_id=ws)
    assert res["status"] == "PROCESSED"
    await async_db.refresh(trip_completed)
    assert trip_completed.actual_arrival is None


# ============================================================================
# 4. Simulation Decision Application Tests
# ============================================================================

@pytest.mark.asyncio
async def test_apply_simulation_decision_lifecycle(async_db: AsyncSession, monkeypatch):
    """
    Verify complete operational state cascade when apply_simulation_decision is executed:
    1. Simulation status -> APPLIED, applied_at, applied_by, version incremented.
    2. Associated Incident status -> ACTION_APPLIED, resolved_at set, IncidentTimeline created.
    3. Associated Vehicle status -> IN_TRANSIT.
    4. Active Trip delay reduced by netTimeSavedMins, status -> IN_TRANSIT.
    5. Decision audit record persisted.
    6. EventOutbox record persisted for background worker.
    7. DECISION_APPLIED event broadcast with workspace_id scoping.
    """
    ws = "ws-sim-test"
    actor = "Lead Controller Sarah"

    veh = Vehicle(
        id="veh-sim-104",
        code="NX-104",
        name="Long Haul Prime",
        model="Freightliner Cascadia",
        driver_name="Rajesh Sharma",
        status="DELAYED",
        current_lat=19.0,
        current_lng=72.0,
        workspace_id=ws,
    )
    inc = Incident(
        id="inc-pass-closure",
        code="INC-PASS-99",
        title="Monsoon Pass Flooding",
        summary="Monsoon flash flooding closure at Western Pass",
        severity="CRITICAL",
        status="DETECTED",
        affected_entity_type="VEHICLE",
        affected_entity_id=veh.id,
        affected_entity_name=veh.name,
        vehicle_id=veh.id,
        delay_minutes=180,
        workspace_id=ws,
    )
    wh = Warehouse(
        id="wh-hub-dest",
        code="WH-DEST",
        name="Hub Dest",
        city="Pune",
        state="Maharashtra",
        lat=18.5,
        lng=73.8,
        workspace_id=ws,
    )
    trip = Trip(
        id="trip-sim-live",
        trip_number="TRIP-SIM-01",
        vehicle_id=veh.id,
        origin_warehouse_id=wh.id,
        dest_warehouse_id=wh.id,
        status="DELAYED",
        delay_minutes=180,
        scheduled_departure="2026-10-20T06:00:00Z",
        scheduled_arrival="2026-10-20T14:00:00Z",
        workspace_id=ws,
    )
    sim = Simulation(
        id="sim-detour-opt",
        code="SIM-DETOUR-77",
        title="Express Detour Bypass",
        description="Reroute via Southern Expressway",
        status="EVALUATED",
        incident_id=inc.id,
        variables={"vehicleId": veh.id, "alternateRouteType": "EXPRESS_BYPASS"},
        baseline_metrics={"currentDelayMins": 180, "baseCostUsd": 1200.0},
        simulated_metrics={"netTimeSavedMins": 135, "verdict": "RECOMMENDED"},
        workspace_id=ws,
    )
    async_db.add_all([veh, inc, wh, trip, sim])
    await async_db.commit()

    broadcasted = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasted.append((event_type, payload, workspace_id))

    from app.realtime import sse
    monkeypatch.setattr(sse.broadcaster, "broadcast", mock_broadcast)

    principal = RequestPrincipal(
        nexus_user_id="usr-controller-01",
        clerk_user_id="clerk-01",
        email="controller@nexus.continental",
        display_name=actor,
        workspace_id=ws,
        organization_id="org-nexus",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True,
    )

    req = SimulationApplyDecision(actor_name=actor, notes="Approved detour after driver confirmation.")

    result = await apply_simulation_decision(
        sim_id=sim.id,
        req=req,
        principal=principal,
        db=async_db,
    )

    # 1. Check Simulation state
    assert result.status == "APPLIED"
    assert result.applied_by == actor
    assert result.applied_at is not None

    # 2. Check Incident state
    await async_db.refresh(inc)
    assert inc.status == "ACTION_APPLIED"
    assert inc.resolved_at is not None

    # Check IncidentTimeline
    tl_stmt = select(IncidentTimeline).where(IncidentTimeline.incident_id == inc.id)
    tl_res = await async_db.execute(tl_stmt)
    timelines = tl_res.scalars().all()
    assert any(t.status == "ACTION_APPLIED" and actor in t.note for t in timelines)

    # 3. Check Vehicle state
    await async_db.refresh(veh)
    assert veh.status == "IN_TRANSIT"

    # 4. Check Trip delay reduction (180 - 135 = 45 mins)
    await async_db.refresh(trip)
    assert trip.delay_minutes == 45
    assert trip.status == "IN_TRANSIT"

    # 5. Check Decision audit record
    dec_stmt = select(Decision).where(Decision.simulation_id == sim.id)
    dec_res = await async_db.execute(dec_stmt)
    decision = dec_res.scalars().first()
    assert decision is not None
    assert decision.applied_by == actor
    assert decision.changes_json["netTimeSavedMins"] == 135

    # 6. Check EventOutbox record
    out_stmt = select(EventOutbox).where(EventOutbox.aggregate_id == decision.id)
    out_res = await async_db.execute(out_stmt)
    outbox = out_res.scalars().first()
    assert outbox is not None
    assert outbox.event_type == "decision.applied"

    # 7. Check Broadcast event
    dec_events = [e for e in broadcasted if e[0] == "DECISION_APPLIED"]
    assert len(dec_events) == 1
    _, dec_payload, dec_ws = dec_events[0]
    assert dec_ws == ws
    assert dec_payload["simulationCode"] == "SIM-DETOUR-77"
    assert dec_payload["netTimeSavedMins"] == 135
    assert dec_payload["actorName"] == actor


@pytest.mark.asyncio
async def test_apply_simulation_decision_cross_tenant_rejection(async_db: AsyncSession):
    """Verify that applying a simulation belonging to another workspace raises 404 EntityNotFoundException."""
    ws_owner = "ws-owner-99"
    ws_intruder = "ws-intruder-00"

    sim = Simulation(
        id="sim-private-scenario",
        code="SIM-PRIV-01",
        title="Proprietary Detour",
        description="Confidential bypass plan",
        status="EVALUATED",
        workspace_id=ws_owner,
    )
    async_db.add(sim)
    await async_db.commit()

    intruder_principal = RequestPrincipal(
        nexus_user_id="usr-intruder",
        clerk_user_id="clerk-int",
        email="intruder@external.test",
        display_name="Intruder",
        workspace_id=ws_intruder,
        organization_id="org-other",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True,
    )

    req = SimulationApplyDecision(actor_name="Intruder")

    with pytest.raises(EntityNotFoundException):
        await apply_simulation_decision(
            sim_id=sim.id,
            req=req,
            principal=intruder_principal,
            db=async_db,
        )


@pytest.mark.asyncio
async def test_apply_simulation_decision_delay_clamping(async_db: AsyncSession):
    """Verify that if netTimeSavedMins exceeds trip delay, delay_minutes clamps safely to 0."""
    ws = "ws-clamp-test"
    veh = Vehicle(
        id="veh-clamp",
        code="NX-CLAMP",
        name="Clamp Unit",
        model="Tata Signa",
        driver_name="Anil Rao",
        status="DELAYED",
        current_lat=19.0,
        current_lng=72.0,
        workspace_id=ws,
    )
    trip = Trip(
        id="trip-clamp",
        trip_number="TRIP-CLAMP",
        vehicle_id=veh.id,
        origin_warehouse_id="wh-dummy",
        dest_warehouse_id="wh-dummy",
        status="DELAYED",
        delay_minutes=30,  # 30 mins delay
        scheduled_departure="2026-10-20T08:00:00Z",
        scheduled_arrival="2026-10-20T10:00:00Z",
        workspace_id=ws,
    )
    sim = Simulation(
        id="sim-clamp",
        code="SIM-CLAMP",
        title="Super Highway Bypass",
        description="Clamp test scenario",
        status="EVALUATED",
        variables={"vehicleId": veh.id},
        simulated_metrics={"netTimeSavedMins": 90},  # 90 mins saved > 30 mins delay
        workspace_id=ws,
    )
    async_db.add_all([veh, trip, sim])
    await async_db.commit()

    principal = RequestPrincipal(
        nexus_user_id="usr-admin",
        clerk_user_id="clerk-admin",
        email="admin@nexus.test",
        display_name="Admin",
        workspace_id=ws,
        organization_id="org-test",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True,
    )

    await apply_simulation_decision(
        sim_id=sim.id,
        req=SimulationApplyDecision(),
        principal=principal,
        db=async_db,
    )

    await async_db.refresh(trip)
    assert trip.delay_minutes == 0, f"Expected delay clamped to 0, got {trip.delay_minutes}"


# ============================================================================
# 5. Frontend Real-Time Wiring & Interface Verification
# ============================================================================

def test_frontend_realtime_client_event_dispatch():
    """Verify that frontend/lib/realtime-client.ts registers and publishes all M2 events to eventBus."""
    content = read_frontend_file("lib/realtime-client.ts")

    # Raw and lowercase event publishing
    assert "eventBus.publish(type.toLowerCase(), data);" in content
    assert "eventBus.publish(type, data);" in content

    # All required M2 event cases
    required_events = [
        "VEHICLE_TELEMETRY_UPDATED",
        "TRIP_DISPATCHED",
        "ORDER_UPDATED",
        "DOCK_ARRIVAL_DETECTED",
        "DOCK_DWELL_WARNING",
        "DETENTION_ACCRUING",
        "PROOF_OF_DELIVERY_SUBMITTED",
        "DECISION_APPLIED",
        "SIMULATION_EVALUATED",
    ]
    for ev in required_events:
        assert f'case "{ev}":' in content, f"realtime-client.ts missing case handler for {ev}"


def test_frontend_leaflet_map_props_and_drilldown():
    """Verify LeafletWorldMap implements selection, camera flyTo, and reactive event subscriptions."""
    content = read_frontend_file("components/map/LeafletWorldMap.tsx")

    # Contract props
    assert "onEntitySelect" in content, "LeafletWorldMapProps missing onEntitySelect"
    assert "selectedEntityId" in content, "LeafletWorldMapProps missing selectedEntityId"
    assert "flyToLocation" in content, "LeafletWorldMapProps missing flyToLocation"

    # Event subscriptions for real-time reactivity
    assert "vehicle_telemetry_updated" in content, "Map missing vehicle_telemetry_updated subscription"
    assert "dock_arrival_detected" in content, "Map missing dock_arrival_detected subscription"
    assert "dock_dwell_warning" in content, "Map missing dock_dwell_warning subscription"
    assert "detention_accruing" in content, "Map missing detention_accruing subscription"


def test_frontend_live_world_page_inspector_and_suspense():
    """Verify /live-world page wraps URL param reader in Suspense and controls the Cupertino drawer."""
    content = read_frontend_file("app/(app)/live-world/page.tsx")

    assert "useSearchParams()" in content, "/live-world must parse search params"
    assert "queryEntityType" in content, "/live-world must inspect entityType query param"
    assert "queryId" in content, "/live-world must inspect id query param"
    assert "Drawer" in content, "/live-world must render Cupertino slide-over Drawer"
    assert "React.Suspense" in content, "/live-world must wrap search param reader in React.Suspense"


def test_frontend_intelligence_page_dock_event_subscriptions():
    """Verify /intelligence page dynamically tracks dock dwell warnings and detention accruals."""
    content = read_frontend_file("app/(app)/intelligence/page.tsx")

    assert "dock_arrival_detected" in content, "/intelligence missing dock_arrival_detected subscription"
    assert "dock_dwell_warning" in content, "/intelligence missing dock_dwell_warning subscription"
    assert "detention_accruing" in content, "/intelligence missing detention_accruing subscription"
    assert "proof_of_delivery_submitted" in content, "/intelligence missing proof_of_delivery_submitted subscription"


# ==============================================================================
# Milestone 2 Remediation Regression Tests (Defects 1-5)
# ==============================================================================

@pytest.mark.asyncio
async def test_remediation_1_lifespan_startup_and_cancellation():
    """Verify lifespan initializes outbox worker and azure_iot_consumer on app.state and cancels cleanly."""
    import app.main
    from app.main import lifespan, app as fastapi_app

    cm = lifespan(fastapi_app)
    await cm.__aenter__()
    try:
        assert hasattr(fastapi_app.state, "outbox_worker_task"), "app.state missing outbox_worker_task"
        assert isinstance(fastapi_app.state.outbox_worker_task, asyncio.Task), "outbox_worker_task is not an asyncio.Task"
        assert not fastapi_app.state.outbox_worker_task.done(), "outbox_worker_task died unexpectedly"
        assert hasattr(fastapi_app.state, "azure_iot_consumer"), "app.state missing azure_iot_consumer"
        assert fastapi_app.state.azure_iot_consumer is not None, "azure_iot_consumer should not be None"
    finally:
        await cm.__aexit__(None, None, None)
        assert fastapi_app.state.outbox_worker_task.done(), "outbox_worker_task should be cancelled on shutdown"


def test_remediation_2_dock_detention_schema_alignment():
    """Verify telemetry_service and intelligence page share aligned field conventions for dock dwell and demurrage."""
    telemetry_path = Path(__file__).resolve().parent.parent / "app" / "services" / "telemetry_service.py"
    with open(telemetry_path, "r", encoding="utf-8") as f:
        telem_content = f.read()

    # Backend telemetry payload conventions
    assert '"dwell_minutes": elapsed_mins' in telem_content, "telemetry_service missing dwell_minutes"
    assert '"wait_minutes": elapsed_mins' in telem_content, "telemetry_service missing wait_minutes"
    assert '"billable_hours": round(billable / 60.0, 2)' in telem_content, "telemetry_service missing billable_hours"
    assert '"detention_minutes": billable' in telem_content, "telemetry_service missing detention_minutes"
    assert '"accrued_demurrage_usd": round((billable / 60.0) * 75.0, 2)' in telem_content, "telemetry_service missing accrued_demurrage_usd"
    assert '"estimated_charge_inr": round((billable / 60.0) * 500.0, 2)' in telem_content, "telemetry_service missing estimated_charge_inr"

    # Frontend intelligence page access conventions
    intel_content = read_frontend_file("app/(app)/intelligence/page.tsx")
    assert "p.dwell_minutes ?? p.wait_minutes" in intel_content, "intelligence/page.tsx must fallback dwell_minutes to wait_minutes"
    assert "p.billable_hours ?? (p.detention_minutes" in intel_content, "intelligence/page.tsx must handle billable_hours or detention_minutes"
    assert "p.accrued_demurrage_usd ?? p.estimated_charge_inr" in intel_content, "intelligence/page.tsx must fallback accrued_demurrage_usd to estimated_charge_inr"


def test_remediation_3_overview_telemetry_fetch_storm_filter():
    """Verify overview/page.tsx filters out high-frequency VEHICLE_TELEMETRY_UPDATED pulse events."""
    overview_content = read_frontend_file("app/(app)/overview/page.tsx")
    assert 'pulse?.eventType === "VEHICLE_TELEMETRY_UPDATED"' in overview_content, (
        "overview/page.tsx must ignore VEHICLE_TELEMETRY_UPDATED in subscribePulse to eliminate fetch storms"
    )


def test_remediation_4_leaflet_flyto_finite_guard():
    """Verify LeafletWorldMap guards flyToLocation with Number.isFinite."""
    leaflet_content = read_frontend_file("components/map/LeafletWorldMap.tsx")
    assert "Number.isFinite(flyToLocation.lat)" in leaflet_content, "LeafletWorldMap must check Number.isFinite for lat"
    assert "Number.isFinite(flyToLocation.lng)" in leaflet_content, "LeafletWorldMap must check Number.isFinite for lng"


@pytest.mark.asyncio
async def test_remediation_5_event_broadcaster_bounded_queue():
    """Verify EventBroadcaster uses bounded queue (maxsize=256) and safely handles queue saturation."""
    from app.realtime.sse import EventBroadcaster

    broadcaster = EventBroadcaster()
    gen = broadcaster.subscribe(workspace_id="ws-bounded-test")
    # Consume initial connection heartbeat
    init_msg = await gen.asend(None)
    assert "CONNECTION_ESTABLISHED" in init_msg

    # Inspect subscriber queue maxsize
    queues = broadcaster._subscribers["ws-bounded-test"]
    assert len(queues) == 1
    sub_queue = next(iter(queues))
    assert sub_queue.maxsize == 256, f"Expected queue maxsize 256, got {sub_queue.maxsize}"

    # Broadcast 300 messages to saturated queue without reading
    for i in range(300):
        await broadcaster.broadcast("BURST_TEST", {"seq": i}, workspace_id="ws-bounded-test")

    # Queue should be capped at maxsize=256 (not 300)
    assert sub_queue.qsize() == 256, f"Queue leaked beyond bound: size={sub_queue.qsize()}"

    # Cleanup generator
    await gen.aclose()
    assert "ws-bounded-test" not in broadcaster._subscribers

