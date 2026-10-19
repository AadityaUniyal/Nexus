"""
Test suite for NEXUS Industry-Grade Machine Learning Pillars:
1. Feature 1: Physics-Informed Neural Network (PINN) State Estimator
2. Feature 2: Spatiotemporal Conformal Delay Estimator (Quantile GB + Conformal Bounds)
3. Feature 3: Explainable SLA Breach Risk & TreeSHAP Attribution
4. Feature 4: Stochastic Monte Carlo (10k draws) & Pareto Policy Solver
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml.engine import nexus_master_ml

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth_dependencies():
    from app.auth.dependencies import require_permission, require_onboarded, require_authenticated, require_workspace
    from app.auth.principal import RequestPrincipal, RoleEnum, ROLE_PERMISSIONS_MAP, PermissionEnum
    principal = RequestPrincipal(
        nexus_user_id="usr-test-101",
        clerk_user_id="user_clerk_test_101",
        email="test@nexus.continental",
        display_name="Test Operator",
        workspace_id="ws-continental-fleet-01",
        organization_id="org-continental-logistics",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
        onboarding_completed=True,
        is_active=True
    )
    app.dependency_overrides[require_onboarded] = lambda: principal
    app.dependency_overrides[require_authenticated] = lambda: principal
    app.dependency_overrides[require_workspace] = lambda: principal
    app.dependency_overrides[require_permission(PermissionEnum.MANAGE_SYSTEM)] = lambda: principal
    yield
    app.dependency_overrides.clear()

def test_ml_system_metadata():
    """Verify Master ML Engine returns complete technical specifications for all 4 features."""
    response = client.get("/api/v1/ml/status")
    assert response.status_code == 200
    data = response.json()
    assert "feature_1_pinn_telematics" in data["subsystems"]
    assert "feature_2_conformal_delay" in data["subsystems"]
    assert "feature_3_explainable_sla" in data["subsystems"]
    assert "feature_4_monte_carlo_pareto" in data["subsystems"]

def test_feature_1_pinn_thermodynamics():
    """Verify PyTorch PINN catches cold-chain thermal breach and rolling resistance violations."""
    payload = {
        "vehicle_id": "TRK-COLDCHAIN-404",
        "cargo_temp_c": 3.5,  # Excursion! Target is -4C
        "ambient_temp_c": 32.0,
        "reefer_power_kw": 1.2, # Under-powered!
        "speed_kmh": 82.0,
        "tire_pressure_psi": 86.0, # Low PSI
        "battery_pct": 14.0, # Low battery
        "engine_rpm": 1750.0,
        "fuel_or_energy_rate": 34.0
    }
    response = client.post("/api/v1/ml/pinn-state-evaluation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["reconstruction_loss_mse"] > 0
    assert len(data["latent_state_vector"]) == 4
    assert any(d["subsystem"] == "THERMAL_COLD_CHAIN" for d in data["diagnostics"])
    assert any(d["subsystem"] == "CHASSIS_TIRE_PRESSURE" for d in data["diagnostics"])

def test_feature_2_conformal_prediction_bounds():
    """Verify Conformal Quantile Estimator produces valid finite-sample intervals."""
    payload = {
        "distance_km": 1150.0,
        "snow_accumulation_mm_hr": 4.2,
        "wind_gust_kmh": 75.0,
        "icing_coefficient": 0.85,
        "visibility_meters": 450.0,
        "elevation_gain_m": 2200.0,
        "traffic_density_pct": 65.0,
        "payload_kg": 21000.0,
        "vehicle_type": "SEMI_TRUCK",
        "coverage_level": 0.95
    }
    response = client.post("/api/v1/ml/conformal-delay-prediction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_delay_median_mins" in data
    ci = data["conformal_interval"]
    assert ci["lower_bound_mins"] <= data["predicted_delay_median_mins"] <= ci["upper_bound_mins"]
    assert ci["coverage_level"] == 0.95
    assert data["meteorological_risk"]["icing_severity"] == "SEVERE"
    assert data["recommended_dispatch_status"] == "MANDATORY_CORRIDOR_DETOUR"

def test_feature_3_explainable_sla_treeshap():
    """Verify calibrated probability and exact TreeSHAP dollar attribution."""
    payload = {
        "predicted_delay_mins": 145.0,
        "buffer_margin_mins": 20.0,
        "contract_sla_penalty_usd": 15000.0,
        "cargo_perishability_idx": 0.95,
        "customer_tier_weight": 2.5,
        "route_complexity_stops": 6,
        "driver_fatigue_hours": 8.5
    }
    response = client.post("/api/v1/ml/explainable-sla-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["breach_probability_pct"] > 50.0
    assert data["risk_classification"] == "CRITICAL_LIABILITY"
    assert "shap_attribution_pct" in data
    assert sum(data["shap_attribution_pct"].values()) == pytest.approx(100.0, abs=1.5)
    assert "dollar_weighted_attribution_usd" in data
    assert data["prescriptive_intervention"]["action"] == "EXECUTE_ONE_CLICK_CORRIDOR_REROUTE"
    assert data["prescriptive_intervention"]["projected_savings_usd"] > 0

def test_feature_4_monte_carlo_10k_and_pareto_dispatch():
    """Verify 10,000 stochastic draws, Value-at-Risk, Pareto ranking, and SHA-256 receipt."""
    payload = {
        "origin": "Chicago Fleet Depot",
        "destination": "Salt Lake Logistics Center",
        "base_duration_mins": 960.0,
        "base_distance_km": 1720.0,
        "weather_severity": 0.82,
        "iterations": 10000,
        "corridors": [
            {
                "id": "I-80-NORTH-PASS",
                "name": "I-80 Northern Pass (Blizzard Front Active)",
                "duration_mins": 1280.0,
                "distance_km": 1720.0,
                "cost_usd": 1950.0,
                "sla_risk_pct": 88.0,
                "co2_kg": 640.0
            },
            {
                "id": "I-70-SOUTH-BYPASS",
                "name": "I-70 Southern Bypass Corridor",
                "duration_mins": 1020.0,
                "distance_km": 1840.0,
                "cost_usd": 1820.0,
                "sla_risk_pct": 14.0,
                "co2_kg": 670.0
            }
        ]
    }
    response = client.post("/api/v1/ml/monte-carlo-pareto", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    mc = data["stochastic_monte_carlo_10k"]
    assert mc["iterations"] == 10000
    assert mc["p95_duration_mins"] >= mc["expected_p50_duration_mins"]
    assert len(mc["empirical_cdf_bins"]) == 10

    pareto = data["pareto_optimal_dispatch"]
    assert pareto["optimal_dispatch_corridor"]["id"] == "I-70-SOUTH-BYPASS"
    assert pareto["cryptographic_action_receipt"]["status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    assert len(pareto["cryptographic_action_receipt"]["sha256_hash"]) == 64
