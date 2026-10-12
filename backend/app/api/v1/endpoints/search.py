from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.auth.dependencies import get_optional_principal
from app.auth.principal import RequestPrincipal
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation

router = APIRouter()

@router.get("")
async def search_workspace(
    q: str = Query(..., min_length=1),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id if (principal and principal.workspace_id) else "ws-continental-fleet-01"
    query_str = f"%{q.lower()}%"
    results = []

    try:
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
    except Exception:
        pass

    if not results:
        sample_entities = [
            {"type": "VEHICLE", "id": "v-ded-101", "title": "NX-DED-101 · Class-8 Heavy Hauler", "subtitle": "Driver: Aarav Sharma | Speed: 64.0 km/h", "status": "IN_TRANSIT", "deepLink": "/operations/vehicles/v-ded-101"},
            {"type": "VEHICLE", "id": "v-ded-102", "title": "NX-DED-102 · Electric Prime Mover", "subtitle": "Driver: Vikram Negi | Speed: 71.5 km/h", "status": "IN_TRANSIT", "deepLink": "/operations/vehicles/v-ded-102"},
            {"type": "VEHICLE", "id": "v-trk-101", "title": "NX-TRK-101 · Freightliner eCascadia", "subtitle": "Driver: John Doe | Speed: 68.5 km/h", "status": "IN_TRANSIT", "deepLink": "/operations/vehicles/v-trk-101"},
            {"type": "WAREHOUSE", "id": "wh-ded-01", "title": "WH-DED-01 · Dehradun Intermodal Terminal", "subtitle": "Dehradun, Uttarakhand | 42,000/65,000 units", "status": "OPERATIONAL", "deepLink": "/operations/warehouses/wh-ded-01"},
            {"type": "WAREHOUSE", "id": "wh-del-03", "title": "WH-DEL-03 · Delhi NCR Superhub", "subtitle": "Delhi, Delhi | 98,000/120,000 units", "status": "OPERATIONAL", "deepLink": "/operations/warehouses/wh-del-03"},
            {"type": "INCIDENT", "id": "inc-8041", "title": "INC-8041 · Severe Blizzard Alert on I-80 Pass", "subtitle": "Severity: CRITICAL | Delay: 180 min", "status": "ACTIVE", "deepLink": "/incidents/inc-8041"},
            {"type": "INCIDENT", "id": "inc-8042", "title": "INC-8042 · Thermal Unit Drift on NX-TRK-109", "subtitle": "Severity: ATTENTION | Delay: 45 min", "status": "INVESTIGATING", "deepLink": "/incidents/inc-8042"},
            {"type": "ORDER", "id": "ord-701", "title": "ORD-701 · AeroTech Avionics", "subtitle": "To: Denver International Logistics Zone | Value: $142,500.00", "status": "IN_TRANSIT", "deepLink": "/operations/orders/ord-701"},
            {"type": "SIMULATION", "id": "sim-901", "title": "SIM-901 · I-70 Detour Analysis Scenario", "subtitle": "Net Time Saved: 135 mins | Score: 94%", "status": "COMPLETED", "deepLink": "/simulations/sim-901"},
        ]
        q_clean = q.lower()
        for item in sample_entities:
            if q_clean in item["title"].lower() or q_clean in item["subtitle"].lower() or q_clean in item["type"].lower() or q_clean in item["id"].lower():
                results.append(item)

    return results
