from typing import Dict, Any
from pydantic import ValidationError
from app.services.telemetry_service import NormalizedTelemetryPacket

class TelemetryAdapter:
    @staticmethod
    def from_samsara(payload: Dict[str, Any]) -> NormalizedTelemetryPacket:
        """
        Normalize Samsara telematics payload (GPS + Engine state).
        """
        vehicle_id = payload.get("vehicleId") or payload.get("id")
        if not vehicle_id:
            raise ValueError("Samsara telemetry must include a vehicleId or id.")
        location = payload.get("location", {})
        coords = location.get("coords", {})
        lat = coords.get("latitude", payload.get("latitude"))
        lng = coords.get("longitude", payload.get("longitude"))
        if lat is None or lng is None:
            raise ValueError("Samsara telemetry must include GPS coordinates.")
        speed = float(payload.get("speedMilesPerHour") or 0.0) * 1.60934
        fuel = payload.get("fuelPercent", payload.get("batteryLevelPct"))
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=vehicle_id,
            **({"timestamp": payload.get("time") or payload.get("timestamp")} if payload.get("time") or payload.get("timestamp") else {}),
            latitude=float(lat),
            longitude=float(lng),
            speed_kmh=round(speed, 1),
            heading=float(payload.get("headingDegrees", 0.0)),
            battery_pct=int(fuel) if fuel is not None else None,
            engine_state="RUNNING" if speed > 0 else "IDLE",
            source_provider="SAMSARA",
            raw_payload=payload
        )

    @staticmethod
    def from_geotab(payload: Dict[str, Any]) -> NormalizedTelemetryPacket:
        """
        Normalize Geotab LogRecord payload.
        """
        device = payload.get("device", {})
        device_id = device.get("id") or payload.get("deviceId")
        if not device_id:
            raise ValueError("Geotab telemetry must include a device id.")
        lat = payload.get("latitude")
        lng = payload.get("longitude")
        if lat is None or lng is None:
            raise ValueError("Geotab telemetry must include GPS coordinates.")
        speed = payload.get("speed", 0.0)
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=device_id,
            **({"timestamp": payload.get("dateTime")} if payload.get("dateTime") else {}),
            latitude=float(lat),
            longitude=float(lng),
            speed_kmh=float(speed),
            heading=float(payload.get("bearing", 0.0)),
            battery_pct=payload.get("stateOfCharge"),
            engine_state="RUNNING" if speed > 0 else "OFF",
            source_provider="GEOTAB",
            raw_payload=payload
        )

    @staticmethod
    def from_azure_iot(payload: Dict[str, Any]) -> NormalizedTelemetryPacket:
        """
        Normalize Azure IoT Hub device telemetry message.
        """
        device_id = payload.get("deviceId") or payload.get("unitId")
        if not device_id:
            raise ValueError("Azure IoT telemetry must include a device identity.")
        telemetry = payload.get("telemetry", payload)
        lat = telemetry.get("lat", telemetry.get("latitude"))
        lng = telemetry.get("lng", telemetry.get("longitude"))
        if lat is None or lng is None:
            raise ValueError("Azure IoT telemetry must include lat/lng coordinates.")
        speed = telemetry.get("speed_kmh", telemetry.get("speed", 0.0))
        battery = telemetry.get("battery_pct", telemetry.get("battery"))
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=device_id,
            **({"timestamp": payload.get("enqueuedTime") or payload.get("timestamp")} if payload.get("enqueuedTime") or payload.get("timestamp") else {}),
            latitude=float(lat),
            longitude=float(lng),
            speed_kmh=float(speed or 0.0),
            heading=float(telemetry.get("heading") or 0.0),
            battery_pct=int(battery) if battery is not None else None,
            temperature_celsius=telemetry.get("temperature"),
            engine_state=str(telemetry.get("engine_state") or "RUNNING"),
            source_provider="AZURE_IOT",
            raw_payload=payload
        )
