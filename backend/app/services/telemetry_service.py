import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.operations import Vehicle
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.models.incidents import Incident, IncidentTimeline
from app.realtime.sse import broadcaster

logger = logging.getLogger("nexus.telemetry")

class NormalizedTelemetryPacket(BaseModel):
    vehicle_identifier: str = Field(..., description="Vehicle code or device IMEI")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: float = Field(default=0.0, ge=0.0)
    heading: float = Field(default=0.0, ge=0.0, le=360.0)
    battery_pct: Optional[int] = Field(default=None, ge=0, le=100)
    fuel_pct: Optional[int] = Field(default=None, ge=0, le=100)
    engine_state: str = Field(default="RUNNING")
    temperature_celsius: Optional[float] = Field(default=None)
    external_device_id: Optional[str] = Field(default=None)
    source_provider: str = Field(default="DIRECT_API")
    raw_payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

async def ingest_telemetry_packet(
    db: AsyncSession,
    packet: NormalizedTelemetryPacket,
    workspace_id: str
) -> Dict[str, Any]:
    """
    Process a single normalized telemetry event:
    1. Resolve vehicle in tenant workspace.
    2. Persist TelemetryEvent time-series record.
    3. Update Vehicle operational state and VehicleStatus snapshot.
    4. Run real-time operational risk & incident detection rules.
    5. Broadcast event over real-time SSE channel for live map updates.
    """
    # 1. Resolve vehicle
    stmt = select(Vehicle).where(
        Vehicle.workspace_id == workspace_id,
        or_(
            Vehicle.code == packet.vehicle_identifier,
            Vehicle.id == packet.vehicle_identifier,
            Vehicle.name == packet.vehicle_identifier
        )
    )
    result = await db.execute(stmt)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        # Create vehicle record dynamically if telematics discovery is active
        vehicle_id = f"veh-{uuid.uuid4().hex[:8]}"
        vehicle = Vehicle(
            id=vehicle_id,
            code=packet.vehicle_identifier,
            name=f"Unit {packet.vehicle_identifier}",
            model="Connected Fleet Unit",
            driver_name="Automated Telemetry",
            status="IN_TRANSIT" if packet.speed_kmh > 5 else "IDLE",
            current_lat=packet.latitude,
            current_lng=packet.longitude,
            speed_kmh=packet.speed_kmh,
            battery_pct=packet.battery_pct if packet.battery_pct is not None else 85,
            health_score=95,
            workspace_id=workspace_id,
        )
        db.add(vehicle)
        await db.flush()
    else:
        # Update existing vehicle position and state
        vehicle.current_lat = packet.latitude
        vehicle.current_lng = packet.longitude
        vehicle.speed_kmh = packet.speed_kmh
        if packet.battery_pct is not None:
            vehicle.battery_pct = packet.battery_pct
        if packet.speed_kmh > 5:
            vehicle.status = "IN_TRANSIT"

    # 2. Persist TelemetryEvent
    telem_event = TelemetryEvent(
        vehicle_id=vehicle.id,
        lat=packet.latitude,
        lng=packet.longitude,
        speed_kmh=packet.speed_kmh,
        heading=packet.heading,
        battery_pct=packet.battery_pct,
        fuel_pct=packet.fuel_pct,
        engine_state=packet.engine_state,
        temp_celsius=packet.temperature_celsius,
        device_timestamp=packet.timestamp,
        external_device_id=packet.external_device_id,
        source_provider=packet.source_provider,
        raw_payload=packet.raw_payload,
        workspace_id=workspace_id,
    )
    db.add(telem_event)

    # 3. Update or create VehicleStatus snapshot
    status_stmt = select(VehicleStatus).where(VehicleStatus.vehicle_id == vehicle.id)
    status_res = await db.execute(status_stmt)
    status_obj = status_res.scalar_one_or_none()
    if status_obj:
        status_obj.lat = packet.latitude
        status_obj.lng = packet.longitude
        status_obj.speed_kmh = packet.speed_kmh
        status_obj.heading = packet.heading
        if packet.battery_pct is not None:
            status_obj.battery_pct = packet.battery_pct
        status_obj.last_telemetry_at = packet.timestamp
    else:
        status_obj = VehicleStatus(
            vehicle_id=vehicle.id,
            status=vehicle.status,
            lat=packet.latitude,
            lng=packet.longitude,
            speed_kmh=packet.speed_kmh,
            heading=packet.heading,
            battery_pct=vehicle.battery_pct,
            health_score=vehicle.health_score,
            last_telemetry_at=packet.timestamp,
            workspace_id=workspace_id,
        )
        db.add(status_obj)

    # 4. Incident Detection Rules
    detected_incidents = []
    # Rule A: Critical low battery while in transit
    if packet.battery_pct is not None and packet.battery_pct < 15 and packet.speed_kmh > 0:
        inc_code = f"INC-BAT-{uuid.uuid4().hex[:4].upper()}"
        inc = Incident(
            code=inc_code,
            title=f"Critical Low Battery Alert: {vehicle.code} ({packet.battery_pct}%)",
            summary=f"Vehicle {vehicle.code} is operating with {packet.battery_pct}% remaining charge. Charging depot routing required.",
            severity="CRITICAL",
            category="MECHANICAL",
            status="DETECTED",
            lat=packet.latitude,
            lng=packet.longitude,
            affected_entity_type="VEHICLE",
            affected_entity_id=vehicle.id,
            affected_entity_name=vehicle.name,
            vehicle_id=vehicle.id,
            delay_minutes=45,
            cost_estimate=1200.0,
            risk_score=92,
            root_cause="Depleted energy reserve prior to corridor completion",
            ai_analysis="Immediate detour to nearest high-speed megawatt charging crossdock recommended.",
            workspace_id=workspace_id,
        )
        db.add(inc)
        await db.flush()
        tl = IncidentTimeline(
            incident_id=inc.id,
            status="DETECTED",
            note=f"Automatic threshold trigger: State of Charge dropped to {packet.battery_pct}%",
            actor_name="Nexus Telemetry Rule Engine",
        )
        db.add(tl)
        detected_incidents.append(inc_code)

    await db.commit()

    # 5. Real-Time Broadcast to Frontend
    payload = {
        "vehicle_id": vehicle.id,
        "code": vehicle.code,
        "name": vehicle.name,
        "lat": packet.latitude,
        "lng": packet.longitude,
        "speed_kmh": packet.speed_kmh,
        "heading": packet.heading,
        "battery_pct": vehicle.battery_pct,
        "status": vehicle.status,
        "timestamp": packet.timestamp,
        "workspace_id": workspace_id,
    }
    await broadcaster.broadcast("VEHICLE_TELEMETRY_UPDATED", payload)

    if detected_incidents:
        await broadcaster.broadcast("INCIDENT_DETECTED", {
            "vehicle_id": vehicle.id,
            "incident_codes": detected_incidents,
            "workspace_id": workspace_id,
        })

    return {
        "status": "PROCESSED",
        "vehicle_id": vehicle.id,
        "code": vehicle.code,
        "events_created": 1,
        "incidents_detected": len(detected_incidents),
    }
