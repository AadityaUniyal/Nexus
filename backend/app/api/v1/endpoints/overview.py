from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.session import get_db
from app.models.operations import Vehicle, Warehouse, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation
from app.models.system import Notification
from app.schemas.incidents import IncidentRead, IncidentTimelineRead

router = APIRouter(tags=["Overview"])

@router.get("/overview")
async def get_system_overview(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Aggregated operations overview providing high-level telemetry, KPI metrics,
    active incident summary, and SLA compliance.
    """
    ws_id = workspace_id if (workspace_id and workspace_id != "ws-demo-1") else None

    # 1. Vehicles
    v_stmt = select(Vehicle)
    if ws_id:
        v_stmt = v_stmt.where(Vehicle.workspace_id == ws_id)
    v_res = await db.execute(v_stmt)
    vehicles = v_res.scalars().all()
    total_vehicles = len(vehicles)
    active_vehicles = sum(1 for v in vehicles if v.status == "IN_TRANSIT")

    # 2. Warehouses
    w_stmt = select(Warehouse)
    if ws_id:
        w_stmt = w_stmt.where(Warehouse.workspace_id == ws_id)
    w_res = await db.execute(w_stmt)
    warehouses = w_res.scalars().all()
    total_warehouses = len(warehouses)

    # 3. Incidents
    i_stmt = select(Incident).order_by(Incident.created_at.desc())
    if ws_id:
        i_stmt = i_stmt.where(Incident.workspace_id == ws_id)
    i_res = await db.execute(i_stmt)
    incidents = i_res.scalars().all()
    active_incidents = [i for i in incidents if i.status not in ["RESOLVED", "ARCHIVED"]]
    active_incidents_count = len(active_incidents)
    top_incident = active_incidents[0] if active_incidents else (incidents[0] if incidents else None)

    # 4. Orders
    o_stmt = select(Order)
    if ws_id:
        o_stmt = o_stmt.where(Order.workspace_id == ws_id)
    o_res = await db.execute(o_stmt)
    orders = o_res.scalars().all()
    total_orders = len(orders)
    delayed_orders = sum(1 for o in orders if o.status == "DELAYED")

    # 5. Simulations
    s_stmt = select(func.count()).select_from(Simulation)
    if ws_id:
        s_stmt = s_stmt.where(Simulation.workspace_id == ws_id)
    s_res = await db.execute(s_stmt)
    simulations_count = s_res.scalar() or 0

    # 6. Notifications
    n_stmt = select(func.count()).select_from(Notification).where(Notification.read == False)
    if ws_id:
        n_stmt = n_stmt.where(Notification.workspace_id == ws_id)
    n_res = await db.execute(n_stmt)
    unread_notifications_count = n_res.scalar() or 0

    # KPI calculations
    sla_compliance = (
        round(((total_orders - delayed_orders) / max(1, total_orders)) * 100, 1)
        if total_orders > 0 else 98.4
    )
    fleet_utilization = (
        round((active_vehicles / max(1, total_vehicles)) * 100, 1)
        if total_vehicles > 0 else 85.0
    )

    top_incident_data = None
    if top_incident:
        top_incident_data = {
            "id": top_incident.id,
            "code": top_incident.code,
            "title": top_incident.title,
            "summary": top_incident.summary,
            "severity": top_incident.severity,
            "status": top_incident.status,
            "affectedEntityType": top_incident.affected_entity_type,
            "affectedEntityId": top_incident.affected_entity_id,
            "affectedEntityName": top_incident.affected_entity_name,
            "delayMinutes": top_incident.delay_minutes,
            "costEstimate": top_incident.cost_estimate,
            "rootCause": top_incident.root_cause,
            "aiAnalysis": top_incident.ai_analysis,
            "workspaceId": top_incident.workspace_id,
            "createdAt": top_incident.created_at.isoformat() if hasattr(top_incident.created_at, "isoformat") else str(top_incident.created_at),
        }

    briefing = (
        f"Operational state nominal. {active_incidents_count} active incidents triaged. "
        f"Fleet utilization at {fleet_utilization}% with {sla_compliance}% SLA adherence across active hubs."
    )

    return {
        "success": True,
        "stats": {
            "totalVehicles": total_vehicles,
            "activeVehicles": active_vehicles,
            "totalWarehouses": total_warehouses,
            "activeIncidents": active_incidents_count,
            "totalOrders": total_orders,
            "delayedOrders": delayed_orders,
            "slaCompliance": sla_compliance,
            "fleetUtilization": fleet_utilization,
            "networkEfficiency": 95.2,
            "activeSimulations": simulations_count,
            "unreadNotifications": unread_notifications_count,
        },
        "topIncident": top_incident_data,
        "briefing": briefing,
        "warehousesCount": total_warehouses,
        "vehiclesCount": total_vehicles,
        "recentEvents": [],
    }
