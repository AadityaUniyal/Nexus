"""
Test suite for NEXUS Machine Learning Engine and API Endpoints.
Verifies delay prediction, telemetry anomaly detection, SLA breach classification, depot throughput forecasting, and Pareto route optimization.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ml_engine import (
    ml_engine,
    DelayPredictionInput,
    AnomalyDetectionInput,
    SLARiskInput
)

client = TestClient(app)

def test_ml_status_endpoint():
    """Verify ML Engine reports READY status and Intel i7 optimization."""
    response = client.get("/api/v1/ml/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "READY"
    assert data["models_loaded"] >= 4
    assert "Intel Core i7" in data["target_hardware"]

def test_ml_predict_delay():
    """Verify predictive delay regressor with weather and modality inputs."""
    payload = {
        "distance_km": 920.0,
        "weather_severity": 0.85,
        "traffic_pct": 55.0,
        "payload_kg": 18500.0,
        "driver_hours_active": 7.0,
        "vehicle_type": "SEMI_TRUCK"
    }
    response = client.post("/api/v1/ml/predict-delay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_delay_mins" in data
    assert data["predicted_delay_mins"] > 0
    assert data["confidence_lower_mins"] <= data["predicted_delay_mins"] <= data["confidence_upper_mins"]
    assert data["risk_level"] in ["NOMINAL", "ELEVATED", "CRITICAL"]

def test_ml_detect_anomalies_normal():
    """Verify nominal cold-chain telemetry passes without anomaly flag."""
    payload = {
        "vehicle_id": "TRK-101",
        "temperature_c": -4.2,
        "battery_pct": 92.0,
        "tire_pressure_psi": 108.0,
        "speed_kmh": 80.0,
        "rpm": 1600.0,
        "fuel_rate_lph": 28.0
    }
    response = client.post("/api/v1/ml/detect-anomalies", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["vehicle_id"] == "TRK-101"
    assert data["severity"] in ["NORMAL", "WARNING"]

def test_ml_detect_anomalies_critical_excursion():
    """Verify temperature excursion and low tire pressure triggers anomaly alert."""
    payload = {
        "vehicle_id": "TRK-EXCURSION-99",
        "temperature_c": 4.5,  # Excursion! Target is -4C
        "battery_pct": 12.0,  # Critical low battery!
        "tire_pressure_psi": 82.0, # Low PSI!
        "speed_kmh": 65.0,
        "rpm": 2200.0,
        "fuel_rate_lph": 48.0
    }
    response = client.post("/api/v1/ml/detect-anomalies", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["severity"] in ["CRITICAL", "WARNING"]
    assert len(data["detected_issues"]) >= 2

def test_ml_sla_risk_evaluation():
    """Verify SLA breach classification and root-cause explainability."""
    payload = {
        "predicted_delay_mins": 140.0,
        "buffer_time_mins": 25.0,
        "sla_penalty_usd": 12500.0,
        "cargo_perishability": 0.95,
        "customer_tier": "TIER_1"
    }
    response = client.post("/api/v1/ml/sla-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "breach_probability_pct" in data
    assert 0.0 <= data["breach_probability_pct"] <= 100.0
    assert "root_cause_attributions_pct" in data
    assert "Delay Magnitude" in data["root_cause_attributions_pct"]
    assert data["recommended_action"] in ["AUTHORIZE_BYPASS_REROUTE", "EXPEDITE_DOCK_PRIORITY", "MAINTAIN_CURRENT_TRAJECTORY"]

def test_ml_depot_forecast():
    """Verify depot parcel processing and dock congestion forecasting."""
    response = client.get("/api/v1/ml/depot-forecast?hour=15&day_of_week=3&active_trucks=35&pending_parcels=6000&weather_severity=0.5")
    assert response.status_code == 200
    data = response.json()
    assert data["forecasted_throughput_parcels_per_hour"] > 0
    assert "dock_utilization_pct" in data
    assert data["bottleneck_risk"] in ["HIGH", "LOW"]

def test_ml_optimize_routes_pareto():
    """Verify Pareto Frontier evaluates multiple candidate bypasses."""
    payload = {
        "candidates": [
            {
                "route_id": "I-80-BASELINE",
                "name": "I-80 Northern Pass (Blizzard Impacted)",
                "duration_mins": 280.0,
                "distance_km": 420.0,
                "fuel_cost_usd": 185.0,
                "sla_risk_pct": 85.0,
                "co2_kg": 240.0
            },
            {
                "route_id": "I-70-BYPASS",
                "name": "I-70 Southern Bypass Corridor",
                "duration_mins": 195.0,
                "distance_km": 485.0,
                "fuel_cost_usd": 210.0,
                "sla_risk_pct": 12.0,
                "co2_kg": 260.0
            }
        ]
    }
    response = client.post("/api/v1/ml/optimize-routes", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["optimal_route"] is not None
    assert data["optimal_route"]["route_id"] == "I-70-BYPASS"
    assert data["optimal_route"]["is_recommended"] is True
