from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.dependencies import require_workspace
from app.auth.principal import RequestPrincipal
from app.models.operations import Vehicle, Warehouse, Order
from app.models.incidents import Incident

router = APIRouter()

@router.get("")
async def search_workspace(
    q: str = Query(..., min_length=1),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db),
):
    ws_id = principal.workspace_id
    query_str = f"%{q.strip()}%"
    results = []

    v_res = await db.execute(select(Vehicle).where(
        Vehicle.workspace_id == ws_id,
        or_(Vehicle.code.ilike(query_str), Vehicle.name.ilike(query_str), Vehicle.model.ilike(query_str), Vehicle.driver_name.ilike(query_str)),
    ).limit(5))
    for v in v_res.scalars().all():
        results.append({"type": "VEHICLE", "id": v.id, "title": f"{v.code} | {v.name}", "subtitle": v.model or "", "status": v.status, "deepLink": f"/operations/vehicles/{v.id}"})

    w_res = await db.execute(select(Warehouse).where(
        Warehouse.workspace_id == ws_id,
        or_(Warehouse.code.ilike(query_str), Warehouse.name.ilike(query_str), Warehouse.city.ilike(query_str)),
    ).limit(5))
    for w in w_res.scalars().all():
        results.append({"type": "WAREHOUSE", "id": w.id, "title": f"{w.code} | {w.name}", "subtitle": f"{w.city}, {w.state}", "status": w.status, "deepLink": f"/operations/warehouses/{w.id}"})

    i_res = await db.execute(select(Incident).where(
        Incident.workspace_id == ws_id,
        or_(Incident.code.ilike(query_str), Incident.title.ilike(query_str), Incident.summary.ilike(query_str)),
    ).limit(5))
    for i in i_res.scalars().all():
        results.append({"type": "INCIDENT", "id": i.id, "title": f"{i.code} | {i.title}", "subtitle": f"Severity: {i.severity}", "status": i.status, "deepLink": f"/incidents/{i.id}"})

    o_res = await db.execute(select(Order).where(
        Order.workspace_id == ws_id,
        or_(Order.order_number.ilike(query_str), Order.customer_name.ilike(query_str), Order.destination.ilike(query_str)),
    ).limit(5))
    for o in o_res.scalars().all():
        results.append({"type": "ORDER", "id": o.id, "title": f"{o.order_number} | {o.customer_name}", "subtitle": f"To: {o.destination}", "status": o.status, "deepLink": f"/operations/orders/{o.id}"})

    return results
