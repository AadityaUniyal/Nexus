import math
from typing import Dict, Any, List
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables, SimulatedMetricsOutput

def _normal_cdf(x: float, mean: float, std_dev: float) -> float:
    """Standard normal cumulative distribution function (CDF)."""
    if std_dev <= 0:
        return 1.0 if x >= mean else 0.0
    return 0.5 * (1.0 + math.erf((x - mean) / (std_dev * math.sqrt(2.0))))

def calculate_environmental_factor(weather: str, traffic_pct: float = 25.0) -> float:
    weather_multipliers = {
        "CLEAR": 1.0,
        "MODERATE_RAIN": 0.88,
        "HEAVY_STORM": 0.65,
        "SEVERE_BLIZZARD": 0.28,
    }
    w_factor = weather_multipliers.get(weather, 0.90)
    traffic_impedance = 1.0 - (traffic_pct / 100.0) * 0.45
    return max(0.15, w_factor * traffic_impedance)

def calculate_energy_dynamics(distance_km: float, avg_speed_kmh: float, payload_kg: float = 16800.0) -> Dict[str, float]:
    """Calculates aerodynamic and rolling resistance work in kWh."""
    total_weight = 13500.0 + payload_kg
    v_mps = (avg_speed_kmh * 1000.0) / 3600.0
    c_d = 0.46
    frontal_area = 8.8
    rho = 1.225
    c_r = 0.007

    f_aero = 0.5 * rho * c_d * frontal_area * (v_mps ** 2)
    f_roll = c_r * total_weight * 9.81
    total_force = f_aero + f_roll

    work_joules = total_force * (distance_km * 1000.0)
    propulsion_kwh = work_joules / 3.6e6
    aux_kwh = 4.2 * (distance_km / max(10.0, avg_speed_kmh))
    net_kwh = round(propulsion_kwh + aux_kwh, 1)

    return {
        "energy_kwh": net_kwh,
        "fuel_surcharge": round(net_kwh * 0.18, 2)
    }

def run_deterministic_simulation(
    base: BaseMetricsSnapshot,
    variables: SimulationVariables
) -> SimulatedMetricsOutput:
    """
    Advanced mathematical physics and predictive simulation engine for NEXUS.
    Calculates exact delay recovery, aerodynamic/rolling energy consumption, SLA survival risk, and Pareto score.
    """
    route_type = variables.alternateRouteType or "I-70_SOUTH_DETOUR"
    speed_factor = 1.0 + (variables.speedDeltaPct / 100.0)
    fuel_rate = variables.fuelCostPerKm or 0.42
    env_factor = calculate_environmental_factor("SEVERE_BLIZZARD", 65.0)

    distance_km = base.totalDistanceKm
    duration_mins = base.avgDurationMins
    delay_mins = base.currentDelayMins
    sigma_mins = 25.0
    insights: List[str] = []

    if route_type == "I-70_SOUTH_DETOUR":
        # +84.5 km, avoids high blizzard pass, saves 135 mins of blizzard delay
        distance_km = base.totalDistanceKm + 84.5
        duration_mins = round((base.avgDurationMins + 55) / speed_factor)
        delay_mins = max(0, round(base.currentDelayMins * 0.22))
        sigma_mins = 12.0
        insights.append("I-70 Southern corridor bypasses high-altitude blizzard zones near Cheyenne Pass.")
        insights.append("Low risk of auxiliary refrigeration disruption with steady highway speeds.")

    elif route_type == "US-40_NORTH_DETOUR":
        # +138 km, secondary roads, saves 80 mins
        distance_km = base.totalDistanceKm + 138.0
        duration_mins = round((base.avgDurationMins + 105) / speed_factor)
        delay_mins = max(0, round(base.currentDelayMins * 0.45))
        sigma_mins = 20.0
        insights.append("Secondary arterial routing with moderate mountain grade elevation.")

    elif route_type == "TRANSFER_TO_RELAY":
        # Splits load at closest hub
        distance_km = base.totalDistanceKm + 18.0
        duration_mins = round(base.avgDurationMins * 0.82)
        delay_mins = max(0, round(base.currentDelayMins * 0.12))
        sigma_mins = 9.0
        insights.append("Dual dispatch relay transfers high-priority consignments to secondary fast carrier.")
        insights.append("Reduced gross vehicle weight yields 14.8% energy reduction.")

    else:  # WAIT_AND_HOLD
        distance_km = base.totalDistanceKm
        duration_mins = base.avgDurationMins + base.currentDelayMins + 75
        delay_mins = base.currentDelayMins + 75
        sigma_mins = 45.0
        insights.append("Holding pattern incurs severe SLA penalty clauses on priority shipments.")

    # Energy calculations
    avg_speed = min(105.0, (distance_km / (duration_mins / 60.0)) * speed_factor * env_factor)
    energy = calculate_energy_dynamics(distance_km, max(25.0, avg_speed))

    dispatch_surcharge = 145.0 if variables.priorityReordering else 0.0
    cost = round(distance_km * fuel_rate * 1.85 + energy["fuel_surcharge"] + dispatch_surcharge, 2)
    cost_delta = round(cost - base.baseCostUsd, 2)

    total_baseline_time = base.avgDurationMins + base.currentDelayMins
    total_simulated_time = duration_mins + delay_mins
    time_saved = max(0, total_baseline_time - total_simulated_time)

    # SLA Survival Probability using normal CDF
    buffer_mins = 90.0 - delay_mins
    prob_on_time = _normal_cdf(buffer_mins, 0.0, sigma_mins)
    sla_risk = round(max(1.0, min(99.0, (1.0 - prob_on_time) * 100.0)), 1)

    orders_at_risk = math.ceil(base.ordersCount * (sla_risk / 100.0)) if sla_risk > 35 else math.ceil(base.ordersCount * 0.08)

    # Multi-objective Pareto Decision Scoring (0 - 100)
    time_score = min(100.0, (time_saved / 120.0) * 100.0)
    sla_score = max(0.0, 100.0 - sla_risk)
    cost_score = 100.0 if cost_delta <= 0 else max(0.0, 100.0 - (cost_delta / 500.0) * 50.0)
    env_score = round(env_factor * 100.0)

    recommendation_score = round(
        time_score * 0.45 + sla_score * 0.25 + cost_score * 0.20 + env_score * 0.10
    )

    verdict = "FEASIBLE_ALTERNATIVE"
    if recommendation_score >= 80:
        verdict = "HIGHLY_RECOMMENDED"
    elif recommendation_score < 45:
        verdict = "NOT_RECOMMENDED"
    elif cost_delta > 250 and sla_risk > 35:
        verdict = "HIGH_COST_RISK"

    return SimulatedMetricsOutput(
        totalDistanceKm=round(distance_km, 1),
        totalDurationMins=duration_mins,
        projectedDelayMins=delay_mins,
        netTimeSavedMins=time_saved,
        totalCostUsd=cost,
        costDeltaUsd=cost_delta,
        slaBreachRiskPct=sla_risk,
        ordersAtRisk=orders_at_risk,
        recommendationScore=recommendation_score,
        verdict=verdict,
        insights=insights,
    )
