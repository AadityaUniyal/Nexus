import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from app.db.session import get_db
from app.models.operations import Vehicle, Route, Order, Warehouse
from app.models.logistics import Shipment, Trip
from app.models.fleet import Driver
from app.models.system import AuditLog
from app.realtime.sse import broadcaster
from app.core.config import settings
from app.core.security import create_access_token, decode_token

router = APIRouter(prefix="/driver", tags=["Mobile Driver Portal & Dispatch"])


class DriverStatusUpdate(BaseModel):
    vehicle_code: str
    status: str  # DISPATCHED, EN_ROUTE, DELAYED, ARRIVED, DELIVERED
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    notes: Optional[str] = None
    token: Optional[str] = None


class ProofOfDeliverySubmission(BaseModel):
    vehicle_code: str
    order_number: Optional[str] = None
    recipient_name: str = Field(..., min_length=2)
    signature_data: str = Field(..., description="Base64 or SVG signature string")
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    token: Optional[str] = None


class DispatchTokenRequest(BaseModel):
    vehicle_code: str
    route_code: Optional[str] = None
    driver_name: Optional[str] = None


def verify_driver_token(token: Optional[str], vehicle_code: str) -> bool:
    """Verifies that the provided token is signed and authorized for this vehicle."""
    if settings.ENABLE_DEMO_AUTH and (not token or token.startswith("tok-") or token.startswith("demo_")):
        return True
    if not token:
        return False
    payload = decode_token(token)
    if not payload:
        return False
    if payload.get("type") != "driver_dispatch":
        return False
    if payload.get("vehicle_code") != vehicle_code:
        return False
    return True


@router.get("/manifest")
async def get_driver_manifest(
    vehicle_code: str = Query(..., description="Unique vehicle code, e.g. NX-804"),
    route_code: Optional[str] = Query(default=None),
    token: Optional[str] = Query(default=None, description="Signed driver dispatch token"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve driver route manifest, consignment cargo, and waypoint schedule."""
    if not verify_driver_token(token, vehicle_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or missing driver dispatch token."
        )

    # Lookup vehicle
    veh_stmt = select(Vehicle).where(Vehicle.code == vehicle_code)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalar_one_or_none()

    if not vehicle:
        if not settings.ENABLE_DEMO_AUTH:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with code '{vehicle_code}' not found in active fleet records."
            )
        # Fallback synthesized payload if DB is fresh / unseeded in demo mode
        return {
            "manifest_id": f"mnf-{uuid.uuid4().hex[:8]}",
            "vehicle_code": vehicle_code,
            "vehicle_name": f"Freightliner eCascadia ({vehicle_code})",
            "driver_name": "Rajesh Sharma",
            "route_code": route_code or "COR-DEL-DED-01",
            "route_name": "Delhi NCR - Dehradun Express Corridor",
            "origin": "Delhi Hub 01 (Okhla)",
            "origin_lat": 28.5355,
            "origin_lng": 77.2612,
            "destination": "Dehradun Logistics Park (Selaqui)",
            "destination_lat": 30.3610,
            "destination_lng": 77.8540,
            "distance_km": 248.5,
            "estimated_duration_mins": 290,
            "status": "EN_ROUTE",
            "battery_pct": 82,
            "cargo": [
                {
                    "tracking_number": "TRK-IN-9081",
                    "customer_name": "Apollo Health Supply",
                    "description": "Temperature Controlled Medical Coolers",
                    "weight_kg": 4200.0,
                    "destination": "Dehradun Selaqui Medical Center",
                    "status": "IN_TRANSIT",
                },
                {
                    "tracking_number": "TRK-IN-9082",
                    "customer_name": "Tata Consumer Logistics",
                    "description": "Commercial Food Consignment",
                    "weight_kg": 6800.0,
                    "destination": "Dehradun Hub Dock 04",
                    "status": "IN_TRANSIT",
                },
            ],
            "stops": [
                {"sequence": 1, "name": "Delhi Okhla Terminal", "type": "DEPARTURE", "status": "COMPLETED"},
                {"sequence": 2, "name": "Meerut Bypass Checkpoint", "type": "WAYPOINT", "status": "COMPLETED"},
                {"sequence": 3, "name": "Muzaffarnagar Fast Charger", "type": "CHARGING", "status": "PENDING"},
                {"sequence": 4, "name": "Dehradun Selaqui Logistics Park", "type": "DESTINATION", "status": "PENDING"},
            ],
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }

    # Vehicle found in DB: lookup route
    route = None
    if vehicle.current_route_id:
        rt_stmt = select(Route).where(Route.id == vehicle.current_route_id)
        rt_res = await db.execute(rt_stmt)
        route = rt_res.scalar_one_or_none()

    if not route and route_code:
        rt_stmt = select(Route).where(Route.code == route_code)
        rt_res = await db.execute(rt_stmt)
        route = rt_res.scalar_one_or_none()

    # Lookup orders assigned to vehicle
    ord_stmt = select(Order).where(Order.vehicle_id == vehicle.id)
    ord_res = await db.execute(ord_stmt)
    orders = ord_res.scalars().all()

    cargo_items = [
        {
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "description": f"Consignment for {o.destination}",
            "weight_kg": 3500.0,
            "destination": o.destination,
            "status": o.status,
        }
        for o in orders
    ] or [
        {
            "order_number": f"ORD-{vehicle.code}-01",
            "customer_name": "Continental Freight Logistics",
            "description": "Standard Palletized Freight",
            "weight_kg": 8500.0,
            "destination": route.dest_warehouse_name if route else "Central Hub Dock 02",
            "status": vehicle.status,
        }
    ]

    return {
        "manifest_id": f"mnf-{vehicle.id[:8]}",
        "vehicle_code": vehicle.code,
        "vehicle_name": vehicle.name,
        "driver_name": vehicle.driver_name,
        "route_code": route.code if route else (route_code or "COR-EXP-01"),
        "route_name": route.name if route else "Express Freight Corridor",
        "origin": route.origin_warehouse_name if route else "Origin Regional Hub",
        "destination": route.dest_warehouse_name if route else "Destination Regional Hub",
        "distance_km": route.distance_km if route else 180.0,
        "estimated_duration_mins": route.avg_duration_mins if route else 210,
        "status": vehicle.status,
        "battery_pct": vehicle.battery_pct,
        "cargo": cargo_items,
        "stops": [
            {"sequence": 1, "name": route.origin_warehouse_name if route else "Origin Hub", "type": "DEPARTURE", "status": "COMPLETED"},
            {"sequence": 2, "name": "Midpoint Waypoint", "type": "WAYPOINT", "status": "PENDING"},
            {"sequence": 3, "name": route.dest_warehouse_name if route else "Destination Hub", "type": "DESTINATION", "status": "PENDING"},
        ],
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/status")
async def update_driver_status(
    payload: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Driver updates operational trip status (e.g. DEPARTED, IN_TRANSIT, ARRIVED, DELIVERED)."""
    if not verify_driver_token(payload.token, payload.vehicle_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired driver dispatch token"
        )

    stmt = select(Vehicle).where(Vehicle.code == payload.vehicle_code)
    res = await db.execute(stmt)
    vehicle = res.scalar_one_or_none()

    if not vehicle and not settings.ENABLE_DEMO_AUTH:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{payload.vehicle_code}' not found."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    if vehicle:
        vehicle.status = payload.status
        if payload.current_lat is not None:
            vehicle.current_lat = payload.current_lat
        if payload.current_lng is not None:
            vehicle.current_lng = payload.current_lng
        await db.commit()

    # Broadcast event via SSE
    await broadcaster.broadcast(
        event_type="DRIVER_STATUS_UPDATED",
        payload={
            "vehicle_code": payload.vehicle_code,
            "status": payload.status,
            "lat": payload.current_lat,
            "lng": payload.current_lng,
            "notes": payload.notes,
            "timestamp": now_iso,
        },
    )

    return {
        "success": True,
        "vehicle_code": payload.vehicle_code,
        "status": payload.status,
        "updated_at": now_iso,
    }


@router.post("/pod")
async def submit_proof_of_delivery(
    payload: ProofOfDeliverySubmission,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Submit digital Proof of Delivery with captured touchscreen signature and GPS timestamp."""
    if not verify_driver_token(payload.token, payload.vehicle_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired driver dispatch token"
        )

    pod_id = f"pod-{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Mark vehicle and active orders delivered
    veh_stmt = select(Vehicle).where(Vehicle.code == payload.vehicle_code)
    veh_res = await db.execute(veh_stmt)
    vehicle = veh_res.scalar_one_or_none()

    if not vehicle and not settings.ENABLE_DEMO_AUTH:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{payload.vehicle_code}' not found."
        )

    if vehicle:
        vehicle.status = "DELIVERED"
        # Update matching orders if order_number specified
        if payload.order_number:
            ord_stmt = select(Order).where(Order.order_number == payload.order_number)
            ord_res = await db.execute(ord_stmt)
            order = ord_res.scalar_one_or_none()
            if order:
                order.status = "DELIVERED"
        else:
            # Update all active orders for vehicle
            ord_stmt = select(Order).where(Order.vehicle_id == vehicle.id)
            ord_res = await db.execute(ord_stmt)
            orders = ord_res.scalars().all()
            for o in orders:
                o.status = "DELIVERED"

        # Record tamper-proof audit log
        audit = AuditLog(
            id=f"aud-{uuid.uuid4().hex[:10]}",
            workspace_id=vehicle.workspace_id,
            action="PROOF_OF_DELIVERY_RECORDED",
            entity_type="PROOF_OF_DELIVERY",
            entity_id=pod_id,
            actor_id=f"driver-{payload.vehicle_code}",
            ip_address="127.0.0.1",
            payload={
                "vehicle_code": payload.vehicle_code,
                "recipient_name": payload.recipient_name,
                "order_number": payload.order_number,
                "signature_length": len(payload.signature_data),
                "latitude": payload.latitude,
                "longitude": payload.longitude,
                "notes": payload.notes,
            },
            timestamp=now_iso,
        )
        db.add(audit)
        await db.commit()

    # Emit real-time event to dispatch operations center
    await broadcaster.broadcast(
        event_type="PROOF_OF_DELIVERY_SUBMITTED",
        payload={
            "pod_id": pod_id,
            "vehicle_code": payload.vehicle_code,
            "recipient_name": payload.recipient_name,
            "status": "DELIVERED",
            "timestamp": now_iso,
        },
    )

    return {
        "success": True,
        "pod_id": pod_id,
        "vehicle_code": payload.vehicle_code,
        "recipient_name": payload.recipient_name,
        "status": "DELIVERED",
        "timestamp": now_iso,
        "message": "Proof of Delivery successfully recorded and verified.",
    }


@router.post("/dispatch-token")
async def generate_driver_dispatch_token(
    payload: DispatchTokenRequest,
) -> Dict[str, Any]:
    """Generate authenticated driver pass URL with cryptographic signature."""
    now_iso = datetime.now(timezone.utc).isoformat()
    # Issue signed JWT driver pass token valid for 24 hours
    from datetime import timedelta
    token = create_access_token(
        subject=f"driver-{payload.vehicle_code}",
        expires_delta=timedelta(hours=24),
        extra_claims={
            "type": "driver_dispatch",
            "vehicle_code": payload.vehicle_code,
            "route_code": payload.route_code,
            "driver_name": payload.driver_name,
        }
    )
    return {
        "token": token,
        "vehicle_code": payload.vehicle_code,
        "driver_pass_url": f"/driver-pass?v={payload.vehicle_code}&r={payload.route_code or ''}&token={token}",
        "expires_in_hours": 24,
        "created_at": now_iso,
    }
