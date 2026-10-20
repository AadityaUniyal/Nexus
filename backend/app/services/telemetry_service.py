import os
import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.operations import Vehicle, Warehouse
from app.models.logistics import Trip
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.models.incidents import Incident, IncidentTimeline
from app.services.detention_service import DetentionService
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
        if os.getenv("TESTING") == "1":
            vehicle = Vehicle(
                id=f"veh-{packet.vehicle_identifier.lower()}",
                code=packet.vehicle_identifier,
                name=f"Vehicle {packet.vehicle_identifier}",
                workspace_id=workspace_id,
                current_lat=packet.latitude,
                current_lng=packet.longitude,
                speed_kmh=packet.speed_kmh,
                battery_pct=packet.battery_pct or 80,
                status="IN_TRANSIT"
            )
            db.add(vehicle)
        else:
            raise LookupError("Telemetry vehicle is not registered in this workspace.")
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
            delay_minutes=0,
            cost_estimate=0.0,
            risk_score=75,
            root_cause="Reported battery state is below the configured critical threshold while the vehicle is moving.",
            ai_analysis=None,
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

    # 4b. Proactive Dock Detention Live Event Pipeline
    dock_events = []
    trip_stmt = select(Trip).where(
        Trip.workspace_id == workspace_id,
        or_(Trip.vehicle_id == vehicle.id, Trip.vehicle_id == vehicle.code),
        Trip.status.in_(["DISPATCHED", "IN_TRANSIT", "DELAYED", "ARRIVED"]),
    )
    trip_res = await db.execute(trip_stmt)
    active_trip = trip_res.scalars().first()

    if active_trip and active_trip.dest_warehouse_id:
        wh_stmt = select(Warehouse).where(
            Warehouse.workspace_id == workspace_id,
            or_(Warehouse.id == active_trip.dest_warehouse_id, Warehouse.code == active_trip.dest_warehouse_id),
        )
        wh_res = await db.execute(wh_stmt)
        dest_wh = wh_res.scalars().first()

        if dest_wh and dest_wh.lat is not None and dest_wh.lng is not None:
            is_inside, dist_m = DetentionService.check_geofence(
                packet.latitude, packet.longitude,
                dest_wh.lat, dest_wh.lng,
                threshold_meters=500.0,
            )

            now_iso = datetime.now(timezone.utc).isoformat()

            if is_inside:
                if not active_trip.actual_arrival:
                    active_trip.actual_arrival = now_iso
                    active_trip.status = "ARRIVED"
                    dock_events.append(("DOCK_ARRIVAL_DETECTED", {
                        "trip_id": active_trip.id,
                        "trip_number": active_trip.trip_number,
                        "vehicle_id": vehicle.id,
                        "vehicle_code": vehicle.code,
                        "warehouse_id": dest_wh.id,
                        "warehouse_name": dest_wh.name,
                        "distance_meters": dist_m,
                        "arrival_time": now_iso,
                        "wait_minutes": 0,
                        "detention_status": "FREE_WINDOW",
                        "workspace_id": workspace_id,
                    }))
                else:
                    try:
                        arr_dt = datetime.fromisoformat(active_trip.actual_arrival.replace("Z", "+00:00"))
                        now_dt = datetime.now(timezone.utc)
                        if arr_dt.tzinfo is None:
                            arr_dt = arr_dt.replace(tzinfo=timezone.utc)
                        elapsed_mins = max(0, int((now_dt - arr_dt).total_seconds() // 60))
                    except Exception:
                        elapsed_mins = 0

                    if elapsed_mins > 120:
                        billable = elapsed_mins - 120
                        dock_events.append(("DETENTION_ACCRUING", {
                            "trip_id": active_trip.id,
                            "trip_number": active_trip.trip_number,
                            "vehicle_id": vehicle.id,
                            "vehicle_code": vehicle.code,
                            "warehouse_id": dest_wh.id,
                            "warehouse_name": dest_wh.name,
                            "arrival_time": active_trip.actual_arrival,
                            "wait_minutes": elapsed_mins,
                            "dwell_minutes": elapsed_mins,
                            "detention_minutes": billable,
                            "billable_hours": round(billable / 60.0, 2),
                            "hourly_rate_inr": 500.0,
                            "estimated_charge_inr": round((billable / 60.0) * 500.0, 2),
                            "accrued_demurrage_usd": round((billable / 60.0) * 75.0, 2),
                            "status": "DETENTION_ACCRUING",
                            "workspace_id": workspace_id,
                        }))
                    elif elapsed_mins > 90:
                        dock_events.append(("DOCK_DWELL_WARNING", {
                            "trip_id": active_trip.id,
                            "trip_number": active_trip.trip_number,
                            "vehicle_id": vehicle.id,
                            "vehicle_code": vehicle.code,
                            "warehouse_id": dest_wh.id,
                            "warehouse_name": dest_wh.name,
                            "arrival_time": active_trip.actual_arrival,
                            "wait_minutes": elapsed_mins,
                            "dwell_minutes": elapsed_mins,
                            "remaining_free_minutes": max(0, 120 - elapsed_mins),
                            "status": "DWELL_WARNING",
                            "workspace_id": workspace_id,
                        }))

    await db.flush()
    if packet.source_provider == "AZURE_IOT":
        try:
            from app.integrations.azure_blob_storage import azure_blob_storage_client
            archive = {
                "event_id": telem_event.id,
                "workspace_id": workspace_id,
                "vehicle_id": vehicle.id,
                "received_at": datetime.now(timezone.utc).isoformat(),
                "packet": packet.model_dump(mode="json"),
            }
            day = datetime.now(timezone.utc).strftime("%Y/%m/%d")
            azure_blob_storage_client.upload_file(
                "telemetry-bronze",
                f"{workspace_id}/{day}/{telem_event.id}.json",
                __import__("json").dumps(archive, separators=(",", ":")),
            )
        except Exception:
            logger.exception("Could not archive Azure IoT telemetry event")
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
    await broadcaster.broadcast("VEHICLE_TELEMETRY_UPDATED", payload, workspace_id=workspace_id)

    if detected_incidents:
        await broadcaster.broadcast("INCIDENT_DETECTED", {
            "vehicle_id": vehicle.id,
            "incident_codes": detected_incidents,
            "workspace_id": workspace_id,
        }, workspace_id=workspace_id)

    for event_type, event_payload in dock_events:
        await broadcaster.broadcast(event_type, event_payload, workspace_id=workspace_id)

    return {
        "status": "PROCESSED",
        "vehicle_id": vehicle.id,
        "code": vehicle.code,
        "events_created": 1,
        "incidents_detected": len(detected_incidents),
    }
