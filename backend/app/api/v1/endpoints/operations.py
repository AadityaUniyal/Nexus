from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.operations import (
    WarehouseRead,
    VehicleRead,
    RouteRead,
    OrderRead,
)
from app.core.errors import EntityNotFoundException

router = APIRouter(prefix="/operations", tags=["Operations"])

# Mutable in-memory stores for real-time reactive fleet updates
_WAREHOUSES_STORE: List[WarehouseRead] = [
    WarehouseRead(
        id="wh-chi",
        code="WH-CHI",
        name="Chicago Central Fulfillment Superhub",
        city="Chicago",
        state="IL",
        lat=41.8781,
        lng=-87.6298,
        capacity_units=15000,
        current_units=12450,
        dock_count=12,
        active_docks=8,
        efficiency_pct=96.4,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
    WarehouseRead(
        id="wh-dfw",
        code="WH-DFW",
        name="Dallas-Fort Worth Southern Gateway",
        city="Dallas",
        state="TX",
        lat=32.7767,
        lng=-96.7970,
        capacity_units=18000,
        current_units=14200,
        dock_count=16,
        active_docks=11,
        efficiency_pct=94.8,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
    WarehouseRead(
        id="wh-atl",
        code="WH-ATL",
        name="Atlanta Logistics Terminal",
        city="Atlanta",
        state="GA",
        lat=33.7490,
        lng=-84.3880,
        capacity_units=14000,
        current_units=11100,
        dock_count=10,
        active_docks=7,
        efficiency_pct=92.1,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
    WarehouseRead(
        id="wh-den",
        code="WH-DEN",
        name="Denver High-Altitude Crossdock",
        city="Denver",
        state="CO",
        lat=39.7392,
        lng=-104.9903,
        capacity_units=10000,
        current_units=7200,
        dock_count=8,
        active_docks=5,
        efficiency_pct=97.2,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
    WarehouseRead(
        id="wh-sea",
        code="WH-SEA",
        name="Seattle Northwest Hub",
        city="Seattle",
        state="WA",
        lat=47.6062,
        lng=-122.3321,
        capacity_units=12000,
        current_units=8900,
        dock_count=10,
        active_docks=6,
        efficiency_pct=95.0,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
    WarehouseRead(
        id="wh-nyc",
        code="WH-NYC",
        name="Newark / NYC Eastern Superhub",
        city="Newark",
        state="NJ",
        lat=40.7357,
        lng=-74.1724,
        capacity_units=20000,
        current_units=17800,
        dock_count=18,
        active_docks=14,
        efficiency_pct=98.1,
        status="OPERATIONAL",
        workspace_id="ws-demo-1",
    ),
]

_VEHICLES_STORE: List[VehicleRead] = [
    VehicleRead(
        id="v-104",
        code="NX-TRK-104",
        name="Freightliner eCascadia 04",
        model="Class-8 EV Hauler",
        driver_name="Elena Gomez",
        status="IN_TRANSIT",
        current_lat=41.1400,
        current_lng=-104.8202,
        speed_kmh=68.5,
        battery_pct=78,
        health_score=94,
        current_route_id="rt-chi-den",
        current_route_name="Route RT-CHI-DEN-01 (Midwest Corridor)",
        workspace_id="ws-demo-1",
    ),
    VehicleRead(
        id="v-109",
        code="NX-TRK-109",
        name="Volvo VNR Electric 09",
        model="Heavy Refrigerator Transport",
        driver_name="Jackson Vance",
        status="IN_TRANSIT",
        current_lat=35.2271,
        current_lng=-80.8431,
        speed_kmh=74.0,
        battery_pct=62,
        health_score=82,
        current_route_id="rt-atl-nyc",
        current_route_name="Route RT-ATL-NYC-02 (Eastern Artery)",
        workspace_id="ws-demo-1",
    ),
    VehicleRead(
        id="v-112",
        code="NX-TRK-112",
        name="Tesla Semi Alpha 12",
        model="Autonomous Long-Haul",
        driver_name="Kavita Patel",
        status="IN_TRANSIT",
        current_lat=33.4484,
        current_lng=-112.0740,
        speed_kmh=82.0,
        battery_pct=88,
        health_score=98,
        current_route_id="rt-dfw-den",
        current_route_name="Route RT-DFW-DEN-04 (Desert Bypass)",
        workspace_id="ws-demo-1",
    ),
    VehicleRead(
        id="v-115",
        code="NX-TRK-115",
        name="Kenworth T680 FCEV",
        model="Hydrogen Fuel Cell Hauler",
        driver_name="Marcus Brody",
        status="IN_TRANSIT",
        current_lat=45.5152,
        current_lng=-122.6784,
        speed_kmh=71.2,
        battery_pct=91,
        health_score=96,
        current_route_id="rt-sea-den",
        current_route_name="Route RT-SEA-DEN-03 (Cascade Spine)",
        workspace_id="ws-demo-1",
    ),
    VehicleRead(
        id="v-120",
        code="NX-TRK-120",
        name="Freightliner Cascadia Diesel 20",
        model="Class-8 Heavy Duty",
        driver_name="Lucas Meyer",
        status="DEPOTED",
        current_lat=40.7357,
        current_lng=-74.1724,
        speed_kmh=0.0,
        battery_pct=100,
        health_score=99,
        current_route_id=None,
        current_route_name=None,
        workspace_id="ws-demo-1",
    ),
]

_ROUTES_STORE: List[RouteRead] = [
    RouteRead(
        id="rt-chi-den",
        code="RT-CHI-DEN-01",
        name="Midwest Transcontinental Corridor (I-80)",
        origin_warehouse_id="wh-chi",
        origin_warehouse_name="Chicago Central Hub",
        dest_warehouse_id="wh-den",
        dest_warehouse_name="Denver High-Altitude Hub",
        distance_km=1620.0,
        avg_duration_mins=940,
        traffic_condition="SEVERE_WEATHER_ALERT",
        waypoints=[],
        workspace_id="ws-demo-1",
    ),
    RouteRead(
        id="rt-atl-nyc",
        code="RT-ATL-NYC-02",
        name="Eastern Seaboard Primary (I-85 / I-95)",
        origin_warehouse_id="wh-atl",
        origin_warehouse_name="Atlanta Hub",
        dest_warehouse_id="wh-nyc",
        dest_warehouse_name="Newark Hub",
        distance_km=1380.0,
        avg_duration_mins=810,
        traffic_condition="NORMAL",
        waypoints=[],
        workspace_id="ws-demo-1",
    ),
    RouteRead(
        id="rt-dfw-den",
        code="RT-DFW-DEN-04",
        name="Southwest Plains Connector",
        origin_warehouse_id="wh-dfw",
        origin_warehouse_name="Dallas Hub",
        dest_warehouse_id="wh-den",
        dest_warehouse_name="Denver Hub",
        distance_km=1280.0,
        avg_duration_mins=750,
        traffic_condition="NORMAL",
        waypoints=[],
        workspace_id="ws-demo-1",
    ),
]

def apply_vehicle_detour(vehicle_id_or_code: str, detour_name: str = "I-70 South Highway Detour"):
    """Update vehicle dispatch state following an applied decision."""
    for idx, v in enumerate(_VEHICLES_STORE):
        if v.id == vehicle_id_or_code or v.code.lower() == vehicle_id_or_code.lower() or "104" in vehicle_id_or_code:
            updated_v = v.model_copy(
                update={
                    "status": "IN_TRANSIT",
                    "current_route_name": f"{detour_name} (REROUTED)",
                    "speed_kmh": 78.5,
                    "health_score": 96,
                }
            )
            _VEHICLES_STORE[idx] = updated_v
            return updated_v
    return None

# --- WAREHOUSES ---
@router.get("/warehouses", response_model=List[WarehouseRead])
async def list_warehouses(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all operational hub warehouses."""
    return _WAREHOUSES_STORE

# --- VEHICLES ---
@router.get("/vehicles", response_model=List[VehicleRead])
async def list_vehicles(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all active fleet commercial vehicles."""
    return _VEHICLES_STORE

# --- ROUTES ---
@router.get("/routes", response_model=List[RouteRead])
async def list_routes(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all inter-hub routes."""
    return _ROUTES_STORE

# --- ORDERS ---
@router.get("/orders", response_model=List[OrderRead])
async def list_orders(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve active orders & consignments."""
    return [
        OrderRead(
            id="ord-9041",
            order_number="ORD-2026-9041",
            customer_name="AeroTech Avionics LLC",
            destination="Denver High-Altitude Hub",
            priority="CRITICAL",
            status="IN_TRANSIT",
            total_cost=45000.0,
            deadline="2026-08-30T14:00:00Z",
            vehicle_id="v-104",
            vehicle_code="NX-TRK-104",
            workspace_id=workspace_id,
        ),
        OrderRead(
            id="ord-9042",
            order_number="ORD-2026-9042",
            customer_name="BioPulse Pharmaceuticals",
            destination="Newark Eastern Hub",
            priority="HIGH",
            status="IN_TRANSIT",
            total_cost=28400.0,
            deadline="2026-08-30T16:30:00Z",
            vehicle_id="v-109",
            vehicle_code="NX-TRK-109",
            workspace_id=workspace_id,
        ),
        OrderRead(
            id="ord-9043",
            order_number="ORD-2026-9043",
            customer_name="Vertex Microelectronics",
            destination="Denver High-Altitude Hub",
            priority="STANDARD",
            status="IN_TRANSIT",
            total_cost=15200.0,
            deadline="2026-08-30T22:00:00Z",
            vehicle_id="v-112",
            vehicle_code="NX-TRK-112",
            workspace_id=workspace_id,
        ),
    ]
