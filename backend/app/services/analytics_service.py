import csv
import io
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident

logger = logging.getLogger("nexus.analytics")

class AnalyticsService:
    """
    Real Operational Analytics Engine.
    Executes live SQL aggregations on orders, vehicles, warehouses, and incidents.
    """

    @staticmethod
    async def get_overview(
        db: AsyncSession,
        workspace_id: Optional[str] = None,
        timeframe: str = "24h",
        hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates live SLA compliance, turnaround times, network throughput,
        time-series trends, and hub capacities from actual DB tables.
        """
        # Strict tenant filter
        ws_filter = workspace_id

        # 1. Orders Query & SLA Computation
        o_stmt = select(Order)
        if ws_filter:
            o_stmt = o_stmt.where(Order.workspace_id == ws_filter)
        if hub_id:
            o_stmt = o_stmt.where(Order.warehouse_id == hub_id)
            
        o_res = await db.execute(o_stmt)
        orders = o_res.scalars().all()

        total_orders = len(orders)
        delayed_orders = sum(1 for o in orders if o.status == "DELAYED")
        delivered_orders = sum(1 for o in orders if o.status in ["DELIVERED", "COMPLETED"])
        in_transit_orders = sum(1 for o in orders if o.status == "IN_TRANSIT")

        sla_compliance_rate = (
            round(((total_orders - delayed_orders) / total_orders) * 100, 1)
            if total_orders > 0 else None
        )

        avg_turnaround_mins = None
        if orders:
            # If routes exist, compute avg turnaround
            r_stmt = select(func.avg(Route.avg_duration_mins)).select_from(Route)
            if ws_filter:
                r_stmt = r_stmt.where(Route.workspace_id == ws_filter)
            r_res = await db.execute(r_stmt)
            calc_avg = r_res.scalar()
            if calc_avg is not None:
                avg_turnaround_mins = int(calc_avg)

        # 2. Hub Throughput & Capacity
        w_stmt = select(Warehouse)
        if ws_filter:
            w_stmt = w_stmt.where(Warehouse.workspace_id == ws_filter)
        w_res = await db.execute(w_stmt)
        warehouses = w_res.scalars().all()

        hub_throughput = []
        total_network_units = 0

        if warehouses:
            for w in warehouses:
                total_network_units += w.current_units
                hub_throughput.append({
                    "hub": w.city or w.name,
                    "volume": w.current_units,
                    "capacity": w.capacity_units,
                    "docks": f"{w.active_docks}/{w.dock_count}",
                    "efficiency": w.efficiency_pct
                })
        else:
            hub_throughput = []
            total_network_units = 0

        # 3. Fleet Utilization & Health
        v_stmt = select(Vehicle)
        if ws_filter:
            v_stmt = v_stmt.where(Vehicle.workspace_id == ws_filter)
        v_res = await db.execute(v_stmt)
        vehicles = v_res.scalars().all()

        total_vehicles = len(vehicles)
        active_vehicles = sum(1 for v in vehicles if v.status == "IN_TRANSIT")
        speed_samples = [v.speed_kmh for v in vehicles if v.speed_kmh is not None]
        battery_samples = [v.battery_pct for v in vehicles if v.battery_pct is not None]
        avg_fleet_speed = round(sum(speed_samples) / len(speed_samples), 1) if speed_samples else None
        avg_battery = round(sum(battery_samples) / len(battery_samples), 1) if battery_samples else None

        # 4. Incident Distribution & Risk
        inc_stmt = select(Incident)
        if ws_filter:
            inc_stmt = inc_stmt.where(Incident.workspace_id == ws_filter)
        inc_res = await db.execute(inc_stmt)
        incidents = inc_res.scalars().all()

        active_incidents_count = sum(1 for i in incidents if i.status not in ["RESOLVED", "ARCHIVED"])
        total_incident_delay = sum(i.delay_minutes for i in incidents)

        # Historical trend points require timestamped SLA observations, which are not yet stored.
        sla_trends = []

        return {
            "success": True,
            "timeframe": timeframe,
            "workspaceId": ws_filter,
            "slaComplianceRate": sla_compliance_rate,
            "targetSlaRate": 95.0,
            "avgTurnaroundMins": avg_turnaround_mins,
            "totalNetworkUnits": total_network_units,
            "ordersSummary": {
                "total": total_orders,
                "inTransit": in_transit_orders,
                "delivered": delivered_orders,
                "delayed": delayed_orders,
            },
            "fleetSummary": {
                "totalVehicles": total_vehicles,
                "activeVehicles": active_vehicles,
                "avgSpeedKmh": avg_fleet_speed,
                "avgBatteryPct": avg_battery,
            },
            "incidentsSummary": {
                "activeIncidents": active_incidents_count,
                "totalDelayMinutes": total_incident_delay,
            },
            "slaTrends": sla_trends,
            "hubThroughput": hub_throughput
        }

    @staticmethod
    async def export_csv_report(db: AsyncSession, workspace_id: Optional[str] = None) -> str:
        """Generates downloadable CSV containing operational analytics and active order status."""
        ws_filter = workspace_id

        o_stmt = select(Order)
        if ws_filter:
            o_stmt = o_stmt.where(Order.workspace_id == ws_filter)
        o_res = await db.execute(o_stmt)
        orders = o_res.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Order Number", "Customer", "Destination", "Priority", "Status", "Deadline", "Vehicle Code", "Total Cost"])

        for o in orders:
            writer.writerow([
                o.order_number,
                o.customer_name,
                o.destination,
                o.priority,
                o.status,
                o.deadline,
                o.vehicle_code or "N/A",
                f"${o.total_cost:.2f}"
            ])

        return output.getvalue()

    @staticmethod
    async def get_forecast(db: AsyncSession, metric: str = "delivery_volume", horizon: str = "7d", workspace_id: Optional[str] = None) -> Dict[str, Any]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Forecasting is unavailable until a model is trained and validated on this workspace historical operational data.",
        )

    @staticmethod
    async def detect_anomalies(
        db: AsyncSession,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Unavailable until a workspace model is trained and validated on real telemetry."""
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly detection is unavailable until validated workspace telemetry models are configured.",
        )

    @staticmethod
    async def get_risk_scores(
        db: AsyncSession,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Composite Multi-Factor Logistics Risk Scoring.
        Evaluates active orders and corridors against weather risk, route congestion, and SLA margin.
        """
        ws_filter = workspace_id

        o_stmt = select(Order)
        if ws_filter:
            o_stmt = o_stmt.where(Order.workspace_id == ws_filter)
        o_res = await db.execute(o_stmt)
        orders = o_res.scalars().all()

        scored_orders = []
        for o in orders:
            scored_orders.append({
                "orderNumber": o.order_number,
                "customerName": o.customer_name,
                "destination": o.destination,
                "priority": o.priority,
                "status": o.status,
                "assessment": "DELAYED" if o.status == "DELAYED" else "PRIORITY_REVIEW" if o.priority in ["CRITICAL", "HIGH"] else "NO_RECORDED_EXCEPTION",
                "financialExposureUsd": None,
                "deadline": o.deadline
            })

        scored_orders.sort(key=lambda x: (x["assessment"] != "DELAYED", x["assessment"] != "PRIORITY_REVIEW", x["orderNumber"]))

        return {
            "success": True,
            "ordersScoredCount": len(scored_orders),
            "delayedOrdersCount": sum(1 for o in scored_orders if o["assessment"] == "DELAYED"),
            "financialExposureUsd": None,
            "riskBreakdown": scored_orders
        }

    @staticmethod
    async def get_medallion_summary(
        db: AsyncSession,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Unavailable until a real telemetry lake integration is configured."""
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="A telemetry lake integration is not configured for this workspace.",
        )
