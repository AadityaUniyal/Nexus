from typing import Dict, Any
from app.services.telemetry_service import NormalizedTelemetryPacket

class TelemetryAdapter:
    @staticmethod
    def from_samsara(payload: Dict[str, Any]) -> NormalizedTelemetryPacket:
        """
        Normalize Samsara telematics payload (GPS + Engine state).
        """
        vehicle_id = str(payload.get("vehicleId") or payload.get("id") or "SAMSARA-UNKNOWN")
        location = payload.get("location", {})
        coords = location.get("coords", {})
        lat = coords.get("latitude") or payload.get("latitude") or 41.8781
        lng = coords.get("longitude") or payload.get("longitude") or -87.6298
        speed = payload.get("speedMilesPerHour", 0.0) * 1.60934  # convert mph to km/h
        fuel = payload.get("fuelPercent") or payload.get("batteryLevelPct")
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=vehicle_id,
            timestamp=payload.get("time") or payload.get("timestamp") or "",
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
        device_id = str(device.get("id") or payload.get("deviceId") or "GEOTAB-UNKNOWN")
        lat = payload.get("latitude", 41.8781)
        lng = payload.get("longitude", -87.6298)
        speed = payload.get("speed", 0.0)
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=device_id,
            timestamp=payload.get("dateTime") or "",
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
        device_id = str(payload.get("deviceId") or payload.get("unitId") or "IOT-DEVICE")
        telemetry = payload.get("telemetry", payload)
        
        return NormalizedTelemetryPacket(
            vehicle_identifier=device_id,
            timestamp=payload.get("enqueuedTime") or payload.get("timestamp") or "",
            latitude=float(telemetry.get("lat") or telemetry.get("latitude") or 41.8781),
            longitude=float(telemetry.get("lng") or telemetry.get("longitude") or -87.6298),
            speed_kmh=float(telemetry.get("speed_kmh") or telemetry.get("speed") or 0.0),
            heading=float(telemetry.get("heading") or 0.0),
            battery_pct=int(telemetry.get("battery_pct") or telemetry.get("battery") or 100),
            temperature_celsius=telemetry.get("temperature"),
            engine_state=str(telemetry.get("engine_state") or "RUNNING"),
            source_provider="AZURE_IOT",
            raw_payload=payload
        )
