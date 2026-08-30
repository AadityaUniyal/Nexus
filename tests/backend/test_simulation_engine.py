import pytest
from app.services.simulation_engine import run_deterministic_simulation
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables

def test_deterministic_simulation_i70_detour():
    """Verify that I-70 detour recovers expected delay with predictable cost delta."""
    base = BaseMetricsSnapshot(
        totalDistanceKm=1620.0,
        avgDurationMins=940,
        currentDelayMins=180,
        ordersCount=14,
        totalOrderValue=45000.0,
        baseCostUsd=1450.0,
    )
    vars = SimulationVariables(
        vehicleId="v-104",
        alternateRouteType="I-70_SOUTH_DETOUR",
        speedDeltaPct=10.0,
        fuelCostPerKm=0.42,
        priorityReordering=True,
    )

    result = run_deterministic_simulation(base, vars)

    assert result.netTimeSavedMins >= 100, "Should recover at least 100 minutes"
    assert result.totalDistanceKm >= 1700.0, "Should add approx 85 km for I-70 detour"
    assert result.costDeltaUsd > 0.0, "Should have positive incremental cost"
    assert result.slaBreachRiskPct <= 20.0, "SLA risk should drop significantly"
    assert result.recommendationScore >= 80, "Should be highly recommended"
    assert result.verdict == "HIGHLY_RECOMMENDED"

def test_deterministic_simulation_wait_and_hold():
    """Verify that holding pattern has low recommendation score and high SLA risk."""
    base = BaseMetricsSnapshot(
        totalDistanceKm=1620.0,
        avgDurationMins=940,
        currentDelayMins=180,
        ordersCount=14,
        totalOrderValue=45000.0,
        baseCostUsd=1450.0,
    )
    vars = SimulationVariables(
        vehicleId="v-104",
        alternateRouteType="WAIT_AND_HOLD",
        speedDeltaPct=0.0,
        fuelCostPerKm=0.42,
        priorityReordering=False,
    )

    result = run_deterministic_simulation(base, vars)

    assert result.netTimeSavedMins == 0, "Holding pattern recovers 0 minutes"
    assert result.slaBreachRiskPct >= 70.0, "SLA risk should remain high"
    assert result.verdict in ["MARGINAL_BENEFIT", "NOT_RECOMMENDED"]
