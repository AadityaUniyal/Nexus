import logging
import time
from typing import Dict, Any, Optional, List

logger = logging.getLogger("nexus.iot")


class AzureIoTHubGateway:
    """Unified Telematics and IoT Device Twin Gateway.
    
    Zero-Azure standalone gateway for managing vehicle twins, ingesting live telemetry,
    and dispatching operational vehicle commands.
    """
    def __init__(self):
        self.enabled = True
        self._connected_devices: Dict[str, Dict[str, Any]] = {}

    def is_healthy(self) -> bool:
        return True

    async def register_vehicle_device_twin(self, vehicle_id: str, vehicle_code: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Registers or syncs a commercial vehicle device twin."""
        twin_data = {
            "deviceId": vehicle_code,
            "nexusVehicleId": vehicle_id,
            "status": "CONNECTED",
            "connectionState": "Connected",
            "lastActivityTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "desiredProperties": {
                "telemetryIntervalSeconds": 10,
                "geofenceRadiusKm": 50.0,
            },
            "reportedProperties": {
                "model": metadata.get("model", "Freightliner eCascadia"),
                "batteryCapacityKwh": metadata.get("batteryCapacityKwh", 438),
                "firmwareVersion": "v2.4.12-nexus-iot",
            }
        }
        self._connected_devices[vehicle_code] = twin_data
        logger.info(f"[IoT Gateway] Synced device twin for vehicle {vehicle_code} ({vehicle_id})")
        return twin_data

    async def ingest_telemetry_payload(self, vehicle_code: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Ingests live telemetry packet (GPS, speed, battery, health) from vehicle device."""
        if vehicle_code not in self._connected_devices:
            await self.register_vehicle_device_twin(vehicle_code, vehicle_code, {})

        record = {
            "deviceId": vehicle_code,
            "timestamp": payload.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            "telemetry": {
                "latitude": payload.get("lat"),
                "longitude": payload.get("lng"),
                "speedKmh": payload.get("speedKmh", 0.0),
                "batteryPct": payload.get("batteryPct", 100),
                "healthScore": payload.get("healthScore", 100),
            },
            "ingestLatencyMs": 8,
        }
        logger.debug(f"[IoT Gateway] Ingested telemetry for {vehicle_code}: lat={payload.get('lat')}, lng={payload.get('lng')}")
        return record

    async def send_c2d_command(self, vehicle_code: str, command_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches an operational reroute or hold command to the vehicle."""
        command_id = f"cmd-{int(time.time()*1000)}"
        logger.info(f"[IoT Gateway] Dispatched command '{command_name}' to {vehicle_code} (Command ID: {command_id})")
        return {
            "commandId": command_id,
            "deviceId": vehicle_code,
            "command": command_name,
            "status": "ENQUEUED",
            "enqueuedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "payload": payload,
        }


azure_iot_gateway = AzureIoTHubGateway()
