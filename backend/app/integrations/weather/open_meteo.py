import time
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.resilience import weather_circuit

class OpenMeteoWeatherProvider:
    """
    100% Free & Open Road Weather Provider using Open-Meteo API.
    Zero API keys required. Includes TTL caching to prevent redundant external fetches.
    """

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, timeout_seconds: int = 6):
        self.timeout = timeout_seconds
        self._memory_cache: Dict[str, Dict[str, Any]] = {}

    async def get_point_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current and hourly meteorological data for any coordinate with TTL caching."""
        cache_key = f"weather:{round(latitude, 2)}:{round(longitude, 2)}"
        now = time.time()

        # 1. Check in-memory TTL cache
        if cache_key in self._memory_cache:
            entry = self._memory_cache[cache_key]
            if now - entry["cached_at"] < settings.WEATHER_CACHE_TTL_SECONDS:
                return entry["data"]

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,weather_code",
            "timezone": "auto",
        }

        def _fallback_weather() -> Dict[str, Any]:
            return {
                "latitude": latitude,
                "longitude": longitude,
                "temperature_c": 18.0,
                "wind_speed_kmh": 12.0,
                "wind_gusts_kmh": 18.0,
                "snowfall_cm": 0.0,
                "hazard_level": "NORMAL",
                "hazard_notes": "Estimated baseline conditions (weather circuit active).",
                "provider": "open-meteo-fallback",
            }

        try:
            async def _do_fetch():
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(self.BASE_URL, params=params)
                    if res.status_code >= 400 or res.status_code != 200:
                        raise RuntimeError(f"Open-Meteo HTTP {res.status_code}")
                    data = res.json()
                    curr = data.get("current", {})
                    required = ("wind_speed_10m", "wind_gusts_10m", "snowfall", "temperature_2m")
                    if any(curr.get(key) is None for key in required):
                        raise ValueError("Weather provider returned an incomplete current observation")
                    wind_speed = curr["wind_speed_10m"]
                    wind_gusts = curr["wind_gusts_10m"]
                    snowfall = curr["snowfall"]
                    temp = curr["temperature_2m"]

                    # Assess highway hazard level
                    hazard_level = "NORMAL"
                    hazard_notes = "Corridor conditions clear."

                    if snowfall > 2.0 or (temp < 0 and snowfall > 0.5):
                        hazard_level = "CRITICAL"
                        hazard_notes = f"Active blizzard & road icing detected (Snow: {snowfall} cm/h, Temp: {temp}°C)."
                    elif wind_gusts > 50.0:
                        hazard_level = "WARNING"
                        hazard_notes = f"High crosswind corridor alert (Gusts: {wind_gusts} km/h). High-profile trailer risk."

                    result = {
                        "latitude": latitude,
                        "longitude": longitude,
                        "temperature_c": temp,
                        "wind_speed_kmh": wind_speed,
                        "wind_gusts_kmh": wind_gusts,
                        "snowfall_cm": snowfall,
                        "hazard_level": hazard_level,
                        "hazard_notes": hazard_notes,
                        "provider": "open-meteo",
                    }

                    # Store in memory cache
                    self._memory_cache[cache_key] = {"data": result, "cached_at": now}
                    return result

            return await weather_circuit.call(_do_fetch, fallback_func=_fallback_weather)
        except Exception:
            return _fallback_weather()

open_meteo_provider = OpenMeteoWeatherProvider()
