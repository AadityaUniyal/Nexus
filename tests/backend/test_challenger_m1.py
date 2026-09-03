import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy import text, select
from app.integrations.location.schemas import Coordinate, RouteMatrixResult, MatrixCell
from app.services.location_service import LocationService, _MEMORY_CACHE, _METRICS
from app.core.errors import NexusException
from app.api.v1.endpoints.admin import get_system_health
from app.core.config import settings
from app.schemas.simulations import (
    BaseMetricsSnapshot,
    SimulationVariables,
    SimulatedMetricsOutput,
    SimulationCreate,
    SimulationRead,
    SimulationApplyDecision,
)
from app.services.simulation_engine import run_deterministic_simulation
from app.api.v1.endpoints.simulations import create_simulation, apply_simulation_decision
from app.models.operations import Vehicle, Route, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation
from app.voice.tools import execute_voice_tool


# =========================================================================
# FEATURE 2: DETERMINISTIC SHA-256 ROUTE MATRIX CACHING (RULE 0)
# =========================================================================

@pytest.mark.asyncio
async def test_route_matrix_cache_key_permutation_invariance():
    """
    Verify that identical coordinate sets in different permutations produce
    the identical canonical SHA-256 hash and trigger cache hits.
    """
    c1 = Coordinate(latitude=40.7128, longitude=-74.0060, id="loc-nyc")
    c2 = Coordinate(latitude=41.8781, longitude=-87.6298, id="loc-chi")
    c3 = Coordinate(latitude=39.7392, longitude=-104.9903, id="loc-den")

    t1 = Coordinate(latitude=34.0522, longitude=-118.2437, id="loc-lax")
    t2 = Coordinate(latitude=37.7749, longitude=-122.4194, id="loc-sfo")

    # Order 1: [c1, c2, c3] -> [t1, t2]
    # Order 2: [c3, c1, c2] -> [t2, t1] (permuted)
    sources_1 = [c1, c2, c3]
    targets_1 = [t1, t2]

    sources_2 = [c3, c1, c2]
    targets_2 = [t2, t1]

    options_1 = {"avoid": "tolls", "profile": "truck", "units": "metric"}
    options_2 = {"units": "metric", "avoid": "tolls", "profile": "truck"}  # key permuted

    # Execute first call
    res_1 = await LocationService.calculate_route_matrix(sources_1, targets_1, mode="drive", options=options_1)
    assert res_1 is not None
    assert res_1.sources_count == 3
    assert res_1.targets_count == 2

    initial_hits = _METRICS["cache_hits"]

    # Execute second call with permuted sources, targets, and option keys
    res_2 = await LocationService.calculate_route_matrix(sources_2, targets_2, mode="drive", options=options_2)
    assert res_2 is not None

    # Must result in a cache hit
    assert _METRICS["cache_hits"] == initial_hits + 1, "Permuted coordinates and options MUST hit cache"
    assert len(res_2.cells) == len(res_1.cells)


@pytest.mark.asyncio
async def test_route_matrix_cache_key_differentiation_on_options():
    """
    Verify that varying options or routing modes produce distinct cache keys and cache misses.
    """
    c1 = Coordinate(latitude=40.7128, longitude=-74.0060, id="loc-nyc")
    t1 = Coordinate(latitude=34.0522, longitude=-118.2437, id="loc-lax")

    # Call with options A
    res_a = await LocationService.calculate_route_matrix([c1], [t1], mode="drive", options={"avoid": "tolls"})

    initial_misses = _METRICS["cache_misses"]

    # Call with options B (different option value)
    res_b = await LocationService.calculate_route_matrix([c1], [t1], mode="drive", options={"avoid": "highways"})
    assert _METRICS["cache_misses"] == initial_misses + 1, "Different option values must result in a cache miss"

    # Call with different mode
    initial_misses = _METRICS["cache_misses"]
    res_c = await LocationService.calculate_route_matrix([c1], [t1], mode="bicycle", options={"avoid": "highways"})
    assert _METRICS["cache_misses"] == initial_misses + 1, "Different travel modes must result in a cache miss"


@pytest.mark.asyncio
async def test_route_matrix_dimension_limits():
    """
    Verify that matrix dimension guards reject inputs exceeding 10x10 limit.
    """
    coords_11 = [Coordinate(latitude=40.0 + i * 0.1, longitude=-74.0, id=f"c-{i}") for i in range(11)]
    valid_target = [Coordinate(latitude=34.05, longitude=-118.24, id="t-1")]

    with pytest.raises(NexusException) as exc_info:
        await LocationService.calculate_route_matrix(coords_11, valid_target)
    assert exc_info.value.code == "MATRIX_TOO_LARGE"


# =========================================================================
# FEATURE 3: HEALTH PROBES (REAL SELECT 1 & DEGRADED / DISCONNECTED)
# =========================================================================

@pytest.mark.asyncio
async def test_admin_system_health_live_db_connected():
    """
    Verify get_system_health runs SELECT 1 and returns HEALTHY / CONNECTED when DB is healthy.
    """
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar.return_value = 1
    mock_db.execute.return_value = mock_res

    health = await get_system_health(db=mock_db)

    # Verify query was SELECT 1
    call_args = mock_db.execute.call_args
    assert call_args is not None
    executed_stmt = str(call_args[0][0])
    assert "SELECT 1" in executed_stmt

    assert health["status"] == "HEALTHY"
    assert health["services"]["database"] == "CONNECTED"
    assert health["services"]["telemetryPipeline"] == "HEALTHY"
    assert health["services"]["sseBroadcaster"] == "ACTIVE"
    assert health["services"]["locationProvider"] == "OPERATIONAL"


@pytest.mark.asyncio
async def test_admin_system_health_db_disconnected_on_exception():
    """
    Verify get_system_health returns DEGRADED / DISCONNECTED on database connection errors.
    """
    mock_db = AsyncMock()
    mock_db.execute.side_effect = ConnectionRefusedError("PostgreSQL pool connection failed")

    health = await get_system_health(db=mock_db)

    assert health["status"] == "DEGRADED"
    assert health["services"]["database"] == "DISCONNECTED"


@pytest.mark.asyncio
async def test_admin_system_health_db_abnormal_scalar():
    """
    Verify get_system_health returns DEGRADED / DISCONNECTED if SELECT 1 returns non-1.
    """
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar.return_value = None  # abnormal response
    mock_db.execute.return_value = mock_res

    health = await get_system_health(db=mock_db)

    assert health["status"] == "DEGRADED"
    assert health["services"]["database"] == "DISCONNECTED"


# =========================================================================
# FEATURE 4: SIMULATION ENGINE BASELINE & METRICS OUTPUT
# =========================================================================

@pytest.mark.asyncio
async def test_simulation_dynamic_baseline_construction():
    """
    Verify POST /api/v1/simulations dynamically fetches target vehicle, route,
    incident, and order metrics rather than hardcoding static numbers.
    """
    # Create fake models
    test_veh = Vehicle(
        id="v-dyn-999",
        code="NX-999",
        name="Volvo VNR Test",
        current_route_id="rt-dyn-999",
        workspace_id="ws-test",
    )
    test_route = Route(
        id="rt-dyn-999",
        code="RT-999",
        name="Denver to Salt Lake",
        distance_km=1840.5,
        avg_duration_mins=1050,
        workspace_id="ws-test",
    )
    test_incident = Incident(
        id="inc-dyn-999",
        code="INC-999",
        title="Blizzard on Pass",
        severity="CRITICAL",
        affected_entity_id="v-dyn-999",
        delay_minutes=240,
        workspace_id="ws-test",
    )
    test_orders = [
        Order(id="ord-1", order_number="ORD-1", vehicle_id="v-dyn-999", total_cost=20000.0, workspace_id="ws-test"),
        Order(id="ord-2", order_number="ORD-2", vehicle_id="v-dyn-999", total_cost=35000.0, workspace_id="ws-test"),
    ]

    mock_db = AsyncMock()

    def mock_execute_side_effect(stmt):
        mock_result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from vehicles" in stmt_str:
            mock_result.scalars.return_value.first.return_value = test_veh
        elif "from routes" in stmt_str:
            mock_result.scalars.return_value.first.return_value = test_route
        elif "from incidents" in stmt_str:
            mock_result.scalars.return_value.first.return_value = test_incident
        elif "from orders" in stmt_str:
            mock_result.scalars.return_value.all.return_value = test_orders
        else:
            mock_result.scalars.return_value.first.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    mock_db.execute.side_effect = mock_execute_side_effect

    req = SimulationCreate(
        title="Dynamic Simulation Test",
        description="Verifying dynamic baseline resolution from DB entities",
        incidentId="inc-dyn-999",
        variables=SimulationVariables(
            vehicleId="v-dyn-999",
            alternateRouteType="I-70_SOUTH_DETOUR",
            speedDeltaPct=10.0,
            fuelCostPerKm=0.50,
            priorityReordering=True,
        ),
        workspaceId="ws-test",
    )

    created_sim = await create_simulation(req, db=mock_db)

    # Verify that the baseline metrics match the DB entities, NOT static fixtures!
    assert created_sim.baseline_metrics["totalDistanceKm"] == 1840.5, "Must use route distance 1840.5"
    assert created_sim.baseline_metrics["avgDurationMins"] == 1050, "Must use route duration 1050"
    assert created_sim.baseline_metrics["currentDelayMins"] == 240, "Must use incident delay 240"
    assert created_sim.baseline_metrics["ordersCount"] == 2, "Must use order count 2"
    assert created_sim.baseline_metrics["totalOrderValue"] == 55000.0, "Must sum orders total value (20000+35000)"


def test_simulated_metrics_output_properties():
    """
    Verify SimulatedMetricsOutput properties expose both snake_case and camelCase accessors correctly.
    """
    output = SimulatedMetricsOutput(
        totalDistanceKm=1725.0,
        totalDurationMins=990,
        projectedDelayMins=30,
        netTimeSavedMins=150,
        totalCostUsd=1580.40,
        costDeltaUsd=95.40,
        slaBreachRiskPct=14.5,
        ordersAtRisk=2,
        recommendationScore=92,
        verdict="HIGHLY_RECOMMENDED",
        insights=["Optimal recovery detour"],
    )

    # Test camelCase property getters
    assert output.recommendationScore == 92
    assert output.netTimeSavedMins == 150
    assert output.totalCostUsd == 1580.40
    assert output.costDeltaUsd == 95.40
    assert output.totalDurationMins == 990
    assert output.totalDistanceKm == 1725.0
    assert output.slaBreachRiskPct == 14.5
    assert output.projectedDelayMins == 30
    assert output.ordersAtRisk == 2

    # Test snake_case direct attributes
    assert output.recommendation_score == 92
    assert output.net_time_saved_mins == 150
    assert output.total_cost_usd == 1580.40
    assert output.cost_delta_usd == 95.40


# =========================================================================
# FEATURE 5: VOICE TOOLS (OPERATIONAL PERSISTENCE & CONFIRMATION GUARD)
# =========================================================================

@pytest.mark.asyncio
async def test_voice_tool_operational_overview():
    """Verify get_operational_overview queries database and returns proper metrics."""
    res = await execute_voice_tool("get_operational_overview", {})
    assert res["action"] == "OPERATIONAL_OVERVIEW"
    assert "metrics" in res
    assert "totalVehicles" in res["metrics"]
    assert "activeVehicles" in res["metrics"]
    assert "activeIncidents" in res["metrics"]
    assert len(res["speech"]) > 10


@pytest.mark.asyncio
async def test_voice_tool_active_incidents_filtering():
    """Verify get_active_incidents filters incidents by severity."""
    res_all = await execute_voice_tool("get_active_incidents", {"severity": "ALL"})
    assert res_all["action"] == "ACTIVE_INCIDENTS"
    assert "incidents" in res_all

    res_crit = await execute_voice_tool("get_active_incidents", {"severity": "CRITICAL"})
    assert res_crit["action"] == "ACTIVE_INCIDENTS"
    for inc in res_crit["incidents"]:
        assert inc["severity"] in ["CRITICAL", "HIGH"]


@pytest.mark.asyncio
async def test_voice_tool_run_whatif_simulation_persistence():
    """Verify run_whatif_simulation computes metrics and persists simulation scenario."""
    res = await execute_voice_tool("run_whatif_simulation", {
        "vehicle_code": "NX-104",
        "detour_route": "I-70_SOUTH_DETOUR",
    })
    assert res["action"] == "RUN_SIMULATION"
    assert res["time_saved_mins"] > 0
    assert res["recommendation_score"] >= 50
    assert res["simulation_id"].startswith("sim-")
    assert "simulation_code" in res


@pytest.mark.asyncio
async def test_voice_tool_apply_decision_confirmation_guard():
    """
    Verify apply_decision_with_confirmation requires confirmed=True before modifying live state.
    """
    # When confirmed=False: must require confirmation
    res_unconfirmed = await execute_voice_tool("apply_decision_with_confirmation", {
        "simulation_id": "sim-901",
        "confirmed": False,
    })
    assert res_unconfirmed["action"] == "CONFIRMATION_REQUIRED"
    assert "Confirm" in res_unconfirmed["speech"]

    # When confirmed=True: applies decision
    res_confirmed = await execute_voice_tool("apply_decision_with_confirmation", {
        "simulation_id": "sim-901",
        "confirmed": True,
    })
    assert res_confirmed["action"] == "DECISION_APPLIED"
    assert "applied" in res_confirmed["speech"].lower()
