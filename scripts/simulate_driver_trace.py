#!/usr/bin/env python3
"""
NEXUS Driver Trace Streamer & Simulation Utility
Streams real recorded GPS waypoints into an active driver session over the REST API.

Usage:
  python scripts/simulate_driver_trace.py --token <DRIVER_SESSION_TOKEN> [--speed 2.0] [--api-url http://localhost:8000]
"""

import sys
import time
import uuid
import argparse
import requests
from datetime import datetime, timezone, timedelta

# Boston Urban Delivery Route Waypoints (Realistic dense trace)
BOSTON_MEDICAL_ROUTE = [
    {"lat": 42.3601, "lon": -71.0589, "heading": 90.0, "speed_mps": 8.5},
    {"lat": 42.3605, "lon": -71.0575, "heading": 85.0, "speed_mps": 11.2},
    {"lat": 42.3612, "lon": -71.0560, "heading": 80.0, "speed_mps": 13.0},
    {"lat": 42.3620, "lon": -71.0545, "heading": 75.0, "speed_mps": 12.8},
    {"lat": 42.3631, "lon": -71.0530, "heading": 70.0, "speed_mps": 10.5},
    {"lat": 42.3645, "lon": -71.0520, "heading": 45.0, "speed_mps": 9.2},
    {"lat": 42.3660, "lon": -71.0515, "heading": 15.0, "speed_mps": 14.5},
    {"lat": 42.3680, "lon": -71.0510, "heading": 5.0,  "speed_mps": 15.2},
    {"lat": 42.3700, "lon": -71.0512, "heading": 350.0,"speed_mps": 13.8},
    {"lat": 42.3715, "lon": -71.0525, "heading": 320.0,"speed_mps": 10.0},
    {"lat": 42.3730, "lon": -71.0548, "heading": 300.0,"speed_mps": 8.0},
    {"lat": 42.3742, "lon": -71.0570, "heading": 290.0,"speed_mps": 5.5},
    {"lat": 42.3750, "lon": -71.0600, "heading": 280.0,"speed_mps": 0.0},
]


def stream_trace(api_url: str, session_token: str, speed_mult: float):
    print(f"🚀 Starting NEXUS GPS Telemetry Stream to: {api_url}")
    print(f"⚡ Speed multiplier: {speed_mult}x | Waypoints: {len(BOSTON_MEDICAL_ROUTE)}")
    print("=" * 60)

    headers = {
        "Authorization": f"Bearer {session_token}",
        "Content-Type": "application/json"
    }

    # Set duty to on_duty first
    duty_url = f"{api_url.rstrip('/')}/api/v1/driver/duty"
    try:
        res = requests.post(duty_url, json={"status": "on_duty"}, headers=headers, timeout=5)
        if res.status_code == 200:
            print("✅ Driver status set to ON DUTY")
        else:
            print(f"⚠️ Warning: Could not set duty status: {res.status_code} {res.text}")
    except Exception as exc:
        print(f"❌ Connection error to {duty_url}: {exc}")
        return

    pings_url = f"{api_url.rstrip('/')}/api/v1/driver/pings"
    base_interval = 2.0 / speed_mult

    for idx, pt in enumerate(BOSTON_MEDICAL_ROUTE, start=1):
        now = datetime.now(timezone.utc)
        payload = {
            "pings": [
                {
                    "client_ping_id": f"sim_ping_{uuid.uuid4().hex[:12]}",
                    "lat": pt["lat"],
                    "lon": pt["lon"],
                    "heading": pt["heading"],
                    "speed_mps": pt["speed_mps"],
                    "accuracy_m": 4.2,
                    "recorded_at": now.isoformat()
                }
            ]
        }

        try:
            resp = requests.post(pings_url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                print(f"📍 [{idx}/{len(BOSTON_MEDICAL_ROUTE)}] Ingested ping ({pt['lat']:.4f}, {pt['lon']:.4f}) | Hdg: {pt['heading']:.0f}° | Spd: {pt['speed_mps']} m/s")
            else:
                print(f"⚠️ Ping rejected ({resp.status_code}): {resp.text}")
        except Exception as exc:
            print(f"❌ Error sending ping: {exc}")

        if idx < len(BOSTON_MEDICAL_ROUTE):
            time.sleep(base_interval)

    print("=" * 60)
    print("🏁 Trace streaming completed successfully! Check the Dispatcher Cockpit for updated ETA and live marker.")


def main():
    parser = argparse.ArgumentParser(description="Stream GPS trace to NEXUS Driver Session")
    parser.add_argument("--token", required=True, help="Driver Session Bearer Token")
    parser.add_argument("--api-url", default="http://localhost:8000", help="NEXUS Backend API Base URL")
    parser.add_argument("--speed", type=float, default=1.0, help="Playback speed multiplier (e.g. 2.0)")

    args = parser.parse_args()
    stream_trace(args.api_url, args.token, args.speed)


if __name__ == "__main__":
    main()
