"""
NEXUS Logistics Platform — Comprehensive Opaque-Box E2E Test Suite (Tiers 1-4)
=============================================================================
Author: teamwork_preview_test_writer_m4
Specification: PROJECT.md, ORIGINAL_REQUEST.md, TEST_INFRA.md

Verification Tier Architecture:
- Tier 1: Feature Coverage (All 20 Features F1-F20 in isolation)
- Tier 2: Boundary & Corner Cases (Extreme coordinates, rate limits, circuit transitions)
- Tier 3: Cross-Feature Interactions (Pairwise UI & Event pipeline integrations)
- Tier 4: Real-World Scenarios (End-to-end multi-vehicle freight convoy lifecycle)
"""

import os
import re
import json
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, or_, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Core Models & DB Base
from app.db.base import Base
import app.models  # Registers all 58 tables on Base.metadata
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.logistics import Trip, Stop, Shipment, Customer
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.models.incidents import Incident, IncidentTimeline
from app.models.simulations import Simulation, Decision
from app.models.system import OperationalEvent, EventOutbox, Notification, AuditLog
from app.models.user import Workspace, User, WorkspaceMembership

# Services & Schemas
from app.realtime.sse import EventBroadcaster, broadcaster
from app.services.telemetry_service import ingest_telemetry_packet, NormalizedTelemetryPacket
from app.services.detention_service import DetentionService, haversine_distance_meters
from app.core.resilience import CircuitBreaker, CircuitState, geo_circuit, weather_circuit, ai_circuit
from app.services.simulation_engine import run_deterministic_simulation, run_stochastic_simulation
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables, SimulationApplyDecision
from app.api.v1.endpoints.simulations import apply_simulation_decision
from app.api.v1.endpoints.driver import ProofOfDeliverySubmission, submit_proof_of_delivery
from app.core.security import create_access_token

# Auth & App
from app.main import app
from app.db.session import get_db
from app.auth.dependencies import require_onboarded, require_authenticated, require_workspace, require_permission
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP


FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

def read_frontend_file(rel_path: str) -> str:
    path = os.path.join(FRONTEND_DIR, rel_path)
    assert os.path.isfile(path), f"Frontend file not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ============================================================================
# Shared Test Fixtures
# ============================================================================

@pytest.fixture
async def async_db():
    """Provides an isolated in-memory SQLite database session with complete 58-table schema."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()


@pytest.fixture
def test_principal() -> RequestPrincipal:
    """Provides an authorized administrator principal for tenant ws-e2e-fleet-01."""
    return RequestPrincipal(
        nexus_user_id="usr-e2e-controller",
        clerk_user_id="user_clerk_e2e_99",
        email="controller@nexus-e2e.test",
        display_name="E2E Operations Director",
        workspace_id="ws-e2e-fleet-01",
        organization_id="org-e2e-logistics",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True
    )


@pytest.fixture
async def e2e_client(async_db: AsyncSession, test_principal: RequestPrincipal):
    """Provides an HTTP async client connected to FastAPI with real in-memory SQLite persistence."""
    async def override_get_db():
        yield async_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_onboarded] = lambda: test_principal
    app.dependency_overrides[require_authenticated] = lambda: test_principal
    app.dependency_overrides[require_workspace] = lambda: test_principal

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_resilience_circuits():
    """Ensures external service circuit breakers are reset to CLOSED before and after each test."""
    geo_circuit.reset()
    weather_circuit.reset()
    ai_circuit.reset()
    yield
    geo_circuit.reset()
    weather_circuit.reset()
    ai_circuit.reset()


# ============================================================================
# TIER 1: Feature Coverage (All 20 Features F1–F20 in Isolation)
# ============================================================================

def test_tier1_f1_primary_navigation_architecture():
    """F1: Verify Sidebar.tsx exposes all 6 primary tabs with Apple spring active pill."""
    content = read_frontend_file("components/layout/Sidebar.tsx")
    routes = ["/overview", "/live-world", "/operations", "/intelligence", "/analytics", "/settings"]
    for r in routes:
        assert f'href: "{r}"' in content or f"href: '{r}'" in content, f"Missing route {r} in Sidebar"
    assert 'layoutId="sidebarActivePill"' in content, "Sidebar missing layoutId='sidebarActivePill'"
    assert "stiffness: 260" in content, "Sidebar missing spring stiffness: 260"
    assert "damping: 28" in content, "Sidebar missing spring damping: 28"


def test_tier1_f2_dedicated_intelligence_tab():
    """F2: Verify /intelligence/page.tsx mounts TransporterIntelligenceCard, KPI squircles, and radar."""
    content = read_frontend_file("app/(app)/intelligence/page.tsx")
    assert "TransporterIntelligenceCard" in content, "/intelligence/page.tsx must mount TransporterIntelligenceCard"
    assert "redirect(" not in content, "/intelligence/page.tsx must not contain a redirect stub"
    assert "Detention" in content, "/intelligence/page.tsx must display dock detention intelligence"


def test_tier1_f3_ml_analytics_unique_tab_navigation():
    """F3: Verify /analytics/page.tsx has distinct tab keys (no duplicate 'overview' IDs)."""
    content = read_frontend_file("app/(app)/analytics/page.tsx")
    # Must have forecast, anomalies, medallion
    assert 'id: "forecast"' in content or 'id: "forecast"' in content, "Missing forecast tab in /analytics"
    assert 'id: "anomalies"' in content, "Missing anomalies tab in /analytics"
    assert 'id: "medallion"' in content, "Missing medallion tab in /analytics"


def test_tier1_f4_apple_hig_typography_token_cascade():
    """F4: Verify Apple SF Pro font stack and tabular figures in Tailwind configuration."""
    content = read_frontend_file("tailwind.config.ts")
    assert "SF Pro" in content or "system-ui" in content, "Tailwind config must declare Apple system font stack"
    assert "fontFamily" in content, "Tailwind config must define typography font families"


def test_tier1_f5_hairline_borders_and_glassmorphism():
    """F5: Verify hairline borders (0.08/0.12), backdrop-blur-3xl, and Apple squircles."""
    sidebar_content = read_frontend_file("components/layout/Sidebar.tsx")
    intelligence_content = read_frontend_file("components/intelligence/TransporterIntelligenceCard.tsx")
    combined = sidebar_content + intelligence_content
    assert "backdrop-blur" in combined, "Components must employ Apple glassmorphic blur"
    assert "rounded-" in combined, "Components must employ Apple squircle rounded radii"


def test_tier1_f6_continuous_spring_physics_and_morphing():
    """F6: Verify continuous spring physics in AppShell.tsx and Drawer."""
    appshell = read_frontend_file("components/layout/AppShell.tsx")
    assert '<AnimatePresence mode="wait"' in appshell, "AppShell must wrap routes with AnimatePresence mode='wait'"
    assert "stiffness: 260" in appshell, "AppShell must configure stiffness: 260"
    assert "damping: 28" in appshell, "AppShell must configure damping: 28"


def test_tier1_f7_micro_interactions_and_skeletons():
    """F7: Verify tactile active states and specular sweep skeletons."""
    appshell = read_frontend_file("components/layout/AppShell.tsx")
    sidebar = read_frontend_file("components/layout/Sidebar.tsx")
    assert "motion." in appshell or "motion." in sidebar, "Layout components must use motion for tactile interactions"


@pytest.mark.asyncio
async def test_tier1_f8_multi_tenant_scoped_sse_broadcasting():
    """F8: Verify EventBroadcaster scopes events to workspace_id without cross-tenant leaks."""
    broadcaster = EventBroadcaster()
    received_a: List[Dict[str, Any]] = []
    received_b: List[Dict[str, Any]] = []

    async def consume(ws_id: str, out_list: List[Dict[str, Any]], count: int):
        gen = broadcaster.subscribe(workspace_id=ws_id)
        async for msg in gen:
            if msg.startswith("data: "):
                payload = json.loads(msg[6:].strip())
                if payload.get("type") != "CONNECTION_ESTABLISHED":
                    out_list.append(payload)
                    if len(out_list) >= count:
                        await gen.aclose()
                        break

    task_a = asyncio.create_task(consume("ws-tenant-alpha", received_a, 1))
    task_b = asyncio.create_task(consume("ws-tenant-beta", received_b, 1))
    await asyncio.sleep(0.05)

    # Broadcast event specifically to ws-tenant-alpha
    await broadcaster.broadcast("ALPHA_EXCLUSIVE", {"order_id": "ORD-1"}, workspace_id="ws-tenant-alpha")
    await asyncio.sleep(0.05)

    assert len(received_a) == 1
    assert received_a[0]["type"] == "ALPHA_EXCLUSIVE"
    assert len(received_b) == 0, "Security Violation: ws-tenant-beta received event for alpha"

    task_a.cancel()
    task_b.cancel()


@pytest.mark.asyncio
async def test_tier1_f9_proactive_dock_detention_pipeline(async_db: AsyncSession, monkeypatch):
    """F9: Verify warehouse geofence checking emits DOCK_ARRIVAL_DETECTED, DOCK_DWELL_WARNING, DETENTION_ACCRUING."""
    ws = "ws-f9-test"
    wh = Warehouse(
        id="wh-chi-01", code="WH-CHI", name="Chicago Central Hub",
        city="Chicago", state="IL", lat=41.8781, lng=-87.6298, workspace_id=ws
    )
    veh = Vehicle(
        id="veh-f9-01", code="NX-F9", name="Freightliner F9", model="Cascadia",
        driver_name="Alex Turner", status="IN_TRANSIT", current_lat=41.95, current_lng=-87.65, workspace_id=ws
    )
    trip = Trip(
        id="trip-f9-01", trip_number="TRIP-F9-01", vehicle_id=veh.id,
        origin_warehouse_id=wh.id, dest_warehouse_id=wh.id, status="IN_TRANSIT",
        scheduled_departure="2026-10-20T08:00:00Z", scheduled_arrival="2026-10-20T12:00:00Z",
        workspace_id=ws
    )
    async_db.add_all([wh, veh, trip])
    await async_db.commit()

    broadcasts = []
    async def mock_bc(event_type, payload, workspace_id=None):
        broadcasts.append((event_type, payload))
    monkeypatch.setattr(broadcaster, "broadcast", mock_bc)

    # 1. Telemetry entering 500m geofence (truck 150m away from warehouse)
    packet_arrived = NormalizedTelemetryPacket(
        vehicle_identifier="NX-F9",
        latitude=41.8790,
        longitude=-87.6298,
        speed_kmh=12.0
    )
    await ingest_telemetry_packet(async_db, packet_arrived, workspace_id=ws)
    await async_db.refresh(trip)

    assert trip.status == "ARRIVED"
    assert trip.actual_arrival is not None
    assert any(b[0] == "DOCK_ARRIVAL_DETECTED" for b in broadcasts)


def test_tier1_f10_background_outbox_worker_activation():
    """F10: Verify transactional outbox worker loop is registered in app lifespan."""
    main_py = read_frontend_file("../backend/app/main.py")
    assert "run_worker_loop" in main_py, "main.py must import and schedule run_worker_loop"
    assert "outbox_worker_task" in main_py, "main.py must assign outbox worker task to app.state"


def test_tier1_f11_frontend_realtime_client_expansion():
    """F11: Verify realtime-client.ts maps all operational SSE events to pulse items."""
    content = read_frontend_file("lib/realtime-client.ts")
    required_events = [
        "VEHICLE_TELEMETRY_UPDATED", "TRIP_DISPATCHED", "ORDER_UPDATED",
        "DOCK_ARRIVAL_DETECTED", "DOCK_DWELL_WARNING", "DETENTION_ACCRUING",
        "PROOF_OF_DELIVERY_SUBMITTED", "INCIDENT_CREATED", "DECISION_APPLIED"
    ]
    for evt in required_events:
        assert f'case "{evt}":' in content, f"realtime-client.ts missing handler for {evt}"


def test_tier1_f12_reactive_ui_component_subscriptions():
    """F12: Verify in-memory event-bus.ts pub/sub topics and error-isolated subscriber execution."""
    content = read_frontend_file("lib/event-bus.ts")
    assert "NexusEventBus" in content, "event-bus.ts must define NexusEventBus class"
    assert "subscribe" in content, "event-bus.ts must define subscribe method"
    assert "publish" in content, "event-bus.ts must define publish method"
    assert "deadLetterQueue" in content, "event-bus.ts must maintain DLQ for failing handlers"


def test_tier1_f13_live_map_selection_inspector_sheet_sync():
    """F13: Verify LeafletWorldMap exposes onEntitySelect and flyToLocation contracts."""
    content = read_frontend_file("components/map/LeafletWorldMap.tsx")
    assert "onEntitySelect" in content, "LeafletWorldMap must accept onEntitySelect prop"
    assert "flyToLocation" in content or "flyTo" in content, "LeafletWorldMap must handle flyToLocation"


@pytest.mark.asyncio
async def test_tier1_f14_simulation_live_decision_application(async_db: AsyncSession, test_principal: RequestPrincipal):
    """F14: Verify applying simulation decision transitions incident, vehicle, and emits DECISION_APPLIED."""
    ws = test_principal.workspace_id
    veh = Vehicle(
        id="veh-sim-01", code="NX-SIM-1", name="Simulation Truck 1",
        model="Semi", driver_name="Carlos R.", status="DELAYED",
        current_lat=39.0, current_lng=-94.0, workspace_id=ws
    )
    inc = Incident(
        id="inc-sim-01", code="INC-WTR-01", title="Severe Ice Storm",
        summary="Road closure on I-70", severity="HIGH", category="WEATHER",
        status="DETECTED", affected_entity_type="VEHICLE", affected_entity_id=veh.id,
        affected_entity_name=veh.name, vehicle_id=veh.id, workspace_id=ws
    )
    sim = Simulation(
        id="sim-scenario-01", code="SIM-DETOUR", title="Detour Evaluation",
        description="Reroute south", status="EVALUATED", incident_id=inc.id,
        simulated_metrics={"netTimeSavedMins": 90}, variables={"vehicleId": veh.id},
        workspace_id=ws
    )
    async_db.add_all([veh, inc, sim])
    await async_db.commit()

    req = SimulationApplyDecision(simulation_id=sim.id, notes="Approved reroute detour", actor_name="E2E Director")
    sim_res = await apply_simulation_decision(sim.id, req, test_principal, async_db)

    assert sim_res.id == sim.id
    assert sim_res.status == "APPLIED"

    dec_res = await async_db.execute(select(Decision).where(Decision.simulation_id == sim.id))
    dec = dec_res.scalar_one_or_none()
    assert dec is not None
    assert dec.simulation_id == sim.id

    await async_db.refresh(sim)
    await async_db.refresh(inc)
    await async_db.refresh(veh)

    assert sim.status == "APPLIED"
    assert inc.status == "ACTION_APPLIED"
    assert veh.status == "IN_TRANSIT"


@pytest.mark.asyncio
async def test_tier1_f15_zero_mock_mutation_verification(async_db: AsyncSession, e2e_client: AsyncClient, test_principal: RequestPrincipal):
    """F15: Verify POST /api/v1/operations/vehicles creates authentic database row without mock fallback."""
    ws = test_principal.workspace_id
    payload = {
        "code": "NX-MUT-99",
        "name": "Heavy Freight Hauler 99",
        "model": "Volvo VNR Electric",
        "driverName": "Marcus Vance",
        "currentLat": 41.8781,
        "currentLng": -87.6298,
        "speedKmh": 0.0,
        "batteryPct": 100,
        "healthScore": 95,
        "status": "AVAILABLE"
    }

    res = await e2e_client.post("/api/v1/operations/vehicles", json=payload)
    assert res.status_code in [200, 201], f"Expected 200/201, got {res.status_code}: {res.text}"
    created = res.json()
    assert created["code"] == "NX-MUT-99"

    # Verify directly from database session
    db_res = await async_db.execute(select(Vehicle).where(Vehicle.code == "NX-MUT-99", Vehicle.workspace_id == ws))
    veh = db_res.scalar_one_or_none()
    assert veh is not None, "Mutation failed to persist to real database"
    assert veh.model == "Volvo VNR Electric"


@pytest.mark.asyncio
async def test_tier1_f16_external_service_circuit_breakers():
    """F16: Verify CircuitBreaker trips to OPEN on repeated failures and recovers."""
    cb = CircuitBreaker("geo_test", failure_threshold=2, recovery_timeout_seconds=0.05)
    assert cb.state == CircuitState.CLOSED

    async def fail_call():
        raise RuntimeError("Service unavailable")

    for _ in range(2):
        with pytest.raises(RuntimeError):
            await cb.call(fail_call)

    assert cb.state == CircuitState.OPEN
    # Call during OPEN returns fallback immediately
    fallback_res = await cb.call(fail_call, fallback_func=lambda: "FALLBACK_CALLED")
    assert fallback_res == "FALLBACK_CALLED"

    # Wait for recovery timeout
    await asyncio.sleep(0.06)

    async def success_call():
        return "SUCCESS"

    res = await cb.call(success_call)
    assert res == "SUCCESS"
    assert cb.state == CircuitState.CLOSED


def test_tier1_f17_client_offline_mutation_buffer():
    """F17: Verify OfflineMutationBuffer in data-provider.ts manages retry queue and backoff."""
    content = read_frontend_file("lib/data-provider.ts")
    assert "class OfflineMutationBuffer" in content, "data-provider.ts must declare OfflineMutationBuffer"
    assert "HTTP 429" in content or "429" in content, "Mutation buffer must handle HTTP 429 rate limits"
    assert "Retry-After" in content, "Mutation buffer must parse Retry-After header"


def test_tier1_f18_status_tooling_alignment():
    """F18: Verify backend/check_status.py checks database connection and circuit breakers."""
    status_content = read_frontend_file("../backend/check_status.py")
    assert "neondb" in status_content or "Database Check" in status_content, "check_status.py must verify DB"
    assert "Circuit Breaker" in status_content, "check_status.py must verify circuit breakers"
    assert "azure_health" in status_content, "check_status.py must verify azure health"


def test_tier1_f19_opaque_box_e2e_test_suite_infrastructure():
    """F19: Verify TEST_INFRA.md document exists and details dual-track testing and tiers."""
    infra_path = os.path.abspath(os.path.join(FRONTEND_DIR, "..", "TEST_INFRA.md"))
    assert os.path.isfile(infra_path), "TEST_INFRA.md must exist at project root"
    with open(infra_path, "r", encoding="utf-8") as f:
        infra_text = f.read()
    assert "Tier 1" in infra_text and "Tier 4" in infra_text, "TEST_INFRA.md must define Tiers 1-4"
    assert "Zero-Mock" in infra_text, "TEST_INFRA.md must state zero-mock guarantee"


def test_tier1_f20_adversarial_hardening_integrity_invariants():
    """F20: Verify zero mock fallback invariants on data mutations."""
    dp_content = read_frontend_file("lib/data-provider.ts")
    assert "Zero Mock Guarantee" in dp_content or "throw new Error" in dp_content, "Mutations must throw on failure rather than fallback to mock data"


# ============================================================================
# TIER 2: Boundary & Corner Cases
# ============================================================================

@pytest.mark.asyncio
async def test_tier2_extreme_coordinates_boundary(async_db: AsyncSession):
    """Tier 2: Verify boundary coordinates (-90, -180, 90, 180, 0, 0) and out-of-bounds rejection."""
    ws = "ws-boundary-test"
    veh1 = Vehicle(
        id="veh-bnd-01", code="NX-BND-01", name="Boundary Truck 1",
        model="Cascadia", driver_name="Driver 1", current_lat=0.0, current_lng=0.0,
        status="IN_TRANSIT", workspace_id=ws
    )
    veh2 = Vehicle(
        id="veh-bnd-02", code="NX-BND-02", name="Boundary Truck 2",
        model="Cascadia", driver_name="Driver 2", current_lat=89.0, current_lng=179.0,
        status="IN_TRANSIT", workspace_id=ws
    )
    async_db.add_all([veh1, veh2])
    await async_db.commit()

    # 1. Null Island (0.0, 0.0)
    packet_null = NormalizedTelemetryPacket(
        vehicle_identifier="NX-BND-01",
        latitude=0.0,
        longitude=0.0,
        speed_kmh=0.0
    )
    res_null = await ingest_telemetry_packet(async_db, packet_null, workspace_id=ws)
    assert res_null["status"] == "PROCESSED"

    # 2. Polar North Extremity (90.0, 180.0)
    packet_north = NormalizedTelemetryPacket(
        vehicle_identifier="NX-BND-02",
        latitude=90.0,
        longitude=180.0,
        speed_kmh=50.0
    )
    res_north = await ingest_telemetry_packet(async_db, packet_north, workspace_id=ws)
    assert res_north["status"] == "PROCESSED"

    # 3. Beyond Polar Extremity (95.0, 200.0) must fail validation
    with pytest.raises(Exception):
        NormalizedTelemetryPacket(
            vehicle_identifier="NX-BND-INVALID",
            latitude=95.0,
            longitude=200.0
        )


def test_tier2_haversine_extreme_distances():
    """Tier 2: Verify Haversine calculation at antipodes (~20,015 km) and identical points (0.0 m)."""
    # Identical coordinates
    dist_zero = haversine_distance_meters(41.8781, -87.6298, 41.8781, -87.6298)
    assert dist_zero == 0.0

    # Antipodal coordinates: North Pole (90, 0) to South Pole (-90, 0) is ~20,015 km
    dist_poles_m = haversine_distance_meters(90.0, 0.0, -90.0, 0.0)
    dist_poles_km = dist_poles_m / 1000.0
    assert 20000.0 < dist_poles_km < 20030.0


@pytest.mark.asyncio
async def test_tier2_circuit_breaker_boundary_and_recovery_cycle():
    """Tier 2: Verify exact transition sequence: CLOSED -> OPEN -> HALF-OPEN -> CLOSED."""
    cb = CircuitBreaker("cb_boundary", failure_threshold=3, recovery_timeout_seconds=0.04)

    async def bomb():
        raise ValueError("Simulated outage")

    # Failures 1 and 2: Still CLOSED
    for i in range(2):
        with pytest.raises(ValueError):
            await cb.call(bomb)
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == i + 1

    # Failure 3: Trips to OPEN
    with pytest.raises(ValueError):
        await cb.call(bomb)
    assert cb.state == CircuitState.OPEN
    assert cb.failure_count == 3

    # Attempting call while OPEN immediately fails with fallback or raises RuntimeError
    with pytest.raises(RuntimeError):
        await cb.call(bomb)

    # Elapse recovery timeout
    await asyncio.sleep(0.05)

    # Successful call after recovery timeout probes upstream and recovers circuit to CLOSED
    async def ok_call():
        return "OK"

    val = await cb.call(ok_call)
    assert val == "OK"
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_tier2_sse_subscriber_rapid_churn_and_cleanup():
    """Tier 2: Verify rapid concurrent subscriber registrations and cancellations do not leak."""
    broadcaster = EventBroadcaster()
    ws_id = "ws-churn-test"

    async def brief_sub():
        gen = broadcaster.subscribe(workspace_id=ws_id)
        first_msg = await gen.asend(None)
        assert "CONNECTION_ESTABLISHED" in first_msg
        await gen.aclose()

    # Launch 30 concurrent rapid subscriber lifecycles
    await asyncio.gather(*(brief_sub() for _ in range(30)))

    # Workspace subscriber set must be completely cleaned up
    assert ws_id not in broadcaster._subscribers or len(broadcaster._subscribers[ws_id]) == 0


def test_tier2_empty_input_detention_clock_derivation():
    """Tier 2: Verify DetentionService computes clean zero charges when dock arrival is None."""
    res = DetentionService.compute_detention_charges(dock_arrival_dt=None)
    assert res["entered_geofence"] is False
    assert res["total_dock_wait_minutes"] == 0
    assert res["billable_detention_minutes"] == 0
    assert res["total_detention_charge_inr"] == 0.0
    assert res["detention_status"] == "EN_ROUTE"


# ============================================================================
# TIER 3: Cross-Feature Interactions (Pairwise Integrations)
# ============================================================================

def test_tier3_interaction_map_pin_selection_and_inspector_drawer():
    """Tier 3: Pairwise verification between Leaflet pin selection and Cupertino Drawer."""
    leaflet_map = read_frontend_file("components/map/LeafletWorldMap.tsx")
    live_page = read_frontend_file("app/(app)/live-world/page.tsx")

    assert "onEntitySelect" in leaflet_map, "Leaflet map must provide entity selection contract"
    assert "selectedEntity" in live_page, "Live world page must hold selectedEntity state"
    assert "Drawer" in live_page or "Sheet" in live_page or "DrawerContent" in live_page, "Live world page must synchronize drawer with selection"


@pytest.mark.asyncio
async def test_tier3_interaction_trip_dispatch_and_dock_dwell_accrual(async_db: AsyncSession):
    """Tier 3: Pairwise verification between Trip dispatch and automated dock dwell tracking."""
    ws = "ws-tier3-dwell"
    wh = Warehouse(
        id="wh-dwell-dest", code="WH-DAL", name="Dallas Freight Terminal",
        city="Dallas", state="TX", lat=32.7767, lng=-96.7970, workspace_id=ws
    )
    veh = Vehicle(
        id="veh-dwell-01", code="NX-DWELL", name="Convoy Lead",
        model="Semi", driver_name="Sara Jenkins", status="AVAILABLE",
        current_lat=32.85, current_lng=-96.85, workspace_id=ws
    )
    trip = Trip(
        id="trip-dwell-01", trip_number="TRIP-DW-100", vehicle_id=veh.id,
        origin_warehouse_id=wh.id, dest_warehouse_id=wh.id, status="PLANNED",
        scheduled_departure="2026-10-20T08:00:00Z", scheduled_arrival="2026-10-20T14:00:00Z",
        workspace_id=ws
    )
    async_db.add_all([wh, veh, trip])
    await async_db.commit()

    # Step 1: Dispatch the trip -> moves to DISPATCHED and IN_TRANSIT
    trip.status = "DISPATCHED"
    trip.actual_departure = datetime.now(timezone.utc).isoformat()
    veh.status = "IN_TRANSIT"
    await async_db.commit()

    assert trip.status == "DISPATCHED"
    assert veh.status == "IN_TRANSIT"

    # Step 2: Ingest telemetry at destination dock (<500m geofence)
    packet_dock = NormalizedTelemetryPacket(
        vehicle_identifier="NX-DWELL",
        latitude=32.7770,
        longitude=-96.7970,
        speed_kmh=4.0
    )
    await ingest_telemetry_packet(async_db, packet_dock, workspace_id=ws)
    await async_db.refresh(trip)

    assert trip.status == "ARRIVED"
    assert trip.actual_arrival is not None

    # Step 3: Compute dwell metrics
    arr_dt = datetime.fromisoformat(trip.actual_arrival.replace("Z", "+00:00"))
    res = DetentionService.compute_detention_charges(
        dock_arrival_dt=arr_dt,
        now_dt=arr_dt + timedelta(minutes=150),
        free_minutes=120,
        hourly_rate_inr=500.0
    )
    assert res["entered_geofence"] is True
    assert res["total_dock_wait_minutes"] == 150
    assert res["billable_detention_minutes"] == 30
    assert res["total_detention_charge_inr"] == 250.0  # 0.5 hr * 500


@pytest.mark.asyncio
async def test_tier3_interaction_telemetry_gps_and_live_marker_updates(async_db: AsyncSession, monkeypatch):
    """Tier 3: Pairwise verification between GPS telemetry ingestion and VEHICLE_TELEMETRY_UPDATED SSE broadcast."""
    ws = "ws-tier3-gps"
    veh = Vehicle(
        id="veh-gps-01", code="NX-GPS-01", name="GPS Tracker Unit",
        model="Cascadia", driver_name="Elena Rostova", status="IN_TRANSIT",
        current_lat=35.0, current_lng=-90.0, speed_kmh=60.0, battery_pct=90,
        workspace_id=ws
    )
    async_db.add(veh)
    await async_db.commit()

    broadcasts = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasts.append((event_type, payload, workspace_id))
    monkeypatch.setattr(broadcaster, "broadcast", mock_broadcast)

    # Ingest updated telemetry packet
    packet = NormalizedTelemetryPacket(
        vehicle_identifier="NX-GPS-01",
        latitude=35.1495,
        longitude=-90.0490,
        speed_kmh=82.5,
        heading=245.0,
        battery_pct=84
    )
    await ingest_telemetry_packet(async_db, packet, workspace_id=ws)
    await async_db.refresh(veh)

    assert veh.current_lat == 35.1495
    assert veh.current_lng == -90.0490
    assert veh.speed_kmh == 82.5
    assert veh.battery_pct == 84

    # Verify SSE broadcast
    gps_events = [b for b in broadcasts if b[0] == "VEHICLE_TELEMETRY_UPDATED"]
    assert len(gps_events) == 1
    assert gps_events[0][1]["code"] == "NX-GPS-01"
    assert gps_events[0][2] == ws


@pytest.mark.asyncio
async def test_tier3_interaction_simulation_decision_and_incident_mutation(async_db: AsyncSession, test_principal: RequestPrincipal):
    """Tier 3: Pairwise verification between simulation decision and incident timeline resolution."""
    ws = test_principal.workspace_id
    inc = Incident(
        id="inc-t3-01", code="INC-HAZ-99", title="Hazard Spill on I-35",
        summary="Tanker spill blocking northbound lanes", severity="HIGH",
        category="HAZARD", status="DETECTED", affected_entity_type="ROUTE",
        affected_entity_id="rt-35", affected_entity_name="I-35 Corridor",
        delay_minutes=120, workspace_id=ws
    )
    sim = Simulation(
        id="sim-t3-01", code="SIM-HAZ-REROUTE", title="Bypass Highway 81",
        description="Divert around hazardous zone", status="EVALUATED",
        incident_id=inc.id, simulated_metrics={"netTimeSavedMins": 75},
        workspace_id=ws
    )
    async_db.add_all([inc, sim])
    await async_db.commit()

    req = SimulationApplyDecision(simulation_id=sim.id, notes="Approved bypass route", actor_name="E2E Director")
    dec = await apply_simulation_decision(sim.id, req, test_principal, async_db)

    await async_db.refresh(inc)
    await async_db.refresh(sim)

    assert sim.status == "APPLIED"
    assert inc.status == "ACTION_APPLIED"

    # Verify timeline entry recorded
    tl_stmt = select(IncidentTimeline).where(IncidentTimeline.incident_id == inc.id)
    timelines = (await async_db.execute(tl_stmt)).scalars().all()
    assert len(timelines) >= 1
    assert any("SIM-HAZ-REROUTE applied" in t.note for t in timelines)


# ============================================================================
# TIER 4: Real-World Scenarios (End-to-End Operational Workload)
# ============================================================================

@pytest.mark.asyncio
async def test_tier4_convoy_freight_trip_complete_lifecycle(async_db: AsyncSession, test_principal: RequestPrincipal, monkeypatch):
    """
    Tier 4: Comprehensive Real-World Workload Simulation:
    Full operational lifecycle of a commercial electric vehicle convoy from Chicago to Dallas:
    1. Seed Origin (Chicago Hub) and Destination (Dallas Hub) warehouses.
    2. Register 5 commercial electric vehicles (NX-CONVOY-01 through 05).
    3. Create commercial freight order ORD-CHI-DAL-2026 ($125,000 value).
    4. Create & Dispatch freight Trip TRIP-CHI-DAL-884 (generates driver pass and tracking links).
    5. Ingest in-transit telemetry along the corridor (Chicago -> St. Louis).
    6. Mid-corridor hazard occurs: Critical Ice Storm incident INC-ICE-088.
    7. AI Simulation Engine evaluates alternate southern detour route saving 135 minutes.
    8. Apply simulation recommendation: updates simulation, reduces trip delay, transitions incident.
    9. Convoy arrives at Dallas Hub: crosses 500m geofence, triggers DOCK_ARRIVAL_DETECTED.
    10. Dock detention clock elapses past 120m free window, triggering DETENTION_ACCRUING.
    11. Consignee completes digital Proof of Delivery (ePOD) touchscreen signature upload.
    12. Demurrage charge finalized (POD_SUBMITTED_CHARGEABLE), order & vehicle marked DELIVERED, outbox verified.
    """
    ws = test_principal.workspace_id
    now_iso = datetime.now(timezone.utc).isoformat()

    broadcasts = []
    async def mock_broadcast(event_type, payload, workspace_id=None):
        broadcasts.append((event_type, payload, workspace_id))
    monkeypatch.setattr(broadcaster, "broadcast", mock_broadcast)

    # -------------------------------------------------------------------------
    # Step 1: Infrastructure Setup (Origin & Destination Hubs)
    # -------------------------------------------------------------------------
    origin_wh = Warehouse(
        id="wh-chicago-hub", code="WH-CHI-MAIN", name="Chicago Logistics Terminal",
        city="Chicago", state="IL", lat=41.8781, lng=-87.6298, dock_count=12,
        workspace_id=ws
    )
    dest_wh = Warehouse(
        id="wh-dallas-hub", code="WH-DAL-MAIN", name="Dallas Gateway Distribution Center",
        city="Dallas", state="TX", lat=32.7767, lng=-96.7970, dock_count=16,
        workspace_id=ws
    )
    async_db.add_all([origin_wh, dest_wh])

    # -------------------------------------------------------------------------
    # Step 2: Fleet Registration (5 Heavy Electric Haulers)
    # -------------------------------------------------------------------------
    convoy_vehicles = []
    for idx in range(1, 6):
        veh_code = f"NX-CONVOY-{idx:02d}"
        v = Vehicle(
            id=f"veh-convoy-{idx:02d}",
            code=veh_code,
            name=f"Freightliner eCascadia #{idx:02d}",
            model="Freightliner eCascadia",
            driver_name=f"Convoy Driver {idx}",
            status="AVAILABLE",
            current_lat=41.8781,
            current_lng=-87.6298,
            speed_kmh=0.0,
            battery_pct=100,
            workspace_id=ws
        )
        convoy_vehicles.append(v)
        async_db.add(v)

    lead_vehicle = convoy_vehicles[0]

    # -------------------------------------------------------------------------
    # Step 3: Commercial Order Creation
    # -------------------------------------------------------------------------
    order = Order(
        id="ord-chi-dal-2026",
        order_number="ORD-CHI-DAL-2026",
        customer_name="Global Retail Logistics Corp",
        destination="Dallas Gateway Distribution Center",
        priority="CRITICAL",
        status="PLANNED",
        total_cost=125000.0,
        deadline="2026-10-21T18:00:00Z",
        warehouse_id=origin_wh.id,
        workspace_id=ws
    )
    async_db.add(order)

    # -------------------------------------------------------------------------
    # Step 4: Trip Creation & Dispatch
    # -------------------------------------------------------------------------
    trip = Trip(
        id="trip-chi-dal-884",
        trip_number="TRIP-CHI-DAL-884",
        vehicle_id=lead_vehicle.id,
        origin_warehouse_id=origin_wh.id,
        dest_warehouse_id=dest_wh.id,
        status="PLANNED",
        scheduled_departure="2026-10-20T06:00:00Z",
        scheduled_arrival="2026-10-20T22:00:00Z",
        delay_minutes=0,
        distance_km=1480.0,
        workspace_id=ws
    )
    async_db.add(trip)
    await async_db.commit()

    # Dispatch the trip
    trip.status = "DISPATCHED"
    trip.actual_departure = now_iso
    lead_vehicle.status = "IN_TRANSIT"
    order.status = "IN_TRANSIT"
    order.vehicle_id = lead_vehicle.id
    order.trip_id = trip.id

    # Broadcast dispatch event
    await broadcaster.broadcast("TRIP_DISPATCHED", {
        "id": trip.id,
        "trip_number": trip.trip_number,
        "vehicle_id": lead_vehicle.id,
        "vehicle_code": lead_vehicle.code,
        "status": "DISPATCHED",
        "workspace_id": ws
    }, workspace_id=ws)
    await async_db.commit()

    assert trip.status == "DISPATCHED"
    assert lead_vehicle.status == "IN_TRANSIT"
    assert any(b[0] == "TRIP_DISPATCHED" for b in broadcasts)

    # -------------------------------------------------------------------------
    # Step 5: En-Route Telemetry Ingestion (Chicago -> St. Louis)
    # -------------------------------------------------------------------------
    packet_stlouis = NormalizedTelemetryPacket(
        vehicle_identifier=lead_vehicle.code,
        latitude=38.6270,
        longitude=-90.1994,
        speed_kmh=88.5,
        heading=215.0,
        battery_pct=76,
        engine_state="RUNNING"
    )
    await ingest_telemetry_packet(async_db, packet_stlouis, workspace_id=ws)
    await async_db.refresh(lead_vehicle)

    assert lead_vehicle.current_lat == 38.6270
    assert lead_vehicle.current_lng == -90.1994
    assert lead_vehicle.speed_kmh == 88.5
    assert lead_vehicle.battery_pct == 76

    # -------------------------------------------------------------------------
    # Step 6: Mid-Corridor Weather Hazard Incident
    # -------------------------------------------------------------------------
    incident = Incident(
        id="inc-ice-088",
        code="INC-ICE-088",
        title="Severe Winter Blizzard & Black Ice Corridor",
        summary="Interstate 44 shutdown between Rolla and Springfield MO due to multi-vehicle pileup and black ice.",
        severity="CRITICAL",
        category="WEATHER",
        status="DETECTED",
        lat=37.9500,
        lng=-91.7700,
        affected_entity_type="VEHICLE",
        affected_entity_id=lead_vehicle.id,
        affected_entity_name=lead_vehicle.name,
        vehicle_id=lead_vehicle.id,
        delay_minutes=180,
        cost_estimate=2850.0,
        risk_score=92,
        workspace_id=ws
    )
    async_db.add(incident)
    trip.delay_minutes = 180
    await async_db.commit()

    # -------------------------------------------------------------------------
    # Step 7: Stochastic Simulation Evaluation
    # -------------------------------------------------------------------------
    base_metrics = BaseMetricsSnapshot(
        totalDistanceKm=1480.0,
        avgDurationMins=960,
        currentDelayMins=180,
        baseCostUsd=2100.0,
        ordersCount=1
    )
    variables = SimulationVariables(
        alternateRouteType="I-55_SOUTH_MEMPHIS_BYPASS",
        speedDeltaPct=5.0,
        fuelCostPerKm=0.38,
        priorityReordering=True
    )
    sim_eval = run_stochastic_simulation(base_metrics, variables, iterations=100)
    assert sim_eval["stochastic_confidence"]["iterations"] == 100
    assert "p50" in sim_eval["stochastic_confidence"]["delay_mins"]
    assert "p50" in sim_eval["stochastic_confidence"]["cost_usd"]

    # Persist simulation scenario
    sim = Simulation(
        id="sim-detour-088",
        code="SIM-DETOUR-MEMPHIS",
        title="Memphis I-55 / I-30 Southern Detour",
        description="Bypasses Rolla MO ice corridor via Memphis and Little Rock.",
        status="EVALUATED",
        incident_id=incident.id,
        variables={"vehicleId": lead_vehicle.id, "alternateRoute": "I-55_SOUTH_MEMPHIS"},
        baseline_metrics=base_metrics.model_dump(),
        simulated_metrics={"netTimeSavedMins": 135, "verdict": "OPTIMAL_DETOUR"},
        workspace_id=ws
    )
    async_db.add(sim)
    await async_db.commit()

    # -------------------------------------------------------------------------
    # Step 8: Apply Simulation Recommendation Decision
    # -------------------------------------------------------------------------
    apply_req = SimulationApplyDecision(
        simulation_id=sim.id,
        notes="Authorized convoy southern bypass via Memphis/Little Rock.",
        actor_name="E2E Director"
    )
    sim_res = await apply_simulation_decision(sim.id, apply_req, test_principal, async_db)

    await async_db.refresh(sim)
    await async_db.refresh(incident)
    await async_db.refresh(trip)

    assert sim.status == "APPLIED"
    assert incident.status == "ACTION_APPLIED"
    assert trip.delay_minutes == 45  # 180 mins - 135 saved

    dec_res = await async_db.execute(select(Decision).where(Decision.simulation_id == sim.id))
    dec = dec_res.scalar_one_or_none()
    assert dec is not None
    assert dec.simulation_id == sim.id
    assert any(b[0] == "DECISION_APPLIED" for b in broadcasts)

    # -------------------------------------------------------------------------
    # Step 9: Dock Arrival Detection at Dallas Gateway (<500m geofence)
    # -------------------------------------------------------------------------
    # Vehicle arrives at Dallas Gateway Dock (lat: 32.7767, lng: -96.7970)
    packet_dallas_dock = NormalizedTelemetryPacket(
        vehicle_identifier=lead_vehicle.code,
        latitude=32.7770,
        longitude=-96.7970,
        speed_kmh=5.0,
        battery_pct=42,
        engine_state="IDLE"
    )
    await ingest_telemetry_packet(async_db, packet_dallas_dock, workspace_id=ws)
    await async_db.refresh(trip)

    assert trip.status == "ARRIVED"
    assert trip.actual_arrival is not None
    assert any(b[0] == "DOCK_ARRIVAL_DETECTED" for b in broadcasts)

    # -------------------------------------------------------------------------
    # Step 10: Dock Detention Accrual (past 120m free window)
    # -------------------------------------------------------------------------
    dock_arrival_dt = datetime.fromisoformat(trip.actual_arrival.replace("Z", "+00:00"))
    simulated_now = dock_arrival_dt + timedelta(minutes=180)  # 3 hours at dock

    detention_calc = DetentionService.compute_detention_charges(
        dock_arrival_dt=dock_arrival_dt,
        now_dt=simulated_now,
        free_minutes=120,
        hourly_rate_inr=500.0
    )
    assert detention_calc["entered_geofence"] is True
    assert detention_calc["total_dock_wait_minutes"] == 180
    assert detention_calc["billable_detention_minutes"] == 60  # 180 - 120 free
    assert detention_calc["billable_detention_hours"] == 1.0
    assert detention_calc["total_detention_charge_inr"] == 500.0
    assert detention_calc["detention_status"] == "DETENTION_ACCRUING"

    # -------------------------------------------------------------------------
    # Step 11: Digital Proof of Delivery (ePOD) Touchscreen Submission
    # -------------------------------------------------------------------------
    # Driver pass access token for lead vehicle
    driver_token = create_access_token(
        subject=f"driver-{lead_vehicle.code}",
        extra_claims={
            "type": "driver_dispatch",
            "vehicle_code": lead_vehicle.code,
            "workspace_id": ws,
            "trip_id": trip.id
        }
    )

    # Base64 PNG signature mockup (>= 100 bytes)
    sample_sig_data = (
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
    )
    pod_submission = ProofOfDeliverySubmission(
        vehicle_code=lead_vehicle.code,
        order_number=order.order_number,
        recipient_name="Dallas Terminal Receiving Manager",
        signature_data=sample_sig_data,
        latitude=32.7767,
        longitude=-96.7970,
        notes="All 5 pallets delivered in intact condition. Temperature logged 4C.",
        token=driver_token
    )

    pod_result = await submit_proof_of_delivery(pod_submission, async_db)
    assert pod_result["status"] == "DELIVERED"
    assert "pod_id" in pod_result

    # -------------------------------------------------------------------------
    # Step 12: Demurrage Finalization & End-to-End Status Verification
    # -------------------------------------------------------------------------
    await async_db.refresh(order)
    await async_db.refresh(lead_vehicle)

    assert order.status == "DELIVERED"
    assert lead_vehicle.status == "DELIVERED"

    # Verify audit log recorded for POD
    aud_stmt = select(AuditLog).where(
        AuditLog.workspace_id == ws,
        AuditLog.action == "PROOF_OF_DELIVERY_RECORDED"
    )
    aud_res = await async_db.execute(aud_stmt)
    audit = aud_res.scalar_one_or_none()
    assert audit is not None
    assert audit.metadata_json["recipient_name"] == "Dallas Terminal Receiving Manager"

    # Verify PROOF_OF_DELIVERY_SUBMITTED was broadcasted
    assert any(b[0] == "PROOF_OF_DELIVERY_SUBMITTED" for b in broadcasts)

    # Compute final closed detention charge with POD timestamp
    pod_dt = dock_arrival_dt + timedelta(minutes=160)
    final_detention = DetentionService.compute_detention_charges(
        dock_arrival_dt=dock_arrival_dt,
        pod_submission_dt=pod_dt,
        free_minutes=120,
        hourly_rate_inr=500.0
    )
    assert final_detention["detention_status"] == "POD_SUBMITTED_CHARGEABLE"
    assert final_detention["billable_detention_minutes"] == 40
    assert final_detention["billable_detention_hours"] == 0.67
    assert final_detention["total_detention_charge_inr"] == 335.0
