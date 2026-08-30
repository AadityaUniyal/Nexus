from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation

router = APIRouter()

@router.get("")
async def search_workspace(
    q: str = Query(..., min_length=1),
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    query_str = f"%{q.lower()}%"
    results = []

    # Search Vehicles
    v_stmt = select(Vehicle).where(
        Vehicle.workspace_id == ws_id,
        or_(
            Vehicle.code.ilike(query_str),
            Vehicle.name.ilike(query_str),
            Vehicle.model.ilike(query_str),
            Vehicle.driver_name.ilike(query_str)
        )
    ).limit(5)
    v_res = await db.execute(v_stmt)
    for v in v_res.scalars().all():
        results.append({
            "type": "VEHICLE",
            "id": v.id,
            "title": f"{v.code} · {v.model}",
            "subtitle": f"Driver: {v.driver_name} | Speed: {v.speed_kmh} km/h",
            "status": v.status,
            "deepLink": f"/operations/vehicles/{v.id}"
        })

    # Search Warehouses
    w_stmt = select(Warehouse).where(
        Warehouse.workspace_id == ws_id,
        or_(
            Warehouse.code.ilike(query_str),
            Warehouse.name.ilike(query_str),
            Warehouse.city.ilike(query_str)
        )
    ).limit(5)
    w_res = await db.execute(w_stmt)
    for w in w_res.scalars().all():
        results.append({
            "type": "WAREHOUSE",
            "id": w.id,
            "title": f"{w.code} · {w.name}",
            "subtitle": f"{w.city}, {w.state} | {w.current_units}/{w.capacity_units} units",
            "status": w.status,
            "deepLink": f"/operations/warehouses/{w.id}"
        })

    # Search Incidents
    i_stmt = select(Incident).where(
        Incident.workspace_id == ws_id,
        or_(
            Incident.code.ilike(query_str),
            Incident.title.ilike(query_str),
            Incident.summary.ilike(query_str)
        )
    ).limit(5)
    i_res = await db.execute(i_stmt)
    for i in i_res.scalars().all():
        results.append({
            "type": "INCIDENT",
            "id": i.id,
            "title": f"{i.code} · {i.title}",
            "subtitle": f"Severity: {i.severity} | Delay: {i.delay_minutes} min",
            "status": i.status,
            "deepLink": f"/incidents/{i.id}"
        })

    # Search Orders
    o_stmt = select(Order).where(
        Order.workspace_id == ws_id,
        or_(
            Order.order_number.ilike(query_str),
            Order.customer_name.ilike(query_str),
            Order.destination.ilike(query_str)
        )
    ).limit(5)
    o_res = await db.execute(o_stmt)
    for o in o_res.scalars().all():
        results.append({
            "type": "ORDER",
            "id": o.id,
            "title": f"{o.order_number} · {o.customer_name}",
            "subtitle": f"To: {o.destination} | Value: ${o.total_cost:,.2f}",
            "status": o.status,
            "deepLink": f"/operations/orders/{o.id}"
        })

    return results
