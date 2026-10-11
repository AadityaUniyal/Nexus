"""
Machine Learning API Endpoints for NEXUS (4 Core Industry Pillars).

Pillar 1: /api/v1/ml/pinn-state-evaluation (Physics-Informed Neural Network Telematics)
Pillar 2: /api/v1/ml/conformal-delay-prediction (Spatiotemporal Radar & Road Gradient Conformal ETA)
Pillar 3: /api/v1/ml/explainable-sla-risk (Calibrated Classifier + TreeSHAP Dollar Attribution)
Pillar 4: /api/v1/ml/monte-carlo-pareto (10,000 Stochastic Physics Runs & Cryptographic Dispatch)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.ml.engine import nexus_master_ml

router = APIRouter()

# ----------------------------------------------------------------------------- Pillar 1 Schemas
class PINNStateRequest(BaseModel):
    vehicle_id: str = Field(default="TRK-902-COLDCHAIN")
    cargo_temp_c: float = Field(default=-0.8, description="Target -4.0C")
    ambient_temp_c: float = Field(default=28.5, description="Ambient exterior temperature in C")
    reefer_power_kw: float = Field(default=2.4, description="Refrigeration unit power draw in kW")
    speed_kmh: float = Field(default=78.0)
    tire_pressure_psi: float = Field(default=92.0)
    battery_pct: float = Field(default=65.0)
    engine_rpm: float = Field(default=1620.0)
    fuel_or_energy_rate: float = Field(default=29.0)

# ----------------------------------------------------------------------------- Pillar 2 Schemas
class ConformalDelayRequest(BaseModel):
    distance_km: float = Field(default=920.0, ge=1.0)
    snow_accumulation_mm_hr: float = Field(default=3.5, ge=0.0)
    wind_gust_kmh: float = Field(default=68.0, ge=0.0)
    icing_coefficient: float = Field(default=0.75, ge=0.0, le=1.0)
    visibility_meters: float = Field(default=650.0, ge=50.0)
    elevation_gain_m: float = Field(default=1850.0, ge=0.0)
    traffic_density_pct: float = Field(default=55.0, ge=0.0, le=100.0)
    payload_kg: float = Field(default=18500.0, ge=0.0)
    vehicle_type: str = Field(default="SEMI_TRUCK")
    coverage_level: float = Field(default=0.95, ge=0.50, le=0.99)

# ----------------------------------------------------------------------------- Pillar 3 Schemas
class ExplainableSLARequest(BaseModel):
    predicted_delay_mins: float = Field(default=135.0)
    buffer_margin_mins: float = Field(default=30.0)
    contract_sla_penalty_usd: float = Field(default=12500.0)
    cargo_perishability_idx: float = Field(default=0.92, ge=0.0, le=1.0)
    customer_tier_weight: float = Field(default=2.5, description="1.0 Standard, 1.5 Gold, 2.5 Enterprise Tier 1")
    route_complexity_stops: int = Field(default=5, ge=1)
    driver_fatigue_hours: float = Field(default=7.5, ge=0.0)

# ----------------------------------------------------------------------------- Pillar 4 Schemas
class CorridorCandidate(BaseModel):
    id: str
    name: str
    duration_mins: float
    distance_km: float
    cost_usd: float
    sla_risk_pct: float
    co2_kg: float

class MonteCarloParetoRequest(BaseModel):
    origin: str = Field(default="Chicago Depot Hub")
    destination: str = Field(default="Denver Distribution Center")
    base_duration_mins: float = Field(default=940.0)
    base_distance_km: float = Field(default=1620.0)
    weather_severity: float = Field(default=0.78)
    iterations: int = Field(default=10000, le=50000)
    corridors: List[CorridorCandidate]

# ============================================================================= Endpoints

@router.get("/status")
def get_ml_status() -> Dict[str, Any]:
    """Returns technical architecture and hardware acceleration metadata."""
    meta = nexus_master_ml.get_system_metadata()
    return {
        "status": "READY",
        "models_loaded": 4,
        "target_hardware": "Intel Core i7 Optimized (AVX2 & SIMD)",
        **meta
    }

@router.post("/pinn-state-evaluation")
def evaluate_pinn_state(req: PINNStateRequest) -> Dict[str, Any]:
    """Pillar 1: Evaluates vehicle physical state & thermodynamics via PyTorch PINN."""
    return nexus_master_ml.pinn.evaluate_state(
        vehicle_id=req.vehicle_id,
        cargo_temp_c=req.cargo_temp_c,
        ambient_temp_c=req.ambient_temp_c,
        reefer_power_kw=req.reefer_power_kw,
        speed_kmh=req.speed_kmh,
        tire_pressure_psi=req.tire_pressure_psi,
        battery_pct=req.battery_pct,
        engine_rpm=req.engine_rpm,
        fuel_or_energy_rate=req.fuel_or_energy_rate
    )

@router.post("/conformal-delay-prediction")
def predict_conformal_delay(req: ConformalDelayRequest) -> Dict[str, Any]:
    """Pillar 2: Predicts delay with finite-sample conformal prediction bounds and radar inputs."""
    return nexus_master_ml.delay.predict_with_conformal_bounds(
        distance_km=req.distance_km,
        snow_accumulation_mm_hr=req.snow_accumulation_mm_hr,
        wind_gust_kmh=req.wind_gust_kmh,
        icing_coefficient=req.icing_coefficient,
        visibility_meters=req.visibility_meters,
        elevation_gain_m=req.elevation_gain_m,
        traffic_density_pct=req.traffic_density_pct,
        payload_kg=req.payload_kg,
        vehicle_type=req.vehicle_type,
        coverage_level=req.coverage_level
    )

@router.post("/explainable-sla-risk")
def evaluate_explainable_sla(req: ExplainableSLARequest) -> Dict[str, Any]:
    """Pillar 3: Computes calibrated SLA breach probability and exact TreeSHAP dollar attributions."""
    return nexus_master_ml.sla.explain_breach_risk(
        predicted_delay_mins=req.predicted_delay_mins,
        buffer_margin_mins=req.buffer_margin_mins,
        contract_sla_penalty_usd=req.contract_sla_penalty_usd,
        cargo_perishability_idx=req.cargo_perishability_idx,
        customer_tier_weight=req.customer_tier_weight,
        route_complexity_stops=req.route_complexity_stops,
        driver_fatigue_hours=req.driver_fatigue_hours
    )

@router.post("/monte-carlo-pareto")
def run_monte_carlo_pareto(req: MonteCarloParetoRequest) -> Dict[str, Any]:
    """Pillar 4: Runs 10,000 stochastic physics simulations and solves Pareto dispatch policy."""
    sim_stats = nexus_master_ml.monte_carlo.run_stochastic_monte_carlo(
        base_duration_mins=req.base_duration_mins,
        base_distance_km=req.base_distance_km,
        weather_severity=req.weather_severity,
        iterations=req.iterations
    )
    pareto_res = nexus_master_ml.monte_carlo.solve_pareto_dispatch(
        origin=req.origin,
        destination=req.destination,
        corridors=[c.model_dump() for c in req.corridors]
    )
    return {
        "stochastic_monte_carlo_10k": sim_stats,
        "pareto_optimal_dispatch": pareto_res
    }

# ============================================================================= Legacy Compatibility Aliases
from app.services.ml_engine import (
    ml_engine,
    DelayPredictionInput,
    AnomalyDetectionInput,
    SLARiskInput
)

class LegacyDelayRequest(BaseModel):
    distance_km: float = Field(default=850.0, ge=1.0)
    weather_severity: float = Field(default=0.65, ge=0.0, le=1.0)
    traffic_pct: float = Field(default=45.0, ge=0.0, le=100.0)
    payload_kg: float = Field(default=16800.0, ge=0.0)
    driver_hours_active: float = Field(default=5.5, ge=0.0)
    vehicle_type: str = Field(default="SEMI_TRUCK")

class LegacyAnomalyRequest(BaseModel):
    vehicle_id: str = Field(default="TRK-902-BLIZZARD")
    temperature_c: float = Field(default=-0.5)
    battery_pct: float = Field(default=88.0, ge=0.0, le=100.0)
    tire_pressure_psi: float = Field(default=92.0)
    speed_kmh: float = Field(default=74.0)
    rpm: float = Field(default=1650.0)
    fuel_rate_lph: float = Field(default=31.5)

class LegacySLARequest(BaseModel):
    predicted_delay_mins: float = Field(default=115.0)
    buffer_time_mins: float = Field(default=45.0)
    sla_penalty_usd: float = Field(default=4500.0)
    cargo_perishability: float = Field(default=0.85, ge=0.0, le=1.0)
    customer_tier: str = Field(default="TIER_1")

class LegacyOptimizeRequest(BaseModel):
    candidates: List[Dict[str, Any]]

@router.post("/predict-delay")
def legacy_predict_delay(req: LegacyDelayRequest) -> Dict[str, Any]:
    data = DelayPredictionInput(
        distance_km=req.distance_km,
        weather_severity=req.weather_severity,
        traffic_pct=req.traffic_pct,
        payload_kg=req.payload_kg,
        driver_hours_active=req.driver_hours_active,
        vehicle_type=req.vehicle_type
    )
    return ml_engine.predict_delay(data)

@router.post("/detect-anomalies")
def legacy_detect_anomalies(req: LegacyAnomalyRequest) -> Dict[str, Any]:
    data = AnomalyDetectionInput(
        vehicle_id=req.vehicle_id,
        temperature_c=req.temperature_c,
        battery_pct=req.battery_pct,
        tire_pressure_psi=req.tire_pressure_psi,
        speed_kmh=req.speed_kmh,
        rpm=req.rpm,
        fuel_rate_lph=req.fuel_rate_lph
    )
    return ml_engine.detect_telemetry_anomalies(data)

@router.post("/sla-risk")
def legacy_evaluate_sla_risk(req: LegacySLARequest) -> Dict[str, Any]:
    data = SLARiskInput(
        predicted_delay_mins=req.predicted_delay_mins,
        buffer_time_mins=req.buffer_time_mins,
        sla_penalty_usd=req.sla_penalty_usd,
        cargo_perishability=req.cargo_perishability,
        customer_tier=req.customer_tier
    )
    return ml_engine.evaluate_sla_risk(data)

@router.get("/depot-forecast")
def legacy_forecast_depot(
    hour: float = Query(14.0, ge=0, le=24),
    day_of_week: int = Query(2, ge=0, le=6),
    active_trucks: float = Query(24.0, ge=0),
    pending_parcels: float = Query(3500.0, ge=0),
    weather_severity: float = Query(0.3, ge=0, le=1.0)
) -> Dict[str, Any]:
    return ml_engine.forecast_depot_throughput(
        hour=hour,
        day_of_week=day_of_week,
        active_trucks=active_trucks,
        pending_parcels=pending_parcels,
        weather_severity=weather_severity
    )

@router.post("/optimize-routes")
def legacy_optimize_routes(req: LegacyOptimizeRequest) -> Dict[str, Any]:
    return ml_engine.optimize_pareto_routes(req.candidates)
