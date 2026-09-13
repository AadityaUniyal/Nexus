import pytest
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables
from app.services.simulation_engine import (
    _normal_cdf,
    calculate_environmental_factor,
    calculate_energy_dynamics,
    run_deterministic_simulation,
)

def test_normal_cdf_standard_cases():
    assert pytest.approx(_normal_cdf(0.0, 0.0, 1.0), 0.001) == 0.5
    assert _normal_cdf(10.0, 0.0, 0.0) == 1.0
    assert _normal_cdf(-10.0, 0.0, 0.0) == 0.0
    assert _normal_cdf(0.0, 0.0, -5.0) == 1.0

def test_environmental_factor_scaling():
    clear_factor = calculate_environmental_factor("CLEAR", 10.0)
    blizzard_factor = calculate_environmental_factor("SEVERE_BLIZZARD", 90.0)
    assert clear_factor > blizzard_factor
    assert blizzard_factor >= 0.15

def test_energy_dynamics_physics():
    res = calculate_energy_dynamics(100.0, 80.0, 15000.0)
    assert "energy_kwh" in res
    assert "fuel_surcharge" in res
    assert res["energy_kwh"] > 0
    assert res["fuel_surcharge"] > 0

def test_run_deterministic_simulation_i70_south():
    base = BaseMetricsSnapshot(
        totalDistanceKm=1000.0,
        avgDurationMins=600,
        currentDelayMins=120,
        baseCostUsd=1200.0,
        ordersCount=10,
    )
    vars = SimulationVariables(
        alternateRouteType="I-70_SOUTH_DETOUR",
        speedDeltaPct=10.0,
        fuelCostPerKm=0.50,
        priorityReordering=True,
    )
    result = run_deterministic_simulation(base, vars)

    assert result.totalDistanceKm == 1084.5
    assert result.projectedDelayMins < 120
    assert result.recommendationScore >= 0 and result.recommendationScore <= 100
    assert result.verdict in ["HIGHLY_RECOMMENDED", "FEASIBLE_ALTERNATIVE", "NOT_RECOMMENDED", "HIGH_COST_RISK"]

def test_run_deterministic_simulation_us40_north():
    base = BaseMetricsSnapshot(
        totalDistanceKm=1000.0,
        avgDurationMins=600,
        currentDelayMins=120,
        baseCostUsd=1200.0,
        ordersCount=10,
    )
    vars = SimulationVariables(
        alternateRouteType="US-40_NORTH_DETOUR",
        speedDeltaPct=0.0,
        fuelCostPerKm=0.45,
        priorityReordering=False,
    )
    result = run_deterministic_simulation(base, vars)

    assert result.totalDistanceKm == 1138.0
    assert result.projectedDelayMins >= 0

def test_run_deterministic_simulation_relay():
    base = BaseMetricsSnapshot(
        totalDistanceKm=800.0,
        avgDurationMins=480,
        currentDelayMins=90,
        baseCostUsd=1000.0,
        ordersCount=8,
    )
    vars = SimulationVariables(
        alternateRouteType="TRANSFER_TO_RELAY",
        speedDeltaPct=5.0,
        fuelCostPerKm=0.42,
    )
    result = run_deterministic_simulation(base, vars)

    assert result.totalDistanceKm == 818.0
    assert result.netTimeSavedMins >= 0

def test_stochastic_simulation_monte_carlo():
    from app.services.simulation_engine import run_stochastic_simulation
    base = BaseMetricsSnapshot(
        totalDistanceKm=1000.0,
        avgDurationMins=600,
        currentDelayMins=120,
        baseCostUsd=1200.0,
        ordersCount=10,
    )
    vars = SimulationVariables(
        alternateRouteType="I-70_SOUTH_DETOUR",
        speedDeltaPct=10.0,
        fuelCostPerKm=0.50,
        priorityReordering=True,
    )
    res = run_stochastic_simulation(base, vars, iterations=100)

    assert "deterministic" in res
    assert "stochastic_confidence" in res
    confidence = res["stochastic_confidence"]
    assert confidence["iterations"] == 100
    assert "p10" in confidence["delay_mins"]
    assert "p50" in confidence["delay_mins"]
    assert "p90" in confidence["delay_mins"]
    assert confidence["delay_mins"]["p10"] <= confidence["delay_mins"]["p90"]
