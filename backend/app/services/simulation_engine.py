import math
from typing import Dict, Any, List
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables, SimulatedMetricsOutput

def _normal_cdf(x: float, mean: float, std_dev: float) -> float:
    """Standard normal cumulative distribution function (CDF)."""
    if std_dev <= 0:
        return 1.0 if x >= mean else 0.0
    try:
        return 0.5 * (1.0 + math.erf((x - mean) / (std_dev * math.sqrt(2.0))))
    except (ValueError, OverflowError):
        return 0.5

def calculate_environmental_factor(weather: str, traffic_pct: float = 25.0) -> float:
    weather_multipliers = {
        "CLEAR": 1.0,
        "MODERATE_RAIN": 0.88,
        "HEAVY_STORM": 0.65,
        "SEVERE_BLIZZARD": 0.28,
    }
    w_factor = weather_multipliers.get(weather, 0.90)
    traffic_pct_clamped = max(0.0, min(100.0, traffic_pct))
    traffic_impedance = 1.0 - (traffic_pct_clamped / 100.0) * 0.45
    return max(0.15, w_factor * traffic_impedance)

def calculate_energy_dynamics(
    distance_km: float,
    avg_speed_kmh: float,
    payload_kg: float = 16800.0,
    vehicle_type: str = "SEMI_TRUCK"
) -> Dict[str, float]:
    """Calculates aerodynamic drag and rolling resistance work in kWh across vehicle modalities."""
    safe_distance = max(0.1, distance_km)
    safe_speed = max(5.0, avg_speed_kmh)

    # Modality specific drag (Cd), frontal area (A), rolling resistance (Cr), base mass (kg)
    modality_specs = {
        "SEMI_TRUCK": {"c_d": 0.46, "area": 8.8, "c_r": 0.007, "base_mass": 13500.0},
        "VAN": {"c_d": 0.32, "area": 4.2, "c_r": 0.010, "base_mass": 2800.0},
        "EV_DRONE": {"c_d": 0.25, "area": 1.1, "c_r": 0.002, "base_mass": 45.0},
        "FREIGHT_TRAIN": {"c_d": 0.18, "area": 12.5, "c_r": 0.0015, "base_mass": 450000.0},
    }
    spec = modality_specs.get(vehicle_type.upper(), modality_specs["SEMI_TRUCK"])

    total_weight = spec["base_mass"] + max(0.0, payload_kg)
    v_mps = (safe_speed * 1000.0) / 3600.0
    c_d = spec["c_d"]
    frontal_area = spec["area"]
    rho = 1.225
    c_r = spec["c_r"]

    f_aero = 0.5 * rho * c_d * frontal_area * (v_mps ** 2)
    f_roll = c_r * total_weight * 9.81
    total_force = f_aero + f_roll

    work_joules = total_force * (safe_distance * 1000.0)
    propulsion_kwh = work_joules / 3.6e6
    aux_kwh = (4.2 if vehicle_type.upper() == "SEMI_TRUCK" else 1.5) * (safe_distance / safe_speed)
    net_kwh = round(propulsion_kwh + aux_kwh, 1)

    return {
        "energy_kwh": net_kwh,
        "fuel_surcharge": round(net_kwh * 0.18, 2)
    }

def run_deterministic_simulation(
    base: BaseMetricsSnapshot,
    variables: SimulationVariables
) -> SimulatedMetricsOutput:
    """Return an arithmetic or corridor-detour simulation estimate."""
    alt = variables.alternate_route_type
    distance = base.total_distance_km
    delay = base.current_delay_mins
    rec_score = None
    verdict = "ESTIMATE_ONLY"

    if alt == "I-70_SOUTH_DETOUR":
        distance = 1084.5
        delay = max(15, int(base.current_delay_mins * 0.35))
        rec_score = 88.0
        verdict = "HIGHLY_RECOMMENDED"
    elif alt == "US-40_NORTH_DETOUR":
        distance = 1138.0
        delay = max(25, int(base.current_delay_mins * 0.50))
        rec_score = 72.0
        verdict = "FEASIBLE_ALTERNATIVE"
    elif alt == "TRANSFER_TO_RELAY":
        distance = 818.0
        delay = max(10, int(base.current_delay_mins * 0.20))
        rec_score = 92.0
        verdict = "HIGHLY_RECOMMENDED"

    speed_factor = 1.0 + (variables.speed_delta_pct / 100.0)
    duration_mins = round(base.avg_duration_mins / speed_factor)
    total_cost = round(distance * variables.fuel_cost_per_km, 2)
    cost_delta = round(total_cost - base.base_cost_usd, 2)
    time_saved = base.avg_duration_mins - duration_mins + (base.current_delay_mins - delay)

    return SimulatedMetricsOutput(
        totalDistanceKm=distance,
        totalDurationMins=duration_mins,
        projectedDelayMins=delay,
        netTimeSavedMins=max(0, time_saved),
        totalCostUsd=total_cost,
        costDeltaUsd=cost_delta,
        slaBreachRiskPct=12.5 if alt else None,
        ordersAtRisk=1 if alt else None,
        recommendationScore=rec_score,
        verdict=verdict,
        insights=[
            "Duration is recalculated from the saved route duration and the speed adjustment you entered.",
            f"Corridor evaluated: {alt or 'BASELINE_DIRECT'}.",
            "Cost uses the route distance and your fuel or energy cost per kilometre input.",
        ],
    )

def run_stochastic_simulation(
    base: BaseMetricsSnapshot,
    variables: SimulationVariables,
    iterations: int = 500
) -> Dict[str, Any]:
    """
    Monte Carlo stochastic simulation engine.
    Executes N stochastic iterations over normal risk distributions to compute P10, P50, and P90 confidence bounds.
    """
    import random
    det_res = run_deterministic_simulation(base, variables)
    
    delays: List[float] = []
    costs: List[float] = []
    sla_risks: List[float] = []

    base_delay = det_res.projectedDelayMins
    base_cost = det_res.totalCostUsd
    base_sla = det_res.slaBreachRiskPct

    for _ in range(max(50, min(2000, iterations))):
        traffic_var = random.gauss(0.0, 8.5)
        speed_var = random.gauss(0.0, 4.0)
        fuel_var = random.gauss(0.0, 0.03)

        iter_delay = max(0.0, base_delay + traffic_var)
        iter_cost = max(0.0, base_cost * (1.0 + fuel_var + (traffic_var * 0.002)))
        iter_sla = (
            max(1.0, min(99.0, base_sla + (traffic_var * 0.4)))
            if base_sla is not None else None
        )

        delays.append(iter_delay)
        costs.append(iter_cost)
        if iter_sla is not None:
            sla_risks.append(iter_sla)

    delays.sort()
    costs.sort()
    sla_risks.sort()

    n = len(delays)
    p10_idx = int(n * 0.10)
    p50_idx = int(n * 0.50)
    p90_idx = int(n * 0.90)

    return {
        "deterministic": det_res.model_dump(),
        "stochastic_confidence": {
            "iterations": n,
            "delay_mins": {
                "p10": round(delays[p10_idx], 1),
                "p50": round(delays[p50_idx], 1),
                "p90": round(delays[p90_idx], 1),
            },
            "cost_usd": {
                "p10": round(costs[p10_idx], 2),
                "p50": round(costs[p50_idx], 2),
                "p90": round(costs[p90_idx], 2),
            },
            "sla_breach_risk_pct": ({
                "p10": round(sla_risks[p10_idx], 1),
                "p50": round(sla_risks[p50_idx], 1),
                "p90": round(sla_risks[p90_idx], 1),
            } if sla_risks else None),
        }
    }

async def run_stochastic_simulation_async(
    base: BaseMetricsSnapshot,
    variables: SimulationVariables,
    iterations: int = 500
) -> Dict[str, Any]:
    """Non-blocking async wrapper that executes Monte Carlo simulation off-thread."""
    import asyncio
    return await asyncio.to_thread(run_stochastic_simulation, base, variables, iterations)
