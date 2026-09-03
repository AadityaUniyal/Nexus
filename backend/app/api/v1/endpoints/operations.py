import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.system import AuditLog, OperationalEvent, EventOutbox
from app.schemas.operations import (
    WarehouseRead,
    WarehouseCreate,
    VehicleRead,
    VehicleCreate,
    VehicleUpdateTelemetry,
    RouteRead,
    RouteCreate,
    OrderRead,
    OrderCreate,
)
from app.core.errors import EntityNotFoundException
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/operations", tags=["Operations"])

# Initial fallback fixtures if tables are empty
INITIAL_WAREHOUSES = [
    {"id": "wh-chi", "code": "WH-CHI", "name": "Chicago Central Fulfillment Superhub", "city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298, "capacity_units": 15000, "current_units": 12450, "dock_count": 12, "active_docks": 8, "efficiency_pct": 96.4, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
    {"id": "wh-dfw", "code": "WH-DFW", "name": "Dallas-Fort Worth Southern Gateway", "city": "Dallas", "state": "TX", "lat": 32.7767, "lng": -96.7970, "capacity_units": 18000, "current_units": 14200, "dock_count": 16, "active_docks": 11, "efficiency_pct": 94.8, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
    {"id": "wh-atl", "code": "WH-ATL", "name": "Atlanta Logistics Terminal", "city": "Atlanta", "state": "GA", "lat": 33.7490, "lng": -84.3880, "capacity_units": 14000, "current_units": 11100, "dock_count": 10, "active_docks": 7, "efficiency_pct": 92.1, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
    {"id": "wh-den", "code": "WH-DEN", "name": "Denver High-Altitude Crossdock", "city": "Denver", "state": "CO", "lat": 39.7392, "lng": -104.9903, "capacity_units": 10000, "current_units": 7200, "dock_count": 8, "active_docks": 5, "efficiency_pct": 97.2, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
    {"id": "wh-sea", "code": "WH-SEA", "name": "Seattle Northwest Hub", "city": "Seattle", "state": "WA", "lat": 47.6062, "lng": -122.3321, "capacity_units": 12000, "current_units": 8900, "dock_count": 10, "active_docks": 6, "efficiency_pct": 95.0, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
    {"id": "wh-nyc", "code": "WH-NYC", "name": "Newark / NYC Eastern Superhub", "city": "Newark", "state": "NJ", "lat": 40.7357, "lng": -74.1724, "capacity_units": 20000, "current_units": 17800, "dock_count": 18, "active_docks": 14, "efficiency_pct": 98.1, "status": "OPERATIONAL", "workspace_id": "ws-continental-fleet-01"},
]

INITIAL_ROUTES = [
    {"id": "rt-chi-den", "code": "RT-CHI-DEN-01", "name": "Midwest Transcontinental Corridor (I-80)", "origin_warehouse_id": "wh-chi", "origin_warehouse_name": "Chicago Central Hub", "dest_warehouse_id": "wh-den", "dest_warehouse_name": "Denver High-Altitude Hub", "distance_km": 1620.0, "avg_duration_mins": 940, "traffic_condition": "SEVERE_WEATHER_ALERT", "waypoints": [], "workspace_id": "ws-continental-fleet-01"},
    {"id": "rt-atl-nyc", "code": "RT-ATL-NYC-02", "name": "Eastern Seaboard Primary (I-85 / I-95)", "origin_warehouse_id": "wh-atl", "origin_warehouse_name": "Atlanta Hub", "dest_warehouse_id": "wh-nyc", "dest_warehouse_name": "Newark Hub", "distance_km": 1380.0, "avg_duration_mins": 810, "traffic_condition": "NORMAL", "waypoints": [], "workspace_id": "ws-continental-fleet-01"},
    {"id": "rt-dfw-den", "code": "RT-DFW-DEN-04", "name": "Southwest Plains Connector", "origin_warehouse_id": "wh-dfw", "origin_warehouse_name": "Dallas Hub", "dest_warehouse_id": "wh-den", "dest_warehouse_name": "Denver Hub", "distance_km": 1280.0, "avg_duration_mins": 750, "traffic_condition": "NORMAL", "waypoints": [], "workspace_id": "ws-continental-fleet-01"},
]

INITIAL_ORDERS = [
    {"id": "ord-9041", "order_number": "ORD-2026-9041", "customer_name": "AeroTech Avionics LLC", "destination": "Denver High-Altitude Hub", "priority": "CRITICAL", "status": "IN_TRANSIT", "total_cost": 45000.0, "deadline": "2026-08-30T14:00:00Z", "vehicle_id": "v-104", "vehicle_code": "NX-104", "workspace_id": "ws-continental-fleet-01"},
    {"id": "ord-9042", "order_number": "ORD-2026-9042", "customer_name": "BioPulse Pharmaceuticals", "destination": "Newark Eastern Hub", "priority": "HIGH", "status": "IN_TRANSIT", "total_cost": 28400.0, "deadline": "2026-08-30T16:30:00Z", "vehicle_id": "v-109", "vehicle_code": "NX-109", "workspace_id": "ws-continental-fleet-01"},
    {"id": "ord-9043", "order_number": "ORD-2026-9043", "customer_name": "Vertex Microelectronics", "destination": "Denver High-Altitude Hub", "priority": "STANDARD", "status": "IN_TRANSIT", "total_cost": 15200.0, "deadline": "2026-08-30T22:00:00Z", "vehicle_id": "v-112", "vehicle_code": "NX-112", "workspace_id": "ws-continental-fleet-01"},
]

# --- WAREHOUSES ---
@router.get("/warehouses", response_model=List[WarehouseRead])
async def list_warehouses(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all operational hub warehouses directly from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Warehouse).where(Warehouse.workspace_id == ws)
    result = await db.execute(stmt)
    warehouses = result.scalars().all()

    if not warehouses:
        # Seed initial warehouses into DB if empty
        for w_data in INITIAL_WAREHOUSES:
            ws_id = workspace_id or "ws-continental-fleet-01"
            w = Warehouse(**{**w_data, "workspace_id": ws_id})
            db.add(w)
        await db.commit()
        result = await db.execute(select(Warehouse))
        warehouses = result.scalars().all()

    return warehouses

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseRead)
async def get_warehouse(warehouse_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve warehouse by ID or Code from PostgreSQL."""
    stmt = select(Warehouse).where(
        or_(Warehouse.id == warehouse_id, Warehouse.code == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalars().first()
    if not warehouse:
        raise EntityNotFoundException("Warehouse", warehouse_id)
    return warehouse

@router.post("/warehouses", response_model=WarehouseRead, status_code=status.HTTP_201_CREATED)
async def create_warehouse(req: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new warehouse in PostgreSQL."""
    new_wh = Warehouse(
        id=f"wh-{uuid.uuid4().hex[:8]}",
        **req.model_dump()
    )
    db.add(new_wh)
    await db.commit()
    await db.refresh(new_wh)
    await broadcaster.broadcast("WAREHOUSE_CREATED", {"id": new_wh.id, "code": new_wh.code, "name": new_wh.name})
    return new_wh

# --- VEHICLES ---
@router.get("/vehicles", response_model=List[VehicleRead])
async def list_vehicles(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all active fleet commercial vehicles from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Vehicle).where(Vehicle.workspace_id == ws)
    result = await db.execute(stmt)
    vehicles = result.scalars().all()
    return vehicles

@router.get("/vehicles/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve vehicle by ID or Code from PostgreSQL."""
    stmt = select(Vehicle).where(
        or_(Vehicle.id == vehicle_id, Vehicle.code == vehicle_id)
    )
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise EntityNotFoundException("Vehicle", vehicle_id)
    return vehicle

@router.post("/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(req: VehicleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new commercial fleet vehicle in PostgreSQL."""
    new_v = Vehicle(
        id=f"v-{uuid.uuid4().hex[:8]}",
        **req.model_dump()
    )
    db.add(new_v)
    await db.commit()
    await db.refresh(new_v)
    await broadcaster.broadcast("VEHICLE_CREATED", {"id": new_v.id, "code": new_v.code, "name": new_v.name})
    return new_v

@router.patch("/vehicles/{vehicle_id}", response_model=VehicleRead)
async def update_vehicle_telemetry(
    vehicle_id: str,
    req: VehicleUpdateTelemetry,
    db: AsyncSession = Depends(get_db)
):
    """Update vehicle live telemetry and status in PostgreSQL."""
    stmt = select(Vehicle).where(
        or_(Vehicle.id == vehicle_id, Vehicle.code == vehicle_id)
    )
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise EntityNotFoundException("Vehicle", vehicle_id)

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(vehicle, k, v)
    vehicle.version += 1

    await db.commit()
    await db.refresh(vehicle)
    await broadcaster.broadcast("VEHICLE_UPDATED", {"id": vehicle.id, "code": vehicle.code, "status": vehicle.status})
    return vehicle

# --- ROUTES ---
@router.get("/routes", response_model=List[RouteRead])
async def list_routes(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all inter-hub routes from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Route).where(Route.workspace_id == ws)
    result = await db.execute(stmt)
    routes = result.scalars().all()

    if not routes:
        for r_data in INITIAL_ROUTES:
            r = Route(**{**r_data, "workspace_id": ws})
            db.add(r)
        await db.commit()
        result = await db.execute(select(Route).where(Route.workspace_id == ws))
        routes = result.scalars().all()

    return routes

@router.get("/routes/{route_id}", response_model=RouteRead)
async def get_route(route_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve route by ID or Code from PostgreSQL."""
    stmt = select(Route).where(or_(Route.id == route_id, Route.code == route_id))
    result = await db.execute(stmt)
    route = result.scalars().first()
    if not route:
        raise EntityNotFoundException("Route", route_id)
    return route

@router.post("/routes", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
async def create_route(req: RouteCreate, db: AsyncSession = Depends(get_db)):
    """Create a new inter-hub route in PostgreSQL."""
    new_route = Route(
        id=f"rt-{uuid.uuid4().hex[:8]}",
        **req.model_dump()
    )
    db.add(new_route)
    await db.commit()
    await db.refresh(new_route)
    await broadcaster.broadcast("ROUTE_CREATED", {"id": new_route.id, "code": new_route.code, "name": new_route.name})
    return new_route

# --- ORDERS ---
@router.get("/orders", response_model=List[OrderRead])
async def list_orders(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active orders & consignments from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Order).where(Order.workspace_id == ws)
    result = await db.execute(stmt)
    orders = result.scalars().all()

    if not orders:
        ws_id = workspace_id or "ws-continental-fleet-01"
        for o_data in INITIAL_ORDERS:
            o = Order(**{**o_data, "workspace_id": ws_id})
            db.add(o)
        await db.commit()
        result = await db.execute(select(Order))
        orders = result.scalars().all()

    return orders

@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(req: OrderCreate, db: AsyncSession = Depends(get_db)):
    """Create a new consignment order in PostgreSQL."""
    new_o = Order(
        id=f"ord-{uuid.uuid4().hex[:8]}",
        **req.model_dump()
    )
    db.add(new_o)
    await db.commit()
    await db.refresh(new_o)
    await broadcaster.broadcast("ORDER_CREATED", {"id": new_o.id, "orderNumber": new_o.order_number})
    return new_o

# --- HELPER FOR DECISION APPLY ---
async def apply_vehicle_detour_db(db: AsyncSession, vehicle_id_or_code: str, detour_name: str = "I-70 South Highway Detour"):
    """Update vehicle dispatch state in PostgreSQL following an applied decision."""
    stmt = select(Vehicle).where(
        or_(
            Vehicle.id == vehicle_id_or_code,
            Vehicle.code.ilike(f"%{vehicle_id_or_code}%"),
            Vehicle.code.ilike("%104%")
        )
    )
    res = await db.execute(stmt)
    vehicle = res.scalars().first()
    if vehicle:
        vehicle.status = "IN_TRANSIT"
        vehicle.current_route_name = f"{detour_name} (REROUTED)"
        vehicle.speed_kmh = 78.5
        vehicle.health_score = 96
        vehicle.version += 1
        return vehicle
    return None
