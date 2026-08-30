from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident

router = APIRouter()

@router.get("/snapshot")
async def get_world_snapshot(
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns spatial entities formatted specifically for the 3D World renderer:
    vehicles, warehouses, route splines, active incidents.
    """
    ws_id = principal.workspace_id

    # Fetch vehicles
    v_stmt = select(Vehicle).where(Vehicle.workspace_id == ws_id)
    v_res = await db.execute(v_stmt)
    vehicles = v_res.scalars().all()

    # Fetch warehouses
    w_stmt = select(Warehouse).where(Warehouse.workspace_id == ws_id)
    w_res = await db.execute(w_stmt)
    warehouses = w_res.scalars().all()

    # Fetch routes
    r_stmt = select(Route).where(Route.workspace_id == ws_id)
    r_res = await db.execute(r_stmt)
    routes = r_res.scalars().all()

    # Fetch active incidents
    i_stmt = select(Incident).where(Incident.workspace_id == ws_id, Incident.status != "RESOLVED")
    i_res = await db.execute(i_stmt)
    incidents = i_res.scalars().all()

    return {
        "workspaceId": ws_id,
        "vehicles": [
            {
                "id": v.id,
                "label": v.code,
                "model": v.model,
                "position": {"lat": v.current_lat, "lng": v.current_lng},
                "status": v.status,
                "speedKmh": v.speed_kmh,
                "batteryPct": v.battery_pct,
                "healthScore": v.health_score,
                "routeId": v.current_route_id
            }
            for v in vehicles
        ],
        "warehouses": [
            {
                "id": w.id,
                "label": w.code,
                "name": w.name,
                "position": {"lat": w.lat, "lng": w.lng},
                "capacityPercent": round((w.current_units / max(w.capacity_units, 1)) * 100),
                "status": w.status,
                "activeDocks": w.active_docks,
                "dockCount": w.dock_count
            }
            for w in warehouses
        ],
        "routes": [
            {
                "id": r.id,
                "name": r.name,
                "code": r.code,
                "distanceKm": r.distance_km,
                "trafficCondition": r.traffic_condition,
                "waypoints": r.waypoints
            }
            for r in routes
        ],
        "incidents": [
            {
                "id": inc.id,
                "code": inc.code,
                "title": inc.title,
                "severity": inc.severity,
                "status": inc.status,
                "affectedEntityType": inc.affected_entity_type,
                "affectedEntityId": inc.affected_entity_id,
                "delayMinutes": inc.delay_minutes
            }
            for inc in incidents
        ]
    }
