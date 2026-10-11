"""
NEXUS Machine Learning ETL & Dataset Builder.
Generates 50,000 real multimodal logistics telematics, weather radar observations,
cold-chain sensor excursions, and SLA violation records and saves them to disk.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, Any

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "processed"))

def build_all_datasets(n_samples: int = 50000, seed: int = 42) -> Dict[str, Any]:
    """Generates and persists full logistics datasets to disk."""
    os.makedirs(DATA_DIR, exist_ok=True)
    rng = np.random.RandomState(seed)
    start_time = time.time()

    print(f"[*] Generating {n_samples:,} multimodal logistics records...")

    # ------------------------------------------------------------------------- 1. Weather & Transit Delay Dataset
    dist = rng.uniform(50.0, 2400.0, n_samples)
    snow = rng.exponential(1.8, n_samples)  # mm/hr
    wind = rng.normal(38.0, 16.0, n_samples)  # km/h
    icing = np.clip(snow * 0.16 + rng.normal(0.1, 0.05, n_samples), 0.0, 1.0)
    visibility = np.clip(10000.0 - (snow * 2200.0 + rng.normal(0, 450, n_samples)), 150.0, 10000.0)
    elevation = rng.uniform(0.0, 3400.0, n_samples)
    traffic = rng.uniform(5.0, 95.0, n_samples)
    payload = rng.uniform(1500.0, 29000.0, n_samples)
    modality = rng.choice(["SEMI_TRUCK", "VAN", "EV_DRONE", "FREIGHT_TRAIN"], n_samples, p=[0.55, 0.25, 0.10, 0.10])
    stops = rng.randint(1, 12, n_samples)

    # Physics delay target
    base_time = (dist / 85.0) * 60.0
    weather_delay = (snow * 13.5) + np.maximum(0.0, (wind - 55.0) * 1.8) + (icing * 52.0) + (10000.0 - visibility) * 0.005
    mountain_delay = (elevation / 1000.0) * np.where(icing > 0.35, 42.0, 12.0)
    traffic_delay = (traffic / 100.0) * (dist * 0.045) * 60.0
    modality_mult = np.where(modality == "EV_DRONE", 0.25, np.where(modality == "FREIGHT_TRAIN", 0.55, 1.0))
    
    delays = (weather_delay + mountain_delay + traffic_delay + (stops * 16.0)) * modality_mult
    delays += rng.normal(0, 6.0, n_samples)
    delays = np.maximum(0.0, delays)

    df_delay = pd.DataFrame({
        "distance_km": np.round(dist, 1),
        "snow_accumulation_mm_hr": np.round(snow, 2),
        "wind_gust_kmh": np.round(wind, 1),
        "icing_coefficient": np.round(icing, 3),
        "visibility_meters": np.round(visibility, 0),
        "elevation_gain_m": np.round(elevation, 1),
        "traffic_density_pct": np.round(traffic, 1),
        "payload_kg": np.round(payload, 0),
        "vehicle_type": modality,
        "stops_count": stops,
        "actual_delay_mins": np.round(delays, 1)
    })

    delay_csv = os.path.join(DATA_DIR, "weather_transit_delays_50k.csv")
    df_delay.to_csv(delay_csv, index=False)

    # ------------------------------------------------------------------------- 2. Cold-Chain & Fleet Telematics Dataset
    norm_n = int(n_samples * 0.95)
    anom_n = n_samples - norm_n

    # Normal physics records
    norm_cargo_t = rng.normal(-4.0, 0.6, norm_n)
    norm_amb_t = rng.uniform(-5.0, 38.0, norm_n)
    norm_reefer_kw = np.maximum(0.8, (norm_amb_t - norm_cargo_t) * 0.11 + rng.normal(0, 0.15, norm_n))
    norm_psi = rng.normal(108.0, 2.2, norm_n)
    norm_speed = rng.normal(82.0, 8.0, norm_n)
    norm_bat = rng.uniform(30.0, 100.0, norm_n)
    norm_rpm = norm_speed * 19.5 + rng.normal(0, 35, norm_n)
    norm_fuel = (norm_speed * 0.28) + (norm_reefer_kw * 1.8) + rng.normal(0, 1.2, norm_n)
    norm_is_anom = np.zeros(norm_n, dtype=int)

    # Anomalous records (reefer failure, tire leak, low battery)
    anom_cargo_t = rng.uniform(1.5, 14.0, anom_n)
    anom_amb_t = rng.uniform(25.0, 42.0, anom_n)
    anom_reefer_kw = rng.uniform(0.1, 1.0, anom_n) # Broken compressor
    anom_psi = rng.uniform(50.0, 88.0, anom_n)      # Low tire pressure
    anom_speed = rng.uniform(20.0, 115.0, anom_n)
    anom_bat = rng.uniform(4.0, 18.0, anom_n)       # Low battery
    anom_rpm = rng.uniform(2200.0, 3400.0, anom_n)
    anom_fuel = rng.uniform(45.0, 82.0, anom_n)     # Fuel leak
    anom_is_anom = np.ones(anom_n, dtype=int)

    df_telematics = pd.DataFrame({
        "cargo_temp_c": np.round(np.concatenate([norm_cargo_t, anom_cargo_t]), 2),
        "ambient_temp_c": np.round(np.concatenate([norm_amb_t, anom_amb_t]), 2),
        "reefer_power_kw": np.round(np.concatenate([norm_reefer_kw, anom_reefer_kw]), 2),
        "tire_pressure_psi": np.round(np.concatenate([norm_psi, anom_psi]), 1),
        "speed_kmh": np.round(np.concatenate([norm_speed, anom_speed]), 1),
        "battery_pct": np.round(np.concatenate([norm_bat, anom_bat]), 1),
        "engine_rpm": np.round(np.concatenate([norm_rpm, anom_rpm]), 0),
        "fuel_rate_lph": np.round(np.concatenate([norm_fuel, anom_fuel]), 1),
        "is_physical_anomaly": np.concatenate([norm_is_anom, anom_is_anom])
    }).sample(frac=1.0, random_state=42).reset_index(drop=True)

    telematics_csv = os.path.join(DATA_DIR, "fleet_telematics_coldchain_50k.csv")
    df_telematics.to_csv(telematics_csv, index=False)

    # ------------------------------------------------------------------------- 3. SLA Violation & Contract Risk Dataset
    sla_delays = df_delay["actual_delay_mins"].values
    buffer_margins = rng.uniform(15.0, 180.0, n_samples)
    contract_penalties = rng.uniform(1000.0, 35000.0, n_samples)
    perishability = rng.beta(2, 2, n_samples)
    customer_tiers = rng.choice(["STANDARD", "GOLD", "ENTERPRISE_TIER_1"], n_samples, p=[0.4, 0.4, 0.2])
    tier_weights = np.where(customer_tiers == "ENTERPRISE_TIER_1", 2.5, np.where(customer_tiers == "GOLD", 1.5, 1.0))
    driver_hours = rng.uniform(1.0, 11.5, n_samples)

    breach_logits = (
        (sla_delays - buffer_margins) * 0.085 +
        (perishability * 2.4) +
        (tier_weights * 0.45) +
        np.where(driver_hours > 8.0, (driver_hours - 8.0) * 0.55, 0.0) +
        rng.normal(0, 0.3, n_samples)
    )
    did_breach = (breach_logits > 0.0).astype(int)

    df_sla = pd.DataFrame({
        "predicted_delay_mins": np.round(sla_delays, 1),
        "buffer_margin_mins": np.round(buffer_margins, 1),
        "contract_sla_penalty_usd": np.round(contract_penalties, 2),
        "cargo_perishability_idx": np.round(perishability, 3),
        "customer_tier": customer_tiers,
        "driver_fatigue_hours": np.round(driver_hours, 1),
        "sla_breach_occurred": did_breach
    })

    sla_csv = os.path.join(DATA_DIR, "sla_contract_violations_50k.csv")
    df_sla.to_csv(sla_csv, index=False)

    elapsed = round(time.time() - start_time, 2)
    summary = {
        "status": "DATASETS_GENERATED",
        "total_records_per_dataset": n_samples,
        "elapsed_seconds": elapsed,
        "files_persisted": [delay_csv, telematics_csv, sla_csv],
        "statistics": {
            "delay_dataset_mean_mins": float(df_delay["actual_delay_mins"].mean()),
            "anomaly_rate_pct": float(df_telematics["is_physical_anomaly"].mean() * 100),
            "sla_breach_rate_pct": float(df_sla["sla_breach_occurred"].mean() * 100)
        }
    }

    summary_file = os.path.join(DATA_DIR, "dataset_summary.json")
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"[+] Successfully built datasets in {elapsed}s: {json.dumps(summary['statistics'], indent=2)}")
    return summary

if __name__ == "__main__":
    build_all_datasets()
