"""
NEXUS High-Fidelity Logistics Dataset Generator.

Generates realistic multimodal logistics telematics, weather hazards, cold-chain sensor streams,
and SLA violation distributions grounded in transportation physics.
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

class LogisticsDataGenerator:
    """Generates synthetic high-dimensional logistics datasets."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = np.random.RandomState(seed)

    def generate_delay_dataset(self, n_samples: int = 25000) -> Tuple[np.ndarray, np.ndarray, list]:
        """
        Generates feature matrix X and target y for route delay regression.
        Features:
        0: distance_km (50 - 2500 km)
        1: weather_severity (0.0 clear - 1.0 blizzard/hurricane)
        2: traffic_congestion_pct (0 - 100%)
        3: payload_kg (500 - 32,000 kg)
        4: driver_active_hours (0.5 - 12.0 hrs)
        5: elevation_gain_m (0 - 3200 m)
        6: vehicle_modality (0: SEMI, 1: VAN, 2: DRONE, 3: TRAIN)
        7: stops_count (1 - 15 stops)
        """
        dist = self.rng.uniform(50.0, 2200.0, n_samples)
        weather = self.rng.beta(1.5, 3.5, n_samples)  # Skewed towards mild/moderate, with heavy tail
        traffic = self.rng.uniform(5.0, 95.0, n_samples)
        payload = self.rng.uniform(800.0, 28000.0, n_samples)
        driver_hrs = self.rng.uniform(1.0, 11.5, n_samples)
        elevation = self.rng.uniform(0.0, 2800.0, n_samples)
        modality = self.rng.choice([0, 1, 2, 3], n_samples, p=[0.55, 0.25, 0.10, 0.10])
        stops = self.rng.randint(1, 12, n_samples)

        # Non-linear physics interactions
        # 1. Base transit delay from distance & traffic
        base_delay = (dist * 0.035) * (1.0 + (traffic / 100.0) * 0.75)
        
        # 2. Weather multiplier + elevation interaction (mountain pass blizzards cause exponential delay)
        mountain_blizzard_penalty = np.where((elevation > 1500.0) & (weather > 0.6), weather * 110.0, weather * 35.0)
        
        # 3. Driver fatigue penalty (hours-of-service mandatory rest after 8h)
        fatigue_penalty = np.where(driver_hrs > 8.0, (driver_hrs - 8.0) * 35.0 + 45.0, 0.0)
        
        # 4. Modality factor (Drones unaffected by traffic, Trains have fixed schedules)
        modality_factor = np.where(modality == 2, 0.3, np.where(modality == 3, 0.6, 1.0))
        
        # 5. Stops delay
        stops_delay = stops * 18.0

        delay_target = (base_delay + mountain_blizzard_penalty + fatigue_penalty + stops_delay) * modality_factor
        delay_target += self.rng.normal(0, 5.0, n_samples)
        delay_target = np.maximum(0.0, delay_target)

        X = np.column_stack([dist, weather, traffic, payload, driver_hrs, elevation, modality, stops])
        feature_names = [
            "distance_km", "weather_severity", "traffic_congestion_pct",
            "payload_kg", "driver_active_hours", "elevation_gain_m",
            "vehicle_modality", "stops_count"
        ]
        return X, delay_target, feature_names

    def generate_telemetry_stream_dataset(self, n_samples: int = 30000, anomaly_ratio: float = 0.04) -> Tuple[np.ndarray, np.ndarray, list]:
        """
        Generates normal + anomalous real-time IoT fleet telemetry.
        Features:
        0: temperature_c (-4.0C target for cold-chain)
        1: battery_pct (0 - 100%)
        2: tire_pressure_psi (100 - 115 PSI target)
        3: speed_kmh (0 - 120 km/h)
        4: rpm (800 - 2400)
        5: fuel_rate_lph (15 - 45 L/h)
        6: vibration_g (0.05 - 0.40 g)
        """
        n_normal = int(n_samples * (1 - anomaly_ratio))
        n_anom = n_samples - n_normal

        # Normal distributions
        norm_temp = self.rng.normal(-4.0, 0.6, n_normal)
        norm_battery = self.rng.uniform(25.0, 100.0, n_normal)
        norm_psi = self.rng.normal(108.0, 2.5, n_normal)
        norm_speed = self.rng.normal(82.0, 10.0, n_normal)
        norm_rpm = self.rng.normal(1550.0, 120.0, n_normal)
        norm_fuel = self.rng.normal(26.5, 3.5, n_normal)
        norm_vib = self.rng.normal(0.18, 0.04, n_normal)

        X_norm = np.column_stack([norm_temp, norm_battery, norm_psi, norm_speed, norm_rpm, norm_fuel, norm_vib])
        y_norm = np.ones(n_normal, dtype=int)  # 1 for normal

        # Anomalous distributions (Cold-chain excursions, blowouts, fuel drain)
        n_p1 = n_anom // 3
        n_p2 = n_anom // 3
        n_p3 = n_anom - n_p1 - n_p2
        anom_temp = np.concatenate([
            self.rng.uniform(2.0, 12.0, n_p1),
            self.rng.uniform(-18.0, -10.0, n_p2),
            self.rng.normal(-4.0, 0.6, n_p3)
        ])
        anom_battery = self.rng.uniform(2.0, 18.0, n_anom)
        n_psi1 = n_anom // 2
        n_psi2 = n_anom - n_psi1
        anom_psi = np.concatenate([
            self.rng.uniform(40.0, 85.0, n_psi1),
            self.rng.normal(108.0, 2.5, n_psi2)
        ])
        anom_speed = self.rng.uniform(10.0, 130.0, n_anom)
        anom_rpm = self.rng.uniform(2500.0, 3400.0, n_anom)
        anom_fuel = self.rng.uniform(48.0, 85.0, n_anom)
        anom_vib = self.rng.uniform(0.65, 1.80, n_anom)

        X_anom = np.column_stack([anom_temp, anom_battery, anom_psi, anom_speed, anom_rpm, anom_fuel, anom_vib])
        y_anom = -np.ones(n_anom, dtype=int)  # -1 for anomaly in IsolationForest

        X = np.vstack([X_norm, X_anom])
        y = np.concatenate([y_norm, y_anom])

        # Shuffle
        indices = self.rng.permutation(len(X))
        feature_names = [
            "temperature_c", "battery_pct", "tire_pressure_psi",
            "speed_kmh", "rpm", "fuel_rate_lph", "vibration_g"
        ]
        return X[indices], y[indices], feature_names
