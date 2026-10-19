from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.session import get_db
from app.models.operations import Vehicle, Warehouse, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation
from app.models.system import Notification, OperationalEvent
from app.schemas.incidents import IncidentRead, IncidentTimelineRead

from app.auth.dependencies import require_workspace
from app.auth.principal import RequestPrincipal

router = APIRouter(tags=["Overview"])

@router.get("/overview")
async def get_system_overview(
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Aggregated operations overview providing high-level telemetry, KPI metrics,
    active incident summary, and SLA compliance.
    """
    ws_id = principal.workspace_id

    # 1. Vehicles
    v_stmt = select(Vehicle).where(Vehicle.workspace_id == ws_id)
    v_res = await db.execute(v_stmt)
    vehicles = v_res.scalars().all()
    total_vehicles = len(vehicles)
    active_vehicles = sum(1 for v in vehicles if v.status == "IN_TRANSIT")

    # 2. Warehouses
    w_stmt = select(Warehouse).where(Warehouse.workspace_id == ws_id)
    w_res = await db.execute(w_stmt)
    warehouses = w_res.scalars().all()
    total_warehouses = len(warehouses)

    # 3. Incidents
    i_stmt = select(Incident).where(Incident.workspace_id == ws_id).order_by(Incident.created_at.desc())
    i_res = await db.execute(i_stmt)
    incidents = i_res.scalars().all()
    active_incidents = [i for i in incidents if i.status not in ["RESOLVED", "ARCHIVED"]]
    active_incidents_count = len(active_incidents)
    top_incident = active_incidents[0] if active_incidents else (incidents[0] if incidents else None)

    # 4. Orders
    o_stmt = select(Order).where(Order.workspace_id == ws_id)
    o_res = await db.execute(o_stmt)
    orders = o_res.scalars().all()
    total_orders = len(orders)
    delayed_orders = sum(1 for o in orders if o.status == "DELAYED")

    # 5. Simulations
    s_stmt = select(func.count()).select_from(Simulation).where(Simulation.workspace_id == ws_id)
    s_res = await db.execute(s_stmt)
    simulations_count = s_res.scalar() or 0

    # 6. Notifications
    n_stmt = select(func.count()).select_from(Notification).where(Notification.read == False, Notification.workspace_id == ws_id)
    n_res = await db.execute(n_stmt)
    unread_notifications_count = n_res.scalar() or 0

    # 7. Recent Operational Events
    e_stmt = select(OperationalEvent).where(OperationalEvent.workspace_id == ws_id).order_by(OperationalEvent.created_at.desc()).limit(10)
    e_res = await db.execute(e_stmt)
    events = e_res.scalars().all()

    # KPI calculations
    sla_compliance = round(((total_orders - delayed_orders) / total_orders) * 100, 1) if total_orders else None
    fleet_utilization = round((active_vehicles / total_vehicles) * 100, 1) if total_vehicles else None
    # A blended "network efficiency" score had no validated definition or source data.
    network_efficiency = None

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
        f"{active_incidents_count} active incident(s) in this workspace."
        if total_vehicles or total_orders or total_warehouses or incidents
        else "No operational records are available yet. Add or import workspace data to see an overview."
    )

    recent_events_data = [
        {
            "id": e.id,
            "eventType": e.event_type,
            "severity": e.severity,
            "message": e.message,
            "entityType": e.entity_type,
            "entityId": e.entity_id,
            "occurredAt": e.occurred_at,
        } for e in events
    ]

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
            "networkEfficiency": network_efficiency,
            "activeSimulations": simulations_count,
            "unreadNotifications": unread_notifications_count,
        },
        "topIncident": top_incident_data,
        "briefing": briefing,
        "warehousesCount": total_warehouses,
        "vehiclesCount": total_vehicles,
        "recentEvents": recent_events_data,
    }


@router.get("/overview/stats")
async def get_overview_stats(
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Returns core operational metrics (total_orders, active_vehicles, warehouse_utilization, on_time_delivery_rate)."""
    ws_id = principal.workspace_id

    # Vehicles
    v_stmt = select(Vehicle).where(Vehicle.workspace_id == ws_id)
    v_res = await db.execute(v_stmt)
    vehicles = v_res.scalars().all()
    total_vehicles = len(vehicles)
    active_vehicles = sum(1 for v in vehicles if v.status == "IN_TRANSIT")

    # Warehouses
    w_stmt = select(Warehouse).where(Warehouse.workspace_id == ws_id)
    w_res = await db.execute(w_stmt)
    warehouses = w_res.scalars().all()
    if warehouses:
        total_capacity = sum(w.capacity_units for w in warehouses)
        total_current = sum(w.current_units for w in warehouses)
        warehouse_utilization = round((total_current / total_capacity) * 100, 1) if total_capacity > 0 else None
    else:
        warehouse_utilization = None

    # Orders
    o_stmt = select(Order).where(Order.workspace_id == ws_id)
    o_res = await db.execute(o_stmt)
    orders = o_res.scalars().all()
    total_orders = len(orders)
    delayed_orders = sum(1 for o in orders if o.status == "DELAYED")
    on_time_delivery_rate = round(((total_orders - delayed_orders) / total_orders) * 100, 1) if total_orders else None

    return {
        "total_orders": total_orders,
        "active_vehicles": active_vehicles,
        "warehouse_utilization": warehouse_utilization,
        "on_time_delivery_rate": on_time_delivery_rate,
        # CamelCase aliases for frontend compatibility
        "totalOrders": total_orders,
        "activeVehicles": active_vehicles,
        "warehouseUtilization": warehouse_utilization,
        "onTimeDeliveryRate": on_time_delivery_rate,
    }
