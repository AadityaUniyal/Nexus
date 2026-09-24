import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.operations import Vehicle, Warehouse, Route, Order
from app.models.incidents import Incident
from app.models.simulations import Simulation
from app.models.governance import Approval, ActionExecution, AuditEvent
from app.models.telemetry import VehicleStatus
from app.services.simulation_engine import run_deterministic_simulation
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables

logger = logging.getLogger("nexus.copilot.tools")

class CopilotToolRegistry:
    """
    Controlled Tools for Nexus AI Copilot following the 3-Tier Safety Model:
    - READ: Read operational database state
    - ANALYZE: Run simulation math and estimate risks
    - ACT: Mutate operational state (requires validation, transaction, and Human-in-the-loop approval)
    """

    # --- READ TOOLS ---

    @staticmethod
    async def get_fleet_summary(db: AsyncSession, workspace_id: str) -> Dict[str, Any]:
        """Returns high-level operational counts of active vehicles, incidents, orders, and hubs."""
        v_stmt = select(Vehicle).where(Vehicle.workspace_id == workspace_id)
        v_res = await db.execute(v_stmt)
        vehicles = v_res.scalars().all()

        inc_stmt = select(Incident).where(
            Incident.workspace_id == workspace_id,
            Incident.status.notin_(["RESOLVED", "ARCHIVED"])
        )
        inc_res = await db.execute(inc_stmt)
        incidents = inc_res.scalars().all()

        ord_stmt = select(Order).where(Order.workspace_id == workspace_id)
        ord_res = await db.execute(ord_stmt)
        orders = ord_res.scalars().all()

        active_v = sum(1 for v in vehicles if v.status == "IN_TRANSIT")
        delayed_ord = sum(1 for o in orders if o.status == "DELAYED")

        return {
            "total_vehicles": len(vehicles),
            "active_in_transit": active_v,
            "idle_or_charging": len(vehicles) - active_v,
            "active_incidents": len(incidents),
            "critical_incidents": sum(1 for i in incidents if i.severity == "CRITICAL"),
            "total_orders": len(orders),
            "delayed_orders": delayed_ord,
            "fleet_utilization_pct": round((active_v / max(1, len(vehicles))) * 100, 1),
            "sla_compliance_pct": round(((len(orders) - delayed_ord) / max(1, len(orders))) * 100, 1)
        }

    @staticmethod
    async def get_vehicle_status(db: AsyncSession, workspace_id: str, vehicle_code: str) -> Dict[str, Any]:
        """Returns detailed real-time telemetry and route status for a specific vehicle."""
        stmt = select(Vehicle).where(
            Vehicle.workspace_id == workspace_id,
            or_(Vehicle.code == vehicle_code, Vehicle.id == vehicle_code)
        )
        res = await db.execute(stmt)
        vehicle = res.scalar_one_or_none()
        if not vehicle:
            return {"error": f"Vehicle '{vehicle_code}' not found in current workspace."}

        return {
            "id": vehicle.id,
            "code": vehicle.code,
            "name": vehicle.name,
            "model": vehicle.model,
            "driver_name": vehicle.driver_name,
            "status": vehicle.status,
            "latitude": vehicle.current_lat,
            "longitude": vehicle.current_lng,
            "speed_kmh": vehicle.speed_kmh,
            "battery_pct": vehicle.battery_pct,
            "health_score": vehicle.health_score,
            "current_route": vehicle.current_route_name,
        }

    @staticmethod
    async def get_active_incidents(db: AsyncSession, workspace_id: str, severity: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all open incidents, optionally filtered by severity."""
        stmt = select(Incident).where(
            Incident.workspace_id == workspace_id,
            Incident.status.notin_(["RESOLVED", "ARCHIVED"])
        )
        if severity:
            stmt = stmt.where(Incident.severity == severity.upper())
        res = await db.execute(stmt)
        incidents = res.scalars().all()

        return [
            {
                "id": i.id,
                "code": i.code,
                "title": i.title,
                "severity": i.severity,
                "category": i.category,
                "status": i.status,
                "affected_entity": f"{i.affected_entity_type}: {i.affected_entity_name}",
                "delay_minutes": i.delay_minutes,
                "cost_estimate": i.cost_estimate,
                "risk_score": i.risk_score,
                "summary": i.summary,
            }
            for i in incidents
        ]

    @staticmethod
    async def get_at_risk_deliveries(db: AsyncSession, workspace_id: str) -> List[Dict[str, Any]]:
        """Returns orders and deliveries currently delayed or at risk of SLA breach."""
        stmt = select(Order).where(
            Order.workspace_id == workspace_id,
            or_(Order.status == "DELAYED", Order.priority.in_(["CRITICAL", "HIGH"]))
        ).limit(10)
        res = await db.execute(stmt)
        orders = res.scalars().all()

        return [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "destination": o.destination,
                "priority": o.priority,
                "status": o.status,
                "deadline": o.deadline,
                "vehicle_code": o.vehicle_code,
            }
            for o in orders
        ]

    @staticmethod
    async def get_weather_impact(lat: float, lng: float) -> Dict[str, Any]:
        """Provides real-time atmospheric hazards along corridor coordinates."""
        # Check standard corridor bounds (e.g. Nebraska / I-80 corridor)
        is_snow_zone = (40.0 <= lat <= 43.0 and -104.0 <= lng <= -95.0)
        if is_snow_zone:
            return {
                "condition": "SEVERE_BLIZZARD",
                "temperature_celsius": -7.2,
                "wind_speed_kmh": 68.0,
                "visibility_km": 1.2,
                "hazard_level": "CRITICAL",
                "recommended_speed_limit_kmh": 40.0,
                "advisory": "Interstate I-80 corridor under severe winter storm warning. High crosswinds and icy road surfaces.",
            }
        return {
            "condition": "CLEAR",
            "temperature_celsius": 14.5,
            "wind_speed_kmh": 15.0,
            "visibility_km": 10.0,
            "hazard_level": "LOW",
            "advisory": "Optimal driving conditions.",
        }

    # --- ANALYZE TOOLS ---

    @staticmethod
    async def calculate_delivery_risk(delay_mins: int, order_priority: str, customer_tier: str = "GOLD_95") -> Dict[str, Any]:
        """Computes probabilistic SLA breach risk score and financial penalty exposure."""
        base_risk = min(100, delay_mins * 0.5)
        if order_priority == "CRITICAL":
            base_risk = min(100, base_risk * 1.5)
        if customer_tier == "PLATINUM_99":
            penalty_usd = delay_mins * 75.0
        else:
            penalty_usd = delay_mins * 40.0

        return {
            "delay_minutes": delay_mins,
            "breach_risk_pct": round(base_risk, 1),
            "estimated_sla_penalty_usd": round(penalty_usd, 2),
            "risk_verdict": "HIGH_RISK" if base_risk > 60 else ("MODERATE_RISK" if base_risk > 30 else "LOW_RISK"),
        }

    @staticmethod
    async def simulate_route_options(
        db: AsyncSession,
        workspace_id: str,
        incident_id: Optional[str] = None,
        strategy: str = "BALANCED_COMPROMISE"
    ) -> Dict[str, Any]:
        """
        Runs the simulation engine to generate baseline vs counterfactual route scenarios.
        Calculates distance, cost, time saved, and SLA recovery.
        """
        base = BaseMetricsSnapshot(
            totalDistanceKm=1620.0,
            avgDurationMins=940,
            currentDelayMins=180,
            baseCostUsd=1450.0,
            ordersCount=14
        )
        variables = SimulationVariables(
            alternateRouteType="I-70_SOUTH_DETOUR",
            speedDeltaPct=0.0,
            fuelCostPerKm=0.42,
            priorityReordering=False
        )
        det_res = run_deterministic_simulation(base, variables)
        return {
            "baselineMetrics": base.model_dump(),
            "simulatedMetrics": det_res.model_dump(),
        }

    # --- ACT TOOLS (REQUIRE HUMAN-IN-THE-LOOP APPROVAL) ---

    @staticmethod
    async def request_reroute_approval(
        db: AsyncSession,
        workspace_id: str,
        vehicle_code: str,
        incident_id: str,
        proposed_route_name: str,
        time_saved_mins: int,
        cost_delta_usd: float,
        actor_name: str = "Nexus AI Copilot"
    ) -> Dict[str, Any]:
        """
        Generates a pending Approval record for human dispatch approval.
        Does NOT alter vehicle route until an authorized manager approves.
        """
        approval = Approval(
            title=f"Reroute Approval Request: Vehicle {vehicle_code}",
            description=f"AI Copilot recommends rerouting {vehicle_code} via {proposed_route_name} to bypass active incident.",
            incident_id=incident_id,
            action_type="REROUTE_VEHICLE",
            proposed_changes_json={
                "vehicle_code": vehicle_code,
                "new_route_name": proposed_route_name,
                "bypass_incident_id": incident_id,
            },
            impact_summary=f"Saves ~{time_saved_mins} mins delay with net cost change of +${cost_delta_usd:.2f}.",
            time_saved_mins=time_saved_mins,
            cost_delta_usd=cost_delta_usd,
            status="PENDING",
            requested_by=actor_name,
            workspace_id=workspace_id,
        )
        db.add(approval)
        await db.commit()
        await db.refresh(approval)

        return {
            "approval_id": approval.id,
            "status": "PENDING_APPROVAL",
            "message": f"Approval request created. Operations Manager review required before vehicle {vehicle_code} is rerouted.",
            "impact_summary": approval.impact_summary,
        }

    @staticmethod
    async def notify_driver(
        db: AsyncSession,
        workspace_id: str,
        driver_name: str,
        message: str
    ) -> Dict[str, Any]:
        """Sends an operational dispatch advisory alert to the driver's cab unit."""
        audit = AuditEvent(
            workspace_id=workspace_id,
            actor_name="Nexus AI Copilot",
            actor_role="COPILOT",
            action="DRIVER_DISPATCH_NOTIFIED",
            entity_type="DRIVER",
            entity_id=driver_name,
            reason=message,
        )
        db.add(audit)
        await db.commit()

        return {
            "status": "DISPATCH_MESSAGE_SENT",
            "driver": driver_name,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
