import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.dependencies import require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.system import AuditLog, OperationalEvent, EventOutbox
from app.schemas.operations import (
    WarehouseRead,
    WarehouseCreate,
    WarehouseUpdate,
    VehicleRead,
    VehicleCreate,
    VehicleUpdate,
    VehicleUpdateTelemetry,
    RouteRead,
    RouteCreate,
    RouteUpdate,
    OrderRead,
    OrderCreate,
    OrderUpdate,
)
from app.core.errors import EntityNotFoundException
from app.realtime.sse import broadcaster

from fastapi import HTTPException

router = APIRouter(prefix="/operations", tags=["Operations"])

def get_tenant_workspace(principal: RequestPrincipal) -> str:
    if not principal.workspace_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="An active workspace is required")
    return principal.workspace_id


@router.get("/summary")
async def get_operations_summary(
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve operational summary of warehouses, vehicles, routes, and orders."""
    ws = get_tenant_workspace(principal)
    
    wh_stmt = select(Warehouse).where(Warehouse.workspace_id == ws)
    wh_res = await db.execute(wh_stmt)
    warehouses = wh_res.scalars().all()
    
    veh_stmt = select(Vehicle).where(Vehicle.workspace_id == ws)
    veh_res = await db.execute(veh_stmt)
    vehicles = veh_res.scalars().all()
    
    rt_stmt = select(Route).where(Route.workspace_id == ws)
    rt_res = await db.execute(rt_stmt)
    routes = rt_res.scalars().all()
    
    ord_stmt = select(Order).where(Order.workspace_id == ws)
    ord_res = await db.execute(ord_stmt)
    orders = ord_res.scalars().all()
    
    return {
        "warehouses": {
            "total": len(warehouses),
            "operational": sum(1 for w in warehouses if getattr(w, "status", None) == "OPERATIONAL"),
            "items": [WarehouseRead.model_validate(w).model_dump() for w in warehouses[:20]],
        },
        "vehicles": {
            "total": len(vehicles),
            "active": sum(1 for v in vehicles if getattr(v, "status", None) == "IN_TRANSIT"),
            "items": [VehicleRead.model_validate(v).model_dump() for v in vehicles[:20]],
        },
        "routes": {
            "total": len(routes),
            "active": sum(1 for r in routes if getattr(r, "status", None) == "ACTIVE"),
            "items": [RouteRead.model_validate(r).model_dump() for r in routes[:20]],
        },
        "orders": {
            "total": len(orders),
            "delayed": sum(1 for o in orders if getattr(o, "status", None) == "DELAYED"),
            "items": [OrderRead.model_validate(o).model_dump() for o in orders[:20]],
        },
        "total_warehouses": len(warehouses),
        "total_vehicles": len(vehicles),
        "total_routes": len(routes),
        "total_orders": len(orders),
    }


# --- WAREHOUSES ---
@router.get("/warehouses", response_model=List[WarehouseRead])
async def list_warehouses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
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
    await broadcaster.broadcast("WAREHOUSE_CREATED", {"id": new_wh.id, "code": new_wh.code, "name": new_wh.name, "city": new_wh.city, "lat": new_wh.lat, "lng": new_wh.lng, "workspace_id": ws}, workspace_id=ws)
    return new_wh

@router.put("/warehouses/{warehouse_id}", response_model=WarehouseRead)
async def update_warehouse(
    warehouse_id: str,
    req: WarehouseUpdate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Update warehouse attributes in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Warehouse).where(
        Warehouse.workspace_id == ws,
        or_(Warehouse.id == warehouse_id, Warehouse.code == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalars().first()
    if not warehouse:
        raise EntityNotFoundException("Warehouse", warehouse_id)

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(warehouse, k, v)
    warehouse.version += 1

    await db.commit()
    await db.refresh(warehouse)
    await broadcaster.broadcast("WAREHOUSE_UPDATED", {"id": warehouse.id, "code": warehouse.code, "name": warehouse.name, "city": warehouse.city, "lat": warehouse.lat, "lng": warehouse.lng, "workspace_id": ws}, workspace_id=ws)
    return warehouse

@router.delete("/warehouses/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Decommission and delete a warehouse from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Warehouse).where(
        Warehouse.workspace_id == ws,
        or_(Warehouse.id == warehouse_id, Warehouse.code == warehouse_id)
    )
    result = await db.execute(stmt)
    warehouse = result.scalars().first()
    if not warehouse:
        raise EntityNotFoundException("Warehouse", warehouse_id)

    await db.delete(warehouse)
    await db.commit()
    await broadcaster.broadcast("WAREHOUSE_DELETED", {"id": warehouse_id, "workspace_id": ws}, workspace_id=ws)
    return None

# --- VEHICLES ---
@router.get("/vehicles", response_model=List[VehicleRead])
async def list_vehicles(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new commercial fleet vehicle in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    data = req.model_dump()
    if req.current_route_id:
        route = (await db.execute(select(Route).where(Route.id == req.current_route_id, Route.workspace_id == ws))).scalars().first()
        if not route:
            raise EntityNotFoundException("Route", req.current_route_id)
    data["workspace_id"] = ws
    new_v = Vehicle(
        id=f"v-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_v)
    await db.commit()
    await db.refresh(new_v)
    await broadcaster.broadcast("VEHICLE_CREATED", {"id": new_v.id, "code": new_v.code, "name": new_v.name, "status": new_v.status, "current_lat": new_v.current_lat, "current_lng": new_v.current_lng, "workspace_id": ws}, workspace_id=ws)
    return new_v

@router.patch("/vehicles/{vehicle_id}/telemetry", response_model=VehicleRead)
async def update_vehicle_telemetry(
    vehicle_id: str,
    req: VehicleUpdateTelemetry,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_ASSIGNED_OPERATIONS)),
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
    await broadcaster.broadcast("VEHICLE_UPDATED", {"id": vehicle.id, "code": vehicle.code, "status": vehicle.status, "current_lat": vehicle.current_lat, "current_lng": vehicle.current_lng, "speed_kmh": vehicle.speed_kmh, "battery_pct": vehicle.battery_pct, "workspace_id": ws}, workspace_id=ws)
    return vehicle

@router.put("/vehicles/{vehicle_id}", response_model=VehicleRead)
async def update_vehicle(
    vehicle_id: str,
    req: VehicleUpdate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Update commercial vehicle attributes in PostgreSQL."""
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
        if v is not None:
            setattr(vehicle, k, v)
    vehicle.version += 1

    await db.commit()
    await db.refresh(vehicle)
    await broadcaster.broadcast("VEHICLE_UPDATED", {"id": vehicle.id, "code": vehicle.code, "status": vehicle.status, "current_lat": vehicle.current_lat, "current_lng": vehicle.current_lng, "speed_kmh": vehicle.speed_kmh, "battery_pct": vehicle.battery_pct, "workspace_id": ws}, workspace_id=ws)
    return vehicle

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Decommission and delete a vehicle from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Vehicle).where(
        Vehicle.workspace_id == ws,
        or_(Vehicle.id == vehicle_id, Vehicle.code == vehicle_id)
    )
    result = await db.execute(stmt)
    vehicle = result.scalars().first()
    if not vehicle:
        raise EntityNotFoundException("Vehicle", vehicle_id)

    await db.delete(vehicle)
    await db.commit()
    await broadcaster.broadcast("VEHICLE_DELETED", {"id": vehicle_id, "workspace_id": ws}, workspace_id=ws)
    return None

# --- ROUTES ---
@router.get("/routes", response_model=List[RouteRead])
async def list_routes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
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
    await broadcaster.broadcast("ROUTE_CREATED", {"id": new_r.id, "code": new_r.code, "name": new_r.name, "origin_warehouse_id": new_r.origin_warehouse_id, "destination_warehouse_id": new_r.destination_warehouse_id, "distance_km": new_r.distance_km, "workspace_id": ws}, workspace_id=ws)
    return new_r

@router.put("/routes/{route_id}", response_model=RouteRead)
async def update_route(
    route_id: str,
    req: RouteUpdate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Update logistics route in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Route).where(
        Route.workspace_id == ws,
        or_(Route.id == route_id, Route.code == route_id)
    )
    result = await db.execute(stmt)
    route = result.scalars().first()
    if not route:
        raise EntityNotFoundException("Route", route_id)

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(route, k, v)
    route.version += 1

    await db.commit()
    await db.refresh(route)
    await broadcaster.broadcast("ROUTE_UPDATED", {"id": route.id, "code": route.code, "name": route.name, "origin_warehouse_id": route.origin_warehouse_id, "destination_warehouse_id": route.destination_warehouse_id, "distance_km": route.distance_km, "workspace_id": ws}, workspace_id=ws)
    return route

@router.delete("/routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Delete a route from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Route).where(
        Route.workspace_id == ws,
        or_(Route.id == route_id, Route.code == route_id)
    )
    result = await db.execute(stmt)
    route = result.scalars().first()
    if not route:
        raise EntityNotFoundException("Route", route_id)

    await db.delete(route)
    await db.commit()
    await broadcaster.broadcast("ROUTE_DELETED", {"id": route_id, "workspace_id": ws}, workspace_id=ws)
    return None

# --- ORDERS ---
@router.get("/orders", response_model=List[OrderRead])
async def list_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_workspace),
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new freight consignment order in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    for model, entity_id, label in (
        (Warehouse, req.warehouse_id, "Warehouse"),
        (Route, req.route_id, "Route"),
        (Vehicle, req.vehicle_id, "Vehicle"),
    ):
        if entity_id and not (await db.execute(select(model.id).where(model.id == entity_id, model.workspace_id == ws))).scalar_one_or_none():
            raise EntityNotFoundException(label, entity_id)
    data = req.model_dump()
    data["workspace_id"] = ws
    new_o = Order(
        id=f"ord-{uuid.uuid4().hex[:8]}",
        **data
    )
    db.add(new_o)
    await db.commit()
    await db.refresh(new_o)
    await broadcaster.broadcast("ORDER_CREATED", {"id": new_o.id, "order_number": new_o.order_number, "status": new_o.status, "customer_name": new_o.customer_name, "origin_address": new_o.origin_address, "destination_address": new_o.destination_address, "warehouse_id": new_o.warehouse_id, "vehicle_id": new_o.vehicle_id, "workspace_id": ws}, workspace_id=ws)
    return new_o

@router.put("/orders/{order_id}", response_model=OrderRead)
async def update_order(
    order_id: str,
    req: OrderUpdate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Update freight consignment order in PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Order).where(
        Order.workspace_id == ws,
        or_(Order.id == order_id, Order.order_number == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise EntityNotFoundException("Order", order_id)

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(order, k, v)
    order.version += 1

    await db.commit()
    await db.refresh(order)
    await broadcaster.broadcast("ORDER_UPDATED", {"id": order.id, "order_number": order.order_number, "status": order.status, "customer_name": order.customer_name, "origin_address": order.origin_address, "destination_address": order.destination_address, "warehouse_id": order.warehouse_id, "vehicle_id": order.vehicle_id, "workspace_id": ws}, workspace_id=ws)
    return order

@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.EDIT_OPERATIONS)),
    db: AsyncSession = Depends(get_db)
):
    """Cancel and delete order from PostgreSQL."""
    ws = get_tenant_workspace(principal)
    stmt = select(Order).where(
        Order.workspace_id == ws,
        or_(Order.id == order_id, Order.order_number == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise EntityNotFoundException("Order", order_id)

    await db.delete(order)
    await db.commit()
    await broadcaster.broadcast("ORDER_DELETED", {"id": order_id, "workspace_id": ws}, workspace_id=ws)
    return None
