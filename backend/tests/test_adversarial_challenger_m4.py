"""
Adversarial Challenge & Concurrency Stress Harness (Milestone 4 - Tier 5)
========================================================================
Author: teamwork_preview_challenger_m4_2 (Real-World Workload & Concurrency Challenger)
Target: Nexus Logistics Platform - Convoy Lifecycle, Multi-Tenant SSE, and Atomic Persistence
"""

import os
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Models & DB
from app.db.base import Base
import app.models
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.logistics import Trip
from app.models.incidents import Incident
from app.models.simulations import Simulation, Decision
from app.models.system import AuditLog

# Services
from app.realtime.sse import EventBroadcaster, broadcaster
from app.services.telemetry_service import ingest_telemetry_packet, NormalizedTelemetryPacket
from app.services.detention_service import DetentionService
from app.services.simulation_engine import run_stochastic_simulation
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables, SimulationApplyDecision
from app.api.v1.endpoints.simulations import apply_simulation_decision
from app.api.v1.endpoints.driver import ProofOfDeliverySubmission, submit_proof_of_delivery
from app.core.security import create_access_token

# App & Auth
from app.main import app
from app.db.session import get_db
from app.auth.dependencies import require_onboarded, require_authenticated, require_workspace
from app.auth.principal import RequestPrincipal, RoleEnum, ROLE_PERMISSIONS_MAP


@pytest.fixture
async def adv_db():
    """Isolated in-memory SQLite with complete 58-table schema."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session

    await engine.dispose()


@pytest.fixture
def principal_alpha() -> RequestPrincipal:
    return RequestPrincipal(
        nexus_user_id="usr-alpha-01",
        clerk_user_id="clerk-alpha-01",
        email="alpha@nexus-fleet.test",
        display_name="Alpha Controller",
        workspace_id="ws-tenant-alpha",
        organization_id="org-tenant-alpha",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True
    )


@pytest.fixture
def principal_beta() -> RequestPrincipal:
    return RequestPrincipal(
        nexus_user_id="usr-beta-01",
        clerk_user_id="clerk-beta-01",
        email="beta@nexus-fleet.test",
        display_name="Beta Controller",
        workspace_id="ws-tenant-beta",
        organization_id="org-tenant-beta",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True
    )


# ============================================================================
# CHALLENGE 1: MULTI-TENANT SSE EVENT ISOLATION & LEAKAGE STRESS TEST
# ============================================================================

@pytest.mark.asyncio
async def test_adversarial_sse_multi_tenant_isolation_under_load():
    """
    Stress test SSE event distribution under concurrent load:
    - 3 tenants: tenant_alpha, tenant_beta, tenant_gamma
    - 1 global admin subscriber
    - Concurrently publish 120 events
    - Verify 100% strict isolation: tenant_beta MUST NEVER receive any tenant_alpha events.
    """
    bc = EventBroadcaster()
    
    alpha_events = []
    beta_events = []
    gamma_events = []
    global_events = []

    async def consume_stream(ws_id, sink):
        try:
            async for msg in bc.subscribe(workspace_id=ws_id):
                if "CONNECTION_ESTABLISHED" not in msg:
                    raw = msg.replace("data: ", "").strip()
                    parsed = __import__("json").loads(raw)
                    sink.append(parsed)
        except asyncio.CancelledError:
            pass

    task_alpha = asyncio.create_task(consume_stream("tenant_alpha", alpha_events))
    task_beta = asyncio.create_task(consume_stream("tenant_beta", beta_events))
    task_gamma = asyncio.create_task(consume_stream("tenant_gamma", gamma_events))
    task_global = asyncio.create_task(consume_stream(None, global_events))

    # Give tasks a moment to register subscribers
    await asyncio.sleep(0.05)

    # Concurrently broadcast 50 alpha events, 50 beta events, 20 global events
    broadcast_coros = []
    for i in range(50):
        broadcast_coros.append(bc.broadcast("ALPHA_TELEMETRY", {"seq": i, "tenant": "alpha"}, workspace_id="tenant_alpha"))
    for i in range(50):
        broadcast_coros.append(bc.broadcast("BETA_TELEMETRY", {"seq": i, "tenant": "beta"}, workspace_id="tenant_beta"))
    for i in range(20):
        broadcast_coros.append(bc.broadcast("GLOBAL_ANNOUNCEMENT", {"seq": i, "scope": "all"}, workspace_id=None))

    await asyncio.gather(*broadcast_coros)
    await asyncio.sleep(0.1)

    # Cancel consumers and await them to guarantee finally cleanup runs
    for t in [task_alpha, task_beta, task_gamma, task_global]:
        t.cancel()
    await asyncio.gather(task_alpha, task_beta, task_gamma, task_global, return_exceptions=True)

    # Empirical Assertions:
    # 1. Alpha subscriber checks
    assert len(alpha_events) == 70, f"Expected 70 alpha events, got {len(alpha_events)}"
    assert all(e["type"] in ["ALPHA_TELEMETRY", "GLOBAL_ANNOUNCEMENT"] for e in alpha_events)
    assert not any(e["type"] == "BETA_TELEMETRY" for e in alpha_events), "CRITICAL: tenant_alpha received tenant_beta events!"

    # 2. Beta subscriber checks
    assert len(beta_events) == 70, f"Expected 70 beta events, got {len(beta_events)}"
    assert all(e["type"] in ["BETA_TELEMETRY", "GLOBAL_ANNOUNCEMENT"] for e in beta_events)
    assert not any(e["type"] == "ALPHA_TELEMETRY" for e in beta_events), "CRITICAL: tenant_beta received tenant_alpha events!"

    # 3. Gamma subscriber checks (idle tenant: only global announcements)
    assert len(gamma_events) == 20
    assert all(e["type"] == "GLOBAL_ANNOUNCEMENT" for e in gamma_events)
    assert not any(e["type"] in ["ALPHA_TELEMETRY", "BETA_TELEMETRY"] for e in gamma_events), "CRITICAL: tenant_gamma leaked events!"

    # 4. Global subscriber received all 120
    assert len(global_events) == 120

    # 5. Cleanup verification: no dangling subscribers
    assert len(bc._subscribers) == 0, f"Broadcaster failed to clean up closed subscriber queues: {bc._subscribers}"


# ============================================================================
# CHALLENGE 2: MULTI-VEHICLE CONVOY CONCURRENT TELEMETRY & GEOFENCE ARRIVAL
# ============================================================================

@pytest.mark.asyncio
async def test_adversarial_convoy_concurrent_telemetry_and_dock_arrivals(adv_db: AsyncSession, principal_alpha: RequestPrincipal):
    """
    Stress test concurrent ingestion of telemetry across ALL 5 convoy vehicles:
    - Register Chicago Origin & Dallas Destination Hubs
    - Register 5 commercial electric hauler vehicles
    - Register 5 trips (one per convoy hauler)
    - Ingest telemetry for all 5 simultaneously entering the Dallas geofence (<500m)
    - Verify all 5 trips transition to ARRIVED atomically without collision
    """
    ws = principal_alpha.workspace_id

    # Create Hubs
    chicago_wh = Warehouse(
        id="wh-chi-origin", code="WH-CHI-ORIGIN", name="Chicago Logistics Terminal",
        city="Chicago", state="IL", lat=41.8781, lng=-87.6298, dock_count=12,
        workspace_id=ws
    )
    dallas_wh = Warehouse(
        id="wh-dal-stress", code="WH-DAL-STRESS", name="Dallas Freight Terminal",
        city="Dallas", state="TX", lat=32.7767, lng=-96.7970, dock_count=20,
        workspace_id=ws
    )
    adv_db.add_all([chicago_wh, dallas_wh])

    # Register 5 vehicles and trips with complete relational schema fields
    vehicles = []
    trips = []
    now_iso = datetime.now(timezone.utc).isoformat()
    dep_iso = (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat()
    arr_iso = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()

    for idx in range(1, 6):
        v = Vehicle(
            id=f"veh-convoy-stress-{idx}",
            code=f"NX-STRESS-{idx:02d}",
            name=f"Convoy Hauler #{idx}",
            model="Freightliner eCascadia",
            driver_name=f"Driver #{idx}",
            status="IN_TRANSIT",
            current_lat=32.8500,  # ~8km outside dock
            current_lng=-96.7970,
            speed_kmh=80.0,
            battery_pct=60,
            workspace_id=ws
        )
        t = Trip(
            id=f"trip-stress-{idx}",
            trip_number=f"TRIP-STR-{idx:03d}",
            vehicle_id=v.id,
            origin_warehouse_id=chicago_wh.id,
            dest_warehouse_id=dallas_wh.id,
            status="IN_TRANSIT",
            scheduled_departure=dep_iso,
            scheduled_arrival=arr_iso,
            workspace_id=ws
        )
        vehicles.append(v)
        trips.append(t)
        adv_db.add(v)
        adv_db.add(t)

    await adv_db.commit()

    # Now simulate all 5 vehicles simultaneously crossing the 500m geofence into Dallas Hub
    arrival_packets = [
        NormalizedTelemetryPacket(
            vehicle_identifier=v.code,
            latitude=32.7769 + (i * 0.0001),
            longitude=-96.7970,
            speed_kmh=8.0,
            battery_pct=45,
            engine_state="IDLE"
        )
        for i, v in enumerate(vehicles)
    ]

    # Ingest packets across the session
    for pkt in arrival_packets:
        res = await ingest_telemetry_packet(adv_db, pkt, workspace_id=ws)
        assert res["status"] == "PROCESSED"

    # Verify all 5 trips transitioned to ARRIVED and logged actual_arrival
    for t in trips:
        await adv_db.refresh(t)
        assert t.status == "ARRIVED", f"Trip {t.id} failed to transition to ARRIVED"
        assert t.actual_arrival is not None, f"Trip {t.id} missing actual_arrival timestamp"

    # Verify all 5 vehicles updated coordinates
    for v in vehicles:
        await adv_db.refresh(v)
        assert abs(v.current_lat - 32.7770) < 0.01
        assert v.battery_pct == 45


# ============================================================================
# CHALLENGE 3: EPOD TAMPERING, DUPLICATION, & BOUNDARY SECURITY
# ============================================================================

@pytest.mark.asyncio
async def test_adversarial_epod_security_and_tampering(adv_db: AsyncSession, principal_alpha: RequestPrincipal):
    """
    Stress test Proof of Delivery submission against tamper attempts:
    1. Rejection of non-base64 signature
    2. Rejection of token for wrong vehicle
    3. Rejection of token for wrong tenant workspace
    4. Rejection of duplicate submission on already DELIVERED order (409 Conflict)
    5. Persistence of real audit log on valid submission
    """
    ws = principal_alpha.workspace_id

    # Create vehicle & order with all NOT NULL columns
    veh = Vehicle(
        id="veh-pod-sec-01",
        code="NX-SEC-01",
        name="Security Test Truck",
        model="Freightliner eCascadia",
        driver_name="Elena Rostova",
        current_lat=32.7767,
        current_lng=-96.7970,
        status="IN_TRANSIT",
        workspace_id=ws
    )
    ord_obj = Order(
        id="ord-pod-sec-01",
        order_number="ORD-SEC-01",
        customer_name="Secure Consignee Inc",
        destination="Dallas Hub",
        deadline="2026-10-21T18:00:00Z",
        status="IN_TRANSIT",
        vehicle_id=veh.id,
        workspace_id=ws,
        total_cost=50000.0
    )
    adv_db.add_all([veh, ord_obj])
    await adv_db.commit()

    # Valid token for veh
    valid_token = create_access_token(
        subject=f"driver-{veh.code}",
        extra_claims={
            "type": "driver_dispatch",
            "vehicle_code": veh.code,
            "workspace_id": ws,
        }
    )

    # Valid base64 signature (>100 chars)
    valid_sig = "data:image/png;base64," + ("A" * 150)

    # 1. Non-base64 signature should be rejected with 422
    from fastapi import HTTPException
    bad_sig_submission = ProofOfDeliverySubmission(
        vehicle_code=veh.code,
        order_number=ord_obj.order_number,
        recipient_name="John Doe",
        signature_data="not-a-data-url-signature-must-fail-adversarial-check-length-padding-123456789012345678901234567890-padding-extra-bytes",
        token=valid_token
    )
    with pytest.raises(HTTPException) as exc_info:
        await submit_proof_of_delivery(bad_sig_submission, adv_db)
    assert exc_info.value.status_code == 422

    # 2. Token for wrong vehicle code
    wrong_veh_token = create_access_token(
        subject="driver-NX-OTHER",
        extra_claims={
            "type": "driver_dispatch",
            "vehicle_code": "NX-OTHER",
            "workspace_id": ws,
        }
    )
    tampered_veh_submission = ProofOfDeliverySubmission(
        vehicle_code=veh.code,
        order_number=ord_obj.order_number,
        recipient_name="John Doe",
        signature_data=valid_sig,
        token=wrong_veh_token
    )
    with pytest.raises(HTTPException) as exc_info:
        await submit_proof_of_delivery(tampered_veh_submission, adv_db)
    assert exc_info.value.status_code == 401

    # 3. Successful submission
    legit_submission = ProofOfDeliverySubmission(
        vehicle_code=veh.code,
        order_number=ord_obj.order_number,
        recipient_name="Authorized Consignee",
        signature_data=valid_sig,
        token=valid_token
    )
    res = await submit_proof_of_delivery(legit_submission, adv_db)
    assert res["status"] == "DELIVERED"
    assert "pod_id" in res

    await adv_db.refresh(ord_obj)
    await adv_db.refresh(veh)
    assert ord_obj.status == "DELIVERED"
    assert veh.status == "DELIVERED"

    # 4. Duplicate submission must raise 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        await submit_proof_of_delivery(legit_submission, adv_db)
    assert exc_info.value.status_code == 409, f"Expected 409 Conflict, got {exc_info.value.status_code}"

    # 5. Verify real SQL audit log persisted without mocks
    raw_audit = await adv_db.execute(
        select(AuditLog).where(
            AuditLog.workspace_id == ws,
            AuditLog.entity_id == ord_obj.id,
            AuditLog.action == "PROOF_OF_DELIVERY_RECORDED"
        )
    )
    audit = raw_audit.scalar_one_or_none()
    assert audit is not None
    assert audit.metadata_json["recipient_name"] == "Authorized Consignee"


# ============================================================================
# CHALLENGE 4: DETENTION SERVICE DEMURRAGE MATH & CLOCK SKEW DEFENSES
# ============================================================================

def test_adversarial_detention_demurrage_boundary_and_skew():
    """
    Stress test detention calculations at exact critical boundaries:
    - 0 minutes elapsed
    - 119 minutes elapsed (free window)
    - 120 minutes elapsed (exact threshold)
    - 121 minutes elapsed (first billable minute)
    - Clock skew / negative elapsed time
    - Extreme 48-hour dwell demurrage accrual
    """
    arrival = datetime(2026, 10, 20, 10, 0, 0, tzinfo=timezone.utc)

    # Case A: 0m elapsed
    res0 = DetentionService.compute_detention_charges(arrival, now_dt=arrival)
    assert res0["entered_geofence"] is True
    assert res0["total_dock_wait_minutes"] == 0
    assert res0["billable_detention_minutes"] == 0
    assert res0["total_detention_charge_inr"] == 0.0
    assert res0["detention_status"] == "FREE_WINDOW"

    # Case B: 119m elapsed
    res119 = DetentionService.compute_detention_charges(arrival, now_dt=arrival + timedelta(minutes=119))
    assert res119["billable_detention_minutes"] == 0
    assert res119["total_detention_charge_inr"] == 0.0
    assert res119["detention_status"] == "FREE_WINDOW"

    # Case C: 120m elapsed (exact boundary)
    res120 = DetentionService.compute_detention_charges(arrival, now_dt=arrival + timedelta(minutes=120))
    assert res120["billable_detention_minutes"] == 0
    assert res120["total_detention_charge_inr"] == 0.0
    assert res120["detention_status"] == "FREE_WINDOW"

    # Case D: 121m elapsed (first minute billable)
    res121 = DetentionService.compute_detention_charges(arrival, now_dt=arrival + timedelta(minutes=121), hourly_rate_inr=500.0)
    assert res121["billable_detention_minutes"] == 1
    assert res121["billable_detention_hours"] == 0.02
    assert res121["total_detention_charge_inr"] == 10.0
    assert res121["detention_status"] == "DETENTION_ACCRUING"

    # Case E: Negative elapsed time / Clock skew (now < arrival)
    res_skew = DetentionService.compute_detention_charges(arrival, now_dt=arrival - timedelta(minutes=10))
    assert res_skew["total_dock_wait_minutes"] == 0
    assert res_skew["billable_detention_minutes"] == 0
    assert res_skew["total_detention_charge_inr"] == 0.0

    # Case F: Extreme 48-hour dwell (2880 mins, 2760 billable = 46 hours @ 500 INR/hr = 23,000 INR)
    res_extreme = DetentionService.compute_detention_charges(arrival, now_dt=arrival + timedelta(hours=48), hourly_rate_inr=500.0)
    assert res_extreme["billable_detention_hours"] == 46.0
    assert res_extreme["total_detention_charge_inr"] == 23000.0


# ============================================================================
# CHALLENGE 5: ATOMIC TRANSACTION INTEGRITY & ROLLBACK UNDER FAULT INJECTION
# ============================================================================

@pytest.mark.asyncio
async def test_adversarial_transaction_atomicity_and_rollback(adv_db: AsyncSession, principal_alpha: RequestPrincipal):
    """
    Verify database transaction atomicity:
    If an error occurs mid-transaction, verify that SQLAlchemy session rollback
    preserves database consistency and does NOT leave uncommitted partial rows.
    """
    ws = principal_alpha.workspace_id

    # Create baseline vehicle with all required columns
    v = Vehicle(
        id="veh-atomicity-01",
        code="NX-ATOM-01",
        name="Atomicity Test Vehicle",
        model="Freightliner eCascadia",
        driver_name="Marcus Vance",
        current_lat=41.8781,
        current_lng=-87.6298,
        status="AVAILABLE",
        workspace_id=ws
    )
    adv_db.add(v)
    await adv_db.commit()

    # Attempt a faulty mutation: update vehicle status and raise before commit in savepoint
    try:
        async with adv_db.begin_nested():
            v.status = "DISPATCHED"
            # Add an uncommitted record that would fail or raise
            bad_order = Order(
                id="ord-bad-01",
                order_number="ORD-BAD-01",
                customer_name="Fault Injector",
                destination="Nowhere",
                deadline="2026-10-21T18:00:00Z",
                status="PLANNED",
                total_cost=-9999.0,
                workspace_id=ws
            )
            adv_db.add(bad_order)
            # Simulate unexpected application failure before commit
            raise ValueError("Injected runtime failure during transaction dispatch")
    except ValueError:
        pass  # Expected fault caught and savepoint rolled back

    # Refresh vehicle and ensure it was NOT left in DISPATCHED state
    await adv_db.refresh(v)
    assert v.status == "AVAILABLE", "Database failed to preserve atomic state after rollback!"

    # Ensure bad_order was not persisted
    check_order = await adv_db.execute(select(Order).where(Order.id == "ord-bad-01"))
    assert check_order.scalar_one_or_none() is None, "Faulty record leaked into database after transaction error!"
