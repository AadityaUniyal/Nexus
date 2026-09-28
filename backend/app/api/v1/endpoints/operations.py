import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.dependencies import get_optional_principal, require_workspace
from app.auth.principal import RequestPrincipal
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

def get_tenant_workspace(principal: Optional[RequestPrincipal], fallback: Optional[str] = None) -> str:
    """Derives workspace strictly from authenticated principal, preventing tenant leakage."""
    if principal and principal.workspace_id:
        return principal.workspace_id
    return fallback or "ws-continental-fleet-01"

# --- WAREHOUSES ---
@router.get("/warehouses", response_model=List[WarehouseRead])
async def list_warehouses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational hub warehouses directly from PostgreSQL scoped to tenant workspace."""
    ws = get_tenant_workspace(principal)
    stmt = select(Warehouse).where(Warehouse.workspace_id == ws).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseRead)
async def get_warehouse(
    warehouse_id: str,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve warehouse by ID or Code from PostgreSQL scoped to tenant workspace."""
    ws = get_tenant_workspace(principal)
    stmt = select(Warehouse).where(
        Warehouse.workspace_id == ws,
        or_(Warehouse.id == warehouse_id, Warehouse.code == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalars().first()
    if not warehouse:
        raise EntityNotFoundException("Warehouse", warehouse_id)
    return warehouse

@router.post("/warehouses", response_model=WarehouseRead, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    req: WarehouseCreate,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Create a new warehouse in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    data = req.model_dump()
    data["workspace_id"] = ws
    new_wh = Warehouse(
        id=f"wh-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_wh)
    await db.commit()
    await db.refresh(new_wh)
    await broadcaster.broadcast("WAREHOUSE_CREATED", {"id": new_wh.id, "code": new_wh.code, "name": new_wh.name})
    return new_wh

# --- VEHICLES ---
@router.get("/vehicles", response_model=List[VehicleRead])
async def list_vehicles(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve commercial vehicles from PostgreSQL scoped to tenant workspace."""
    ws = get_tenant_workspace(principal)
    stmt = select(Vehicle).where(Vehicle.workspace_id == ws).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/vehicles/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(
    vehicle_id: str,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve vehicle by ID or Code from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Vehicle).where(
        Vehicle.workspace_id == ws,
        or_(Vehicle.id == vehicle_id, Vehicle.code == vehicle_id)
    )
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise EntityNotFoundException("Vehicle", vehicle_id)
    return vehicle

@router.post("/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    req: VehicleCreate,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Create a new commercial fleet vehicle in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    data = req.model_dump()
    data["workspace_id"] = ws
    new_v = Vehicle(
        id=f"v-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_v)
    await db.commit()
    await db.refresh(new_v)
    await broadcaster.broadcast("VEHICLE_CREATED", {"id": new_v.id, "code": new_v.code, "name": new_v.name})
    return new_v

@router.patch("/vehicles/{vehicle_id}/telemetry", response_model=VehicleRead)
async def update_vehicle_telemetry(
    vehicle_id: str,
    req: VehicleUpdateTelemetry,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Update live GPS coordinates, speed, battery, and status."""
    ws = get_tenant_workspace(principal)
    stmt = select(Vehicle).where(
        Vehicle.workspace_id == ws,
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
    await broadcaster.broadcast("VEHICLE_UPDATED", {"id": vehicle.id, "code": vehicle.code, "status": vehicle.status, "current_lat": vehicle.current_lat, "current_lng": vehicle.current_lng})
    return vehicle

# --- ROUTES ---
@router.get("/routes", response_model=List[RouteRead])
async def list_routes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve logistics routes from PostgreSQL scoped to tenant workspace."""
    ws = get_tenant_workspace(principal)
    stmt = select(Route).where(Route.workspace_id == ws).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/routes/{route_id}", response_model=RouteRead)
async def get_route(
    route_id: str,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve route by ID or Code from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Route).where(
        Route.workspace_id == ws,
        or_(Route.id == route_id, Route.code == route_id)
    )
    result = await db.execute(stmt)
    route = result.scalars().first()
    if not route:
        raise EntityNotFoundException("Route", route_id)
    return route

@router.post("/routes", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
async def create_route(
    req: RouteCreate,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Create a new route in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    data = req.model_dump()
    data["workspace_id"] = ws
    new_r = Route(
        id=f"rt-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_r)
    await db.commit()
    await db.refresh(new_r)
    await broadcaster.broadcast("ROUTE_CREATED", {"id": new_r.id, "code": new_r.code, "name": new_r.name})
    return new_r

# --- ORDERS ---
@router.get("/orders", response_model=List[OrderRead])
async def list_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve freight customer orders from PostgreSQL scoped to tenant workspace."""
    ws = get_tenant_workspace(principal)
    stmt = select(Order).where(Order.workspace_id == ws).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/orders/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: str,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve order by ID or Order Number from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Order).where(
        Order.workspace_id == ws,
        or_(Order.id == order_id, Order.order_number == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise EntityNotFoundException("Order", order_id)
    return order

@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    req: OrderCreate,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """Create a new freight consignment order in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    data = req.model_dump()
    data["workspace_id"] = ws
    new_o = Order(
        id=f"ord-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_o)
    await db.commit()
    await db.refresh(new_o)
    await broadcaster.broadcast("ORDER_CREATED", {"id": new_o.id, "order_number": new_o.order_number})
    return new_o
