import csv
import io
import json
import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.fleet import Driver, VehicleType, VehicleDevice
from app.models.logistics import Customer, Trip, Stop
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.models.governance import AuditEvent

MAX_IMPORT_BYTES = 10_000_000
MAX_IMPORT_ROWS = 10_000

ENTITY_FIELDS = {
    "VEHICLES": {
        "required": ["code", "name"],
        "optional": ["model", "driver_name", "status", "lat", "lng", "speed_kmh", "heading", "battery_pct", "health_score"],
        "aliases": {
            "code": ["code", "id", "vin", "registration", "registration_number", "registrationnumber", "reg_no", "license_plate", "truck_id", "vehicle_id", "unit_no"],
            "name": ["name", "vehicle_name", "unit_name", "truck_name", "truckname", "title"],
            "model": ["model", "make", "vehicle_model", "vehicle_type", "type"],
            "driver_name": ["driver_name", "driver", "operator", "pilot", "assigned_driver"],
            "status": ["status", "state", "operational_status"],
            "lat": ["lat", "latitude", "current_lat", "y"],
            "lng": ["lng", "longitude", "long", "current_lng", "x"],
            "speed_kmh": ["speed_kmh", "speedkmh", "speed", "velocity"],
            "battery_pct": ["battery_pct", "battery", "battery_percentage", "batterypercentage", "soc", "fuel", "fuel_pct"],
            "health_score": ["health_score", "health", "vehicle_health"],
            "heading": ["heading", "heading_deg", "bearing"],
        }
    },
    "DRIVERS": {
        "required": ["code", "name", "license_number", "phone", "license_class", "duty_status", "total_hours_today"],
        "optional": ["email"],
        "aliases": {
            "code": ["code", "driver_id", "badge_no", "employee_id", "id"],
            "name": ["name", "driver_name", "full_name", "employee_name"],
            "license_number": ["license_number", "license", "cdl", "cdl_no", "permit_no"],
            "phone": ["phone", "mobile", "contact_number", "cell"],
            "email": ["email", "mail"],
            "duty_status": ["duty_status", "status", "shift_status"],
            "total_hours_today": ["total_hours_today", "hours_today", "driving_hours_today"],
        }
    },
    "CUSTOMERS": {
        "required": ["code", "name", "email", "phone", "sla_tier"],
        "optional": ["contact_name"],
        "aliases": {
            "code": ["code", "customer_code", "account_id", "client_code", "id"],
            "name": ["name", "customer_name", "company_name", "client_name"],
            "email": ["email", "contact_email", "billing_email"],
            "contact_name": ["contact_name", "contact", "poc", "representative"],
            "sla_tier": ["sla_tier", "tier", "service_tier", "priority_level"],
        }
    },
    "ORDERS": {
        "required": ["order_number", "customer_name", "destination", "deadline", "priority", "status", "total_cost"],
        "optional": ["vehicle_code"],
        "aliases": {
            "order_number": ["order_number", "order_id", "order_no", "tracking_no", "shipment_id", "po_number"],
            "customer_name": ["customer_name", "customer", "client", "shipper"],
            "destination": ["destination", "dest", "delivery_location", "dest_address", "city"],
            "deadline": ["deadline", "due_date", "promised_delivery_time", "eta_deadline"],
            "priority": ["priority", "sla_priority", "urgency"],
            "total_cost": ["total_cost", "cost", "amount", "price", "freight_charge"],
            "vehicle_code": ["vehicle_code", "vehicle", "assigned_truck", "truck_code"],
        }
    },
    "TRIPS": {
        "required": ["trip_number", "vehicle_id", "origin_warehouse_id", "dest_warehouse_id", "scheduled_departure", "scheduled_arrival", "distance_km", "status"],
        "optional": ["driver_id"],
        "aliases": {
            "trip_number": ["trip_number", "trip_id", "manifest_number", "dispatch_id", "load_id"],
            "origin_warehouse_id": ["origin_warehouse_id", "origin", "source_hub", "from_wh"],
            "dest_warehouse_id": ["dest_warehouse_id", "destination", "dest_hub", "to_wh"],
            "scheduled_departure": ["scheduled_departure", "departure", "start_time", "depart_at"],
            "scheduled_arrival": ["scheduled_arrival", "arrival", "end_time", "arrive_at"],
            "distance_km": ["distance_km", "distance", "miles", "km"],
        }
    },
    "WAREHOUSES": {
        "required": ["code", "name", "city", "state", "lat", "lng"],
        "optional": ["capacity_units", "dock_count"],
        "aliases": {
            "code": ["code", "warehouse_id", "hub_code", "depot_code", "id"],
            "name": ["name", "warehouse_name", "hub_name", "depot_name", "facility_name"],
            "city": ["city", "town", "location_city"],
            "state": ["state", "province", "region"],
            "lat": ["lat", "latitude", "dock_lat", "y"],
            "lng": ["lng", "longitude", "dock_lng", "x"],
            "capacity_units": ["capacity_units", "capacity", "max_capacity", "units"],
            "dock_count": ["dock_count", "docks", "dock_bays", "bays"],
        }
    }
}

class ImportValidationResult(BaseModel):
    total_rows: int
    valid_rows_count: int
    error_rows_count: int
    errors: List[Dict[str, Any]]
    preview: List[Dict[str, Any]]
    detected_columns: List[str]
    suggested_mapping: Dict[str, str]

class ImportExecutionResult(BaseModel):
    entity_type: str
    imported_count: int
    failed_count: int
    record_ids: List[str]
    audit_id: str


class ImportExecutionError(Exception):
    """A batch failed before commit; no row from the batch is persisted."""

def parse_import_file(content: str, filename: str) -> List[Dict[str, Any]]:
    """Parse CSV or JSON string into array of flat dictionaries."""
    filename_lower = filename.lower()
    if not (filename_lower.endswith(".csv") or filename_lower.endswith(".json")):
        raise ValueError("Only CSV and JSON files are supported.")
    if len(content.encode("utf-8")) > MAX_IMPORT_BYTES:
        raise ValueError(f"Import files must be {MAX_IMPORT_BYTES // 1_000_000} MB or smaller.")

    if filename_lower.endswith(".json"):
        data = json.loads(content)
        if isinstance(data, list):
            rows = data
        elif isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
            rows = data["data"]
        else:
            raise ValueError("JSON must contain an array of row objects or a {data: [...]} key")
    else:
        reader = csv.DictReader(io.StringIO(content))
        rows = []
        for r in reader:
            # Strip whitespace from keys and values
            clean_row = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in r.items() if k}
            rows.append(clean_row)

    if len(rows) > MAX_IMPORT_ROWS:
        raise ValueError(f"Import files can contain at most {MAX_IMPORT_ROWS:,} data rows.")
    if any(not isinstance(row, dict) for row in rows):
        raise ValueError("Every import row must be a JSON object or CSV record.")
    return rows

def suggest_mapping(columns: List[str], entity_type: str) -> Dict[str, str]:
    """Automatically suggest column mappings based on known field aliases."""
    entity_cfg = ENTITY_FIELDS.get(entity_type.upper(), ENTITY_FIELDS["VEHICLES"])
    aliases = entity_cfg.get("aliases", {})
    mapping = {}
    
    for col in columns:
        # Convert camelCase to snake_case
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", col)
        col_snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
        col_normalized = re.sub(r"[^a-zA-Z0-9]", "_", col_snake).strip("_")
        col_compact = re.sub(r"[^a-zA-Z0-9]", "", col.lower())

        matched = False
        for target_field, alias_list in aliases.items():
            if (
                col_normalized in alias_list
                or col_compact in alias_list
                or col_normalized == target_field
                or col_compact == target_field
            ):
                mapping[col] = target_field
                matched = True
                break
        if not matched:
            mapping[col] = col_normalized
    return mapping

def validate_import_data(
    rows: List[Dict[str, Any]],
    column_mapping: Dict[str, str],
    entity_type: str
) -> ImportValidationResult:
    """Validate rows against required schema and types."""
    entity_cfg = ENTITY_FIELDS.get(entity_type.upper(), ENTITY_FIELDS["VEHICLES"])
    required_fields = set(entity_cfg["required"])
    
    errors = []
    preview = []
    valid_count = 0

    for idx, raw_row in enumerate(rows):
        mapped_row = {}
        for source_col, target_field in column_mapping.items():
            if source_col in raw_row and target_field:
                mapped_row[target_field] = raw_row[source_col]

        # Check required fields
        missing = [f for f in required_fields if not mapped_row.get(f)]
        if missing:
            errors.append({
                "row_index": idx + 1,
                "error": f"Missing required field(s): {', '.join(missing)}",
                "row_data": raw_row
            })
            continue

        # Latitude / Longitude range checks if present
        if "lat" in mapped_row and mapped_row["lat"]:
            try:
                lat = float(mapped_row["lat"])
                if lat < -90 or lat > 90:
                    errors.append({"row_index": idx + 1, "error": f"Invalid latitude: {lat}", "row_data": raw_row})
                    continue
                mapped_row["lat"] = lat
            except ValueError:
                errors.append({"row_index": idx + 1, "error": f"Non-numeric latitude", "row_data": raw_row})
                continue

        if "lng" in mapped_row and mapped_row["lng"]:
            try:
                lng = float(mapped_row["lng"])
                if lng < -180 or lng > 180:
                    errors.append({"row_index": idx + 1, "error": f"Invalid longitude: {lng}", "row_data": raw_row})
                    continue
                mapped_row["lng"] = lng
            except ValueError:
                errors.append({"row_index": idx + 1, "error": f"Non-numeric longitude", "row_data": raw_row})
                continue

        valid_count += 1
        if len(preview) < 5:
            preview.append(mapped_row)

    cols = list(rows[0].keys()) if rows else []
    return ImportValidationResult(
        total_rows=len(rows),
        valid_rows_count=valid_count,
        error_rows_count=len(errors),
        errors=errors[:50],  # cap to top 50
        preview=preview,
        detected_columns=cols,
        suggested_mapping=suggest_mapping(cols, entity_type)
    )

async def execute_import_data(
    db: AsyncSession,
    rows: List[Dict[str, Any]],
    column_mapping: Dict[str, str],
    entity_type: str,
    workspace_id: str,
    actor_id: str,
    actor_name: str
) -> ImportExecutionResult:
    """Insert validated rows into PostgreSQL scoped strictly to workspace_id."""
    imported_ids = []
    failed_count = 0
    e_type = entity_type.upper()

    for idx, raw_row in enumerate(rows):
        mapped_row = {}
        for source_col, target_field in column_mapping.items():
            if source_col in raw_row and target_field:
                mapped_row[target_field] = raw_row[source_col]

        try:
            cfg = ENTITY_FIELDS.get(e_type)
            missing = [field for field in cfg["required"] if mapped_row.get(field) in (None, "")] if cfg else []
            if missing:
                raise ValueError(f"Missing required field(s): {', '.join(missing)}")
            if e_type == "VEHICLES":
                code = str(mapped_row["code"])
                v = Vehicle(
                    code=code,
                    name=str(mapped_row["name"]),
                    model=str(mapped_row["model"]),
                    driver_name=str(mapped_row["driver_name"]),
                    status=str(mapped_row["status"]),
                    current_lat=float(mapped_row["lat"]),
                    current_lng=float(mapped_row["lng"]),
                    speed_kmh=float(mapped_row["speed_kmh"]),
                    battery_pct=int(float(mapped_row["battery_pct"])),
                    health_score=int(float(mapped_row["health_score"])),
                    workspace_id=workspace_id,
                )
                db.add(v)
                await db.flush()
                # Create initial status snapshot
                vs = VehicleStatus(
                    vehicle_id=v.id,
                    status=v.status,
                    lat=v.current_lat,
                    lng=v.current_lng,
                    speed_kmh=v.speed_kmh,
                    heading=float(mapped_row["heading"]),
                    battery_pct=v.battery_pct,
                    health_score=v.health_score,
                    last_telemetry_at=datetime.now(timezone.utc).isoformat(),
                    workspace_id=workspace_id,
                )
                db.add(vs)
                imported_ids.append(v.id)

            elif e_type == "DRIVERS":
                drv = Driver(
                    code=str(mapped_row["code"]),
                    name=str(mapped_row.get("name")),
                    email=mapped_row.get("email"),
                    phone=str(mapped_row["phone"]),
                    license_number=str(mapped_row.get("license_number")),
                    license_class=str(mapped_row["license_class"]),
                    duty_status=str(mapped_row["duty_status"]),
                    total_hours_today=float(mapped_row["total_hours_today"]),
                    workspace_id=workspace_id,
                )
                db.add(drv)
                await db.flush()
                imported_ids.append(drv.id)

            elif e_type == "CUSTOMERS":
                cust = Customer(
                    code=str(mapped_row["code"]),
                    name=str(mapped_row.get("name")),
                    email=str(mapped_row.get("email")),
                    contact_name=mapped_row.get("contact_name"),
                    phone=str(mapped_row["phone"]),
                    sla_tier=str(mapped_row["sla_tier"]),
                    workspace_id=workspace_id,
                )
                db.add(cust)
                await db.flush()
                imported_ids.append(cust.id)

            elif e_type == "ORDERS":
                ord_item = Order(
                    order_number=str(mapped_row.get("order_number") or f"ORD-{uuid.uuid4().hex[:8].upper()}"),
                    customer_name=str(mapped_row.get("customer_name")),
                    destination=str(mapped_row.get("destination")),
                    priority=str(mapped_row["priority"]),
                    status=str(mapped_row["status"]),
                    total_cost=float(mapped_row["total_cost"]),
                    deadline=str(mapped_row["deadline"]),
                    vehicle_code=mapped_row.get("vehicle_code"),
                    workspace_id=workspace_id,
                )
                db.add(ord_item)
                await db.flush()
                imported_ids.append(ord_item.id)

            elif e_type == "TRIPS":
                scoped_vehicle = await db.execute(select(Vehicle).where(Vehicle.id == str(mapped_row["vehicle_id"]), Vehicle.workspace_id == workspace_id))
                scoped_origin = await db.execute(select(Warehouse).where(Warehouse.id == str(mapped_row["origin_warehouse_id"]), Warehouse.workspace_id == workspace_id))
                scoped_destination = await db.execute(select(Warehouse).where(Warehouse.id == str(mapped_row["dest_warehouse_id"]), Warehouse.workspace_id == workspace_id))
                if not scoped_vehicle.scalar_one_or_none() or not scoped_origin.scalar_one_or_none() or not scoped_destination.scalar_one_or_none():
                    raise ValueError("Trip vehicle and both locations must exist in the active workspace.")
                trip = Trip(
                    trip_number=str(mapped_row.get("trip_number") or f"TRIP-{uuid.uuid4().hex[:8].upper()}"),
                    vehicle_id=str(mapped_row.get("vehicle_id")),
                    origin_warehouse_id=str(mapped_row.get("origin_warehouse_id")),
                    dest_warehouse_id=str(mapped_row.get("dest_warehouse_id")),
                    scheduled_departure=str(mapped_row.get("scheduled_departure")),
                    scheduled_arrival=str(mapped_row.get("scheduled_arrival")),
                    status=str(mapped_row["status"]),
                    distance_km=float(mapped_row["distance_km"]),
                    workspace_id=workspace_id,
                )
                db.add(trip)
                await db.flush()
                imported_ids.append(trip.id)

            elif e_type == "WAREHOUSES":
                wh = Warehouse(
                    code=str(mapped_row["code"]),
                    name=str(mapped_row["name"]),
                    city=str(mapped_row["city"]),
                    state=str(mapped_row["state"]),
                    lat=float(mapped_row["lat"]),
                    lng=float(mapped_row["lng"]),
                    capacity_units=int(float(mapped_row.get("capacity_units") or 10000)),
                    dock_count=int(float(mapped_row.get("dock_count") or 8)),
                    workspace_id=workspace_id,
                )
                db.add(wh)
                await db.flush()
                imported_ids.append(wh.id)

        except Exception as exc:
            await db.rollback()
            raise ImportExecutionError(
                f"Import stopped on row {idx + 1}; no records were saved. Check the row against the preview and retry."
            ) from exc

    # Record Audit Event
    audit = AuditEvent(
        workspace_id=workspace_id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role="OPERATOR",
        action=f"DATA_IMPORT_{e_type}",
        entity_type=e_type,
        entity_id=f"batch-{uuid.uuid4().hex[:8]}",
        reason=f"Batch customer data import: {len(imported_ids)} succeeded, {failed_count} failed",
    )
    db.add(audit)

    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise ImportExecutionError(
            "The import could not be committed; no records were saved. Refresh the preview and retry."
        ) from exc

    return ImportExecutionResult(
        entity_type=e_type,
        imported_count=len(imported_ids),
        failed_count=failed_count,
        record_ids=imported_ids,
        audit_id=audit.id
    )
