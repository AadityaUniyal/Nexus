"""Historical views backed only by persisted workspace trips and telemetry."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.logistics import Trip
from app.models.operations import Route, Vehicle, Warehouse
from app.models.telemetry import TelemetryEvent


class HistoryService:
    @staticmethod
    async def get_past_services(
        db: AsyncSession,
        workspace_id: str,
        time_range_days: int = 30,
        sector: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        city: Optional[str] = None,
    ) -> Dict[str, Any]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=time_range_days)
        trips = (await db.execute(select(Trip).where(
            Trip.workspace_id == workspace_id,
            Trip.status.in_(["COMPLETED", "COMPLETED_WITH_EXCEPTION"]),
            Trip.updated_at >= cutoff,
        ).order_by(Trip.updated_at.desc()).limit(limit))).scalars().all()
        services: List[Dict[str, Any]] = []
        for trip in trips:
            route = (await db.execute(select(Route).where(Route.id == trip.route_id, Route.workspace_id == workspace_id))).scalar_one_or_none() if trip.route_id else None
            origin = (await db.execute(select(Warehouse).where(Warehouse.id == trip.origin_warehouse_id, Warehouse.workspace_id == workspace_id))).scalar_one_or_none()
            destination = (await db.execute(select(Warehouse).where(Warehouse.id == trip.dest_warehouse_id, Warehouse.workspace_id == workspace_id))).scalar_one_or_none()
            trip_status = trip.status
            if status and status.upper() != trip_status:
                continue
            if city and city.casefold() not in ((origin.city if origin else "") + " " + (destination.city if destination else "")).casefold():
                continue
            services.append({
                "id": trip.id,
                "tracking_code": trip.trip_number,
                "origin": origin.name if origin else None,
                "destination": destination.name if destination else None,
                "distance_km": trip.distance_km,
                "sector": None,
                "status": trip_status,
                "completed_at": trip.updated_at.isoformat() if trip.updated_at else None,
                "duration_actual_mins": None,
                "time_recovered_mins": None,
                "cost_saved_usd": None,
                "carbon_offset_kg": None,
                "on_time_sla_met": trip.delay_minutes <= 0 if trip.delay_minutes is not None else None,
                "autonomous_reroutes_applied": None,
                "cryptographic_proof": None,
            })
        observations = [s["on_time_sla_met"] for s in services if s["on_time_sla_met"] is not None]
        return {
            "summary": {
                "time_range_days": time_range_days,
                "total_fulfilled_services": len(services),
                "sla_compliance_rate_pct": round(sum(observations) / len(observations) * 100, 2) if observations else None,
                "total_cost_recovered_usd": None,
                "total_carbon_offset_kg": None,
                "avg_time_saved_per_trip_mins": None,
            },
            "services": services,
        }

    @staticmethod
    async def get_fleet_time_travel_snapshot(db: AsyncSession, workspace_id: str, timestamp_epoch: Optional[float] = None) -> Dict[str, Any]:
        target = datetime.fromtimestamp(timestamp_epoch, tz=timezone.utc) if timestamp_epoch else datetime.now(timezone.utc)
        cutoff = target.isoformat()
        rows = (await db.execute(
            select(TelemetryEvent, Vehicle)
            .join(Vehicle, Vehicle.id == TelemetryEvent.vehicle_id)
            .where(TelemetryEvent.workspace_id == workspace_id, Vehicle.workspace_id == workspace_id, TelemetryEvent.device_timestamp <= cutoff)
            .order_by(TelemetryEvent.device_timestamp.desc())
        )).all()
        latest = {}
        for event, vehicle in rows:
            if vehicle.id not in latest:
                latest[vehicle.id] = {
                    "vehicle_id": vehicle.code,
                    "driver_callsign": vehicle.driver_name,
                    "latitude": event.lat,
                    "longitude": event.lng,
                    "speed_kmh": event.speed_kmh,
                    "heading_deg": event.heading,
                    "battery_or_fuel_pct": event.battery_pct if event.battery_pct is not None else event.fuel_pct,
                    "temperature_celsius": event.temp_celsius,
                    "telemetry_health": "RECORDED",
                    "active_route_code": vehicle.current_route_name,
                }
        return {
            "snapshot_time_iso": target.isoformat(),
            "snapshot_timestamp": target.timestamp(),
            "total_active_assets": len(latest),
            "fleet_state": list(latest.values()),
            "system_status": "RECORDED_TELEMETRY" if latest else "NO_HISTORICAL_TELEMETRY",
        }

    @staticmethod
    async def get_service_sla_trends(db: AsyncSession, workspace_id: str, months_count: int = 6) -> Dict[str, Any]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=months_count * 31)
        trips = (await db.execute(select(Trip).where(
            Trip.workspace_id == workspace_id,
            Trip.status.in_(["COMPLETED", "COMPLETED_WITH_EXCEPTION"]),
            Trip.updated_at >= cutoff,
        ))).scalars().all()
        groups: dict[str, list[Trip]] = defaultdict(list)
        for trip in trips:
            if trip.updated_at:
                groups[trip.updated_at.strftime("%Y-%m")].append(trip)
        trends = []
        for month, rows in sorted(groups.items()):
            on_time = [trip.delay_minutes <= 0 for trip in rows if trip.delay_minutes is not None]
            trends.append({
                "month": month,
                "dispatches_completed": len(rows),
                "on_time_delivery_rate_pct": round(sum(on_time) / len(on_time) * 100, 2) if on_time else None,
                "autonomous_reroutes_executed": None,
                "incident_response_time_avg_seconds": None,
                "total_cost_saved_usd": None,
                "carbon_emissions_avoided_tons": None,
            })
        return {
            "timeframe_months": months_count,
            "monthly_performance_trends": trends,
            "net_aggregate_savings_usd": None,
            "net_aggregate_carbon_saved_tons": None,
        }
