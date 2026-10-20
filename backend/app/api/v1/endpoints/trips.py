import uuid
import urllib.parse
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.auth.dependencies import require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.models.logistics import Trip, Stop, Shipment
from app.models.operations import Vehicle, Route, Order, Warehouse
from app.models.fleet import Driver
from app.schemas.logistics import (
    TripRead,
    TripCreate,
    TripUpdate,
    TripDispatchResponse,
    DetentionClockResult,
)
from app.services.detention_service import DetentionService
from app.core.security import create_access_token
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/trips", tags=["Trips & Freight Dispatch"])


def get_tenant_workspace(principal: RequestPrincipal) -> str:
    if not principal.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An active workspace is required",
        )
    return principal.workspace_id


@router.get("", response_model=List[TripRead])
async def list_trips(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    """List operational trips for tenant workspace."""
    ws = get_tenant_workspace(principal)
    query = select(Trip).where(Trip.workspace_id == ws)
    if status_filter:
        query = query.where(Trip.status == status_filter.upper())
    query = query.order_by(Trip.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/public/{trip_id}")
async def get_public_trip_tracking(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Zero-login public tracking endpoint for consignors and clients.
    Exposes non-sensitive delivery progression, vehicle location, and verified POD link.
    """
    stmt = select(Trip).where(or_(Trip.id == trip_id, Trip.trip_number == trip_id))
    result = await db.execute(stmt)
    trip = result.scalars().first()

    if not trip:
        # Check if trip_id matches an Order order_number
        ord_stmt = select(Order).where(or_(Order.id == trip_id, Order.order_number == trip_id))
        ord_res = await db.execute(ord_stmt)
        order = ord_res.scalars().first()
        if not order:
            raise HTTPException(status_code=404, detail="Consignment or Trip not found")

        # Fallback tracking info from Order
        return {
            "trackingId": order.order_number,
            "orderNumber": order.order_number,
            "customerName": order.customer_name,
            "status": order.status,
            "destination": order.destination,
            "deadline": order.deadline,
            "vehicleCode": order.vehicle_code or "TRUCK-EN-ROUTE",
            "isLive": True,
        }

    # Fetch vehicle
    veh_stmt = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalars().first()

    # Fetch origin & destination warehouses
    wh_orig_stmt = select(Warehouse).where(Warehouse.id == trip.origin_warehouse_id)
    orig_res = await db.execute(wh_orig_stmt)
    orig_wh = orig_res.scalars().first()

    wh_dest_stmt = select(Warehouse).where(Warehouse.id == trip.dest_warehouse_id)
    dest_res = await db.execute(wh_dest_stmt)
    dest_wh = dest_res.scalars().first()

    return {
        "tripId": trip.id,
        "tripNumber": trip.trip_number,
        "status": trip.status,
        "originWarehouse": {
            "name": orig_wh.name if orig_wh else "Origin Hub",
            "city": orig_wh.city if orig_wh else "",
            "lat": orig_wh.lat if orig_wh else 19.076,
            "lng": orig_wh.lng if orig_wh else 72.8777,
        },
        "destWarehouse": {
            "name": dest_wh.name if dest_wh else "Destination Hub",
            "city": dest_wh.city if dest_wh else "",
            "lat": dest_wh.lat if dest_wh else 28.6139,
            "lng": dest_wh.lng if dest_wh else 77.209,
        },
        "vehicle": {
            "code": vehicle.code if vehicle else "NX-TRANSIT",
            "driverName": vehicle.driver_name if vehicle else "Assigned Driver",
            "lat": vehicle.current_lat if vehicle else 19.076,
            "lng": vehicle.current_lng if vehicle else 72.8777,
            "speedKmh": vehicle.speed_kmh if vehicle else 0.0,
            "batteryPct": vehicle.battery_pct if vehicle else 95,
        },
        "scheduledDeparture": trip.scheduled_departure,
        "actualDeparture": trip.actual_departure,
        "scheduledArrival": trip.scheduled_arrival,
        "estimatedArrival": trip.estimated_arrival or trip.scheduled_arrival,
        "distanceKm": trip.distance_km,
        "delayMinutes": trip.delay_minutes,
    }


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(
    trip_id: str,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full internal trip details."""
    ws = get_tenant_workspace(principal)
    stmt = select(Trip).where(
        Trip.workspace_id == ws,
        or_(Trip.id == trip_id, Trip.trip_number == trip_id),
    )
    result = await db.execute(stmt)
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    req: TripCreate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new freight transit trip."""
    ws = get_tenant_workspace(principal)

    # Verify vehicle exists in workspace
    veh_stmt = select(Vehicle).where(Vehicle.id == req.vehicle_id, Vehicle.workspace_id == ws)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=400, detail=f"Vehicle '{req.vehicle_id}' not found in workspace")

    trip_data = req.model_dump(exclude={"workspace_id", "order_ids"})
    trip = Trip(
        id=f"trip-{uuid.uuid4().hex[:10]}",
        workspace_id=ws,
        **trip_data,
    )
    db.add(trip)

    # Associate any provided orders
    if req.order_ids:
        for ord_id in req.order_ids:
            ord_stmt = select(Order).where(Order.id == ord_id, Order.workspace_id == ws)
            ord_res = await db.execute(ord_stmt)
            order = ord_res.scalars().first()
            if order:
                order.trip_id = trip.id
                order.vehicle_id = req.vehicle_id
                order.vehicle_code = vehicle.code
                order.status = "ASSIGNED"

    await db.commit()
    await db.refresh(trip)
    await broadcaster.broadcast("TRIP_CREATED", {
        "id": trip.id,
        "trip_number": trip.trip_number,
        "vehicle_id": trip.vehicle_id,
        "origin_warehouse_id": trip.origin_warehouse_id,
        "dest_warehouse_id": trip.dest_warehouse_id,
        "status": trip.status,
        "workspace_id": ws,
    }, workspace_id=ws)
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripDispatchResponse)
async def dispatch_trip(
    trip_id: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db),
):
    """
    Dispatch a trip:
    1. Sets status to DISPATCHED
    2. Generates driver mobile web pass token
    3. Generates public consignor live tracking link
    4. Formats WhatsApp instant dispatch message
    """
    ws = get_tenant_workspace(principal)
    stmt = select(Trip).where(
        Trip.workspace_id == ws,
        or_(Trip.id == trip_id, Trip.trip_number == trip_id),
    )
    result = await db.execute(stmt)
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Fetch vehicle
    veh_stmt = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalars().first()
    veh_code = vehicle.code if vehicle else "NX-804"
    driver_name = vehicle.driver_name if vehicle else "Fleet Driver"

    # Update trip status
    now_iso = datetime.now(timezone.utc).isoformat()
    trip.status = "DISPATCHED"
    trip.actual_departure = now_iso
    if vehicle:
        vehicle.status = "IN_TRANSIT"

    await db.commit()

    # Generate driver dispatch token
    token_claims = {
        "sub": f"driver-{veh_code}",
        "type": "driver_dispatch",
        "vehicle_code": veh_code,
        "workspace_id": ws,
        "trip_id": trip.id,
    }
    dispatch_token = create_access_token(token_claims)

    base_domain = "https://voyage-freight.vercel.app"
    driver_pass_url = f"{base_domain}/driver-pass?v={veh_code}&t={dispatch_token}"
    client_tracking_url = f"{base_domain}/track/{trip.trip_number}"

    whatsapp_msg = (
        f"VOYAGE DISPATCH: Hello {driver_name}, your trip {trip.trip_number} for vehicle {veh_code} "
        f"has been dispatched. Open your live Driver Pass here (no app install needed): {driver_pass_url}"
    )
    whatsapp_link = f"https://wa.me/?text={urllib.parse.quote(whatsapp_msg)}"

    await broadcaster.broadcast("TRIP_DISPATCHED", {
        "id": trip.id,
        "trip_number": trip.trip_number,
        "vehicle_id": trip.vehicle_id,
        "vehicle_code": veh_code,
        "driver_name": driver_name,
        "origin_warehouse_id": trip.origin_warehouse_id,
        "dest_warehouse_id": trip.dest_warehouse_id,
        "status": trip.status,
        "actual_departure": now_iso,
        "workspace_id": ws,
    }, workspace_id=ws)

    return TripDispatchResponse(
        trip_id=trip.id,
        trip_number=trip.trip_number,
        vehicle_code=veh_code,
        driver_name=driver_name,
        driver_pass_url=driver_pass_url,
        client_tracking_url=client_tracking_url,
        whatsapp_dispatch_link=whatsapp_link,
    )


@router.get("/{trip_id}/detention", response_model=DetentionClockResult)
async def get_trip_detention_clock(
    trip_id: str,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    """
    Automated Geofence Detention Clock calculation.
    Compares vehicle dock arrival timestamp vs. POD upload timestamp.
    """
    ws = get_tenant_workspace(principal)
    stmt = select(Trip).where(
        Trip.workspace_id == ws,
        or_(Trip.id == trip_id, Trip.trip_number == trip_id),
    )
    result = await db.execute(stmt)
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Fetch destination warehouse
    dest_stmt = select(Warehouse).where(Warehouse.id == trip.dest_warehouse_id)
    dest_res = await db.execute(dest_stmt)
    dest_wh = dest_res.scalars().first()
    dest_name = dest_wh.name if dest_wh else "Destination Unloading Dock"

    # Fetch vehicle
    veh_stmt = select(Vehicle).where(Vehicle.id == trip.vehicle_id)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalars().first()
    veh_code = vehicle.code if vehicle else "NX-804"

    # Check arrival datetime
    dock_arrival_dt = None
    if trip.actual_arrival:
        try:
            dock_arrival_dt = datetime.fromisoformat(trip.actual_arrival.replace("Z", "+00:00"))
        except Exception:
            dock_arrival_dt = None

    # Check if vehicle is currently in dock geofence
    entered_geofence = False
    if vehicle and dest_wh:
        is_in, dist = DetentionService.check_geofence(
            vehicle.current_lat, vehicle.current_lng,
            dest_wh.lat, dest_wh.lng,
        )
        entered_geofence = is_in or (dock_arrival_dt is not None)

    detention_metrics = DetentionService.compute_detention_charges(
        dock_arrival_dt=dock_arrival_dt,
    )

    return DetentionClockResult(
        trip_id=trip.id,
        trip_number=trip.trip_number,
        vehicle_code=veh_code,
        dest_warehouse_name=dest_name,
        dock_geofence_meters=500.0,
        entered_geofence=entered_geofence,
        dock_arrival_time=detention_metrics["dock_arrival_time"],
        pod_submission_time=detention_metrics["pod_submission_time"],
        total_dock_wait_minutes=detention_metrics["total_dock_wait_minutes"],
        free_dock_minutes=detention_metrics["free_dock_minutes"],
        billable_detention_minutes=detention_metrics["billable_detention_minutes"],
        billable_detention_hours=detention_metrics["billable_detention_hours"],
        hourly_detention_rate_inr=detention_metrics["hourly_detention_rate_inr"],
        total_detention_charge_inr=detention_metrics["total_detention_charge_inr"],
        detention_status=detention_metrics["detention_status"],
    )
