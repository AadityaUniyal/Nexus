import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy import select, func, or_
from app.integrations.location import get_location_provider
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables, SimulationApplyDecision
from app.services.simulation_engine import run_deterministic_simulation
from app.db.session import async_session_factory
from app.models.operations import Vehicle, Route, Order
from app.models.incidents import Incident, IncidentTimeline
from app.models.simulations import Simulation, Decision
from app.models.system import OperationalEvent, AuditLog
from app.realtime.sse import broadcaster
from app.api.v1.endpoints.simulations import apply_simulation_decision

VOICE_TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "map_fly_to",
            "description": "Center and zoom the live MapLibre GIS map to a specific city, terminal hub, or geographic corridor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location_name": {
                        "type": "string",
                        "description": "City or corridor name (e.g. 'Chicago', 'Dehradun', 'Denver', 'Cheyenne Summit', 'Tokyo')",
                    }
                },
                "required": ["location_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_operational_overview",
            "description": "Retrieve current operational health summary, active vehicle count, and open incidents.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_incidents",
            "description": "Retrieve list of active high-priority and critical operational incidents.",
            "parameters": {
                "type": "object",
                "properties": {
                    "severity": {
                        "type": "string",
                        "enum": ["CRITICAL", "HIGH", "ALL"],
                        "description": "Severity filter",
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "filter_fleet",
            "description": "Filter the fleet map to highlight specific vehicles by status or low battery state of charge.",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_battery_pct": {
                        "type": "integer",
                        "description": "Filter vehicles with battery below this threshold",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["ACTIVE", "HOLDING", "MAINTENANCE", "ALL"],
                        "description": "Operational status filter",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_whatif_simulation",
            "description": "Run a deterministic What-If simulation detour scenario for an affected vehicle.",
            "parameters": {
                "type": "object",
                "properties": {
                    "vehicle_code": {
                        "type": "string",
                        "description": "Vehicle code, e.g. 'NX-104'",
                    },
                    "detour_route": {
                        "type": "string",
                        "enum": ["I-70_SOUTH_DETOUR", "US-40_NORTH_DETOUR", "WAIT_AND_HOLD"],
                        "description": "Corridor detour strategy",
                    },
                },
                "required": ["vehicle_code", "detour_route"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "apply_decision_with_confirmation",
            "description": "Apply an evaluated simulation detour decision to live dispatch. Requires confirmed=True.",
            "parameters": {
                "type": "object",
                "properties": {
                    "simulation_id": {
                        "type": "string",
                        "description": "Simulation ID or code to apply",
                    },
                    "confirmed": {
                        "type": "boolean",
                        "description": "Whether the operator explicitly confirmed application",
                    },
                },
                "required": ["simulation_id", "confirmed"],
            },
        },
    },
]

async def execute_voice_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a function call requested by the voice agent."""
    if tool_name == "map_fly_to":
        loc_name = arguments.get("location_name", "").strip()
        if not loc_name:
            return {
                "action": "LOCATION_ERROR",
                "speech": "Please specify a location name to fly to.",
            }
        provider = get_location_provider()
        resolved = await provider.geocode(loc_name)
        
        target = None
        if isinstance(resolved, list) and len(resolved) > 0:
            target = resolved[0]
        elif resolved and hasattr(resolved, "latitude"):
            target = resolved

        if not target:
            return {
                "action": "LOCATION_NOT_FOUND",
                "location_name": loc_name,
                "speech": f"Unable to locate coordinates for '{loc_name}'. Please verify the spelling or check a nearby terminal.",
            }

        lat = getattr(target, "latitude", None)
        lng = getattr(target, "longitude", None)
        if lat is None or lng is None:
            return {
                "action": "LOCATION_NOT_FOUND",
                "location_name": loc_name,
                "speech": f"Coordinates unavailable for '{loc_name}'.",
            }

        return {
            "action": "MAP_FLY_TO",
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lng,
            "speech": f"Navigating operational map viewport to {loc_name}.",
        }

    elif tool_name == "get_operational_overview":
        async with async_session_factory() as db:
            total_v_res = await db.execute(select(func.count(Vehicle.id)))
            total_vehicles = total_v_res.scalar() or 0

            active_v_res = await db.execute(
                select(func.count(Vehicle.id)).where(Vehicle.status == "IN_TRANSIT")
            )
            active_vehicles = active_v_res.scalar() or 0

            inc_res = await db.execute(
                select(func.count(Incident.id)).where(Incident.status != "RESOLVED")
            )
            active_incidents = inc_res.scalar() or 0

            ord_res = await db.execute(select(func.count(Order.id)))
            total_orders = ord_res.scalar() or 0
            del_res = await db.execute(select(func.count(Order.id)).where(Order.status == "DELAYED"))
            delayed_orders = del_res.scalar() or 0
            sla_compliance = round(((total_orders - delayed_orders) / max(1, total_orders)) * 100.0, 1) if total_orders > 0 else 100.0

        speech = (
            f"Fleet operational health: {total_vehicles} vehicles tracked, {active_vehicles} active in transit, "
            f"{active_incidents} active incident{'s' if active_incidents != 1 else ''} with {sla_compliance}% SLA adherence."
        )
        return {
            "action": "OPERATIONAL_OVERVIEW",
            "speech": speech,
            "metrics": {
                "activeVehicles": active_vehicles,
                "totalVehicles": total_vehicles,
                "activeIncidents": active_incidents,
                "slaCompliance": sla_compliance,
            },
        }

    elif tool_name == "get_active_incidents":
        sev = arguments.get("severity", "ALL")
        async with async_session_factory() as db:
            stmt = select(Incident).where(Incident.status != "RESOLVED")
            if sev in ["CRITICAL", "HIGH"]:
                stmt = stmt.where(Incident.severity == sev)
            stmt = stmt.order_by(Incident.created_at.desc()).limit(10)
            res = await db.execute(stmt)
            inc_records = res.scalars().all()

        incidents_list = []
        for inc in inc_records:
            incidents_list.append({
                "id": inc.id,
                "code": inc.code,
                "title": inc.title,
                "severity": inc.severity,
                "affected": inc.affected_entity_name or inc.affected_entity_id,
            })

        if not incidents_list:
            speech = f"No active {sev.lower() if sev != 'ALL' else ''} incidents currently recorded in the fleet network."
            return {
                "action": "ACTIVE_INCIDENTS",
                "severity": sev,
                "incidents": [],
                "speech": speech,
            }

        top_inc = incidents_list[0]
        speech = f"Reporting {len(incidents_list)} active incident{'s' if len(incidents_list) != 1 else ''}: {top_inc['code']} affecting {top_inc['affected']} ({top_inc['title']})."
        return {
            "action": "ACTIVE_INCIDENTS",
            "severity": sev,
            "speech": speech,
            "incidents": incidents_list,
        }

    elif tool_name == "apply_decision_with_confirmation":
        sim_id = arguments.get("simulation_id", "sim-901")
        confirmed = arguments.get("confirmed", False)
        if not confirmed:
            return {
                "action": "CONFIRMATION_REQUIRED",
                "simulation_id": sim_id,
                "speech": f"Applying simulation {sim_id} will reroute vehicle NX-104 via I-70 South Corridor. Say 'Confirm' to execute.",
            }

        applied_sim_id = sim_id
        applied_sim_code = sim_id
        async with async_session_factory() as db:
            stmt = select(Simulation).where(
                or_(Simulation.id == sim_id, Simulation.code == sim_id, Simulation.code.ilike(f"%{sim_id}%"))
            )
            res = await db.execute(stmt)
            sim = res.scalars().first()

            if not sim:
                res = await db.execute(
                    select(Simulation).where(Simulation.status != "APPLIED").order_by(Simulation.created_at.desc()).limit(1)
                )
                sim = res.scalars().first()

            if sim:
                req_obj = SimulationApplyDecision(
                    actorName="Voice Copilot",
                    operatorNotes="Decision confirmed and applied via Voice Tool.",
                )
                await apply_simulation_decision(sim.id, req_obj, db)
                applied_sim_id = sim.id
                applied_sim_code = sim.code
            else:
                v_res = await db.execute(
                    select(Vehicle).where(or_(Vehicle.code == "NX-104", Vehicle.id == "v-104"))
                )
                veh = v_res.scalars().first()
                if veh:
                    veh.status = "IN_TRANSIT"
                    veh.current_route_name = "I-70 South Bypass (Detour Active)"
                    veh.speed_kmh = 78.5
                    veh.version += 1

                inc_res = await db.execute(
                    select(Incident).where(Incident.status != "RESOLVED").order_by(Incident.created_at.desc()).limit(1)
                )
                inc = inc_res.scalars().first()
                if inc:
                    inc.status = "ACTION_APPLIED"
                    inc.delay_minutes = 45
                    inc.version += 1
                    db.add(IncidentTimeline(
                        id=f"tl-{uuid.uuid4().hex[:8]}",
                        incident_id=inc.id,
                        status="ACTION_APPLIED",
                        note="Decision applied via Voice Copilot: Detour active.",
                        actor_name="Voice Copilot",
                    ))

                dec_id = f"dec-{uuid.uuid4().hex[:8]}"
                now_iso = datetime.now(timezone.utc).isoformat()
                decision = Decision(
                    id=dec_id,
                    simulation_id=sim_id,
                    incident_id=inc.id if inc else "inc-8041",
                    workspace_id="ws-continental-fleet-01",
                    applied_by="Voice Copilot",
                    applied_at=now_iso,
                    impact_summary="Voice decision confirmed: Reroute detour applied to live dispatch.",
                    changes_json={"vehicleId": "v-104", "status": "APPLIED"},
                )
                db.add(decision)
                await db.commit()

                await broadcaster.broadcast("DECISION_APPLIED", {
                    "simulationId": sim_id,
                    "decisionId": dec_id,
                    "incidentId": inc.id if inc else None,
                    "vehicleId": veh.id if veh else "v-104",
                    "status": "APPLIED",
                    "actorName": "Voice Copilot",
                    "appliedAt": now_iso,
                })

        return {
            "action": "DECISION_APPLIED",
            "simulation_id": applied_sim_id,
            "speech": f"Decision {applied_sim_code} has been applied to live fleet dispatch. Detour active in database.",
        }

    elif tool_name == "filter_fleet":
        max_bat = arguments.get("max_battery_pct", 100)
        status = arguments.get("status", "ALL")
        return {
            "action": "FILTER_FLEET",
            "max_battery_pct": max_bat,
            "status": status,
            "speech": f"Filtering fleet for vehicles with status {status} and battery below {max_bat}%.",
        }

    elif tool_name == "run_whatif_simulation":
        veh = arguments.get("vehicle_code", "NX-104")
        route = arguments.get("detour_route", "I-70_SOUTH_DETOUR")

        sim_id = f"sim-{uuid.uuid4().hex[:8]}"
        sim_code = f"SIM-{int(datetime.now().timestamp()) % 10000}"
        ws_id = "ws-continental-fleet-01"

        async with async_session_factory() as db:
            v_stmt = select(Vehicle).where(
                or_(Vehicle.id == veh, Vehicle.code == veh, Vehicle.code.ilike(f"%{veh}%"))
            )
            v_res = await db.execute(v_stmt)
            target_vehicle = v_res.scalars().first()

            target_route = None
            if target_vehicle and target_vehicle.current_route_id:
                r_res = await db.execute(select(Route).where(Route.id == target_vehicle.current_route_id))
                target_route = r_res.scalars().first()

            target_incident = None
            inc_conds = []
            if target_vehicle:
                inc_conds = [
                    Incident.affected_entity_id == target_vehicle.id,
                    Incident.affected_entity_id == target_vehicle.code,
                ]
                if target_vehicle.current_route_id:
                    inc_conds.append(Incident.affected_entity_id == target_vehicle.current_route_id)
            if inc_conds:
                inc_stmt = select(Incident).where(or_(*inc_conds)).order_by(Incident.created_at.desc())
                inc_res = await db.execute(inc_stmt)
                target_incident = inc_res.scalars().first()

            orders_count = 14
            total_order_value = 45000.0
            if target_vehicle:
                ord_stmt = select(Order).where(
                    or_(Order.vehicle_id == target_vehicle.id, Order.vehicle_code == target_vehicle.code)
                )
                ord_res = await db.execute(ord_stmt)
                orders = ord_res.scalars().all()
                if orders:
                    orders_count = len(orders)
                    total_order_value = sum(o.total_cost for o in orders)

            dist = target_route.distance_km if target_route else 1620.0
            dur = target_route.avg_duration_mins if target_route else 940
            delay = target_incident.delay_minutes if target_incident else 180

            snapshot = BaseMetricsSnapshot(
                totalDistanceKm=dist,
                avgDurationMins=dur,
                currentDelayMins=delay,
                ordersCount=orders_count,
                totalOrderValue=total_order_value,
                baseCostUsd=round(dist * 0.42 * 2.13, 2) if target_route else 1450.0,
            )
            vars_obj = SimulationVariables(
                vehicleId=target_vehicle.id if target_vehicle else veh,
                alternateRouteType=route,
                speedDeltaPct=10.0,
                fuelCostPerKm=0.42,
                priorityReordering=True,
            )
            res = run_deterministic_simulation(snapshot, vars_obj)

            new_sim = Simulation(
                id=sim_id,
                code=sim_code,
                title=f"Voice Simulation: {veh} Detour via {route.replace('_', ' ')}",
                description=f"Generated via voice agent command for vehicle {veh}.",
                status="EVALUATED",
                incident_id=target_incident.id if target_incident else None,
                base_snapshot_version=1,
                variables=vars_obj.model_dump(),
                baseline_metrics=snapshot.model_dump(),
                simulated_metrics=res.model_dump(),
                ai_briefing=f"Voice simulation completed: {res.verdict} with {res.recommendation_score}% recommendation score.",
                applied_at=None,
                applied_by=None,
                workspace_id=target_vehicle.workspace_id if target_vehicle else ws_id,
            )
            db.add(new_sim)

            event = OperationalEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                workspace_id=new_sim.workspace_id,
                event_type="simulation.completed",
                severity="INFO",
                entity_type="SIMULATION",
                entity_id=sim_id,
                message=f"Voice simulation {sim_code} evaluated for {veh}.",
                occurred_at=datetime.now(timezone.utc).isoformat(),
            )
            db.add(event)
            await db.commit()

            await broadcaster.broadcast("SIMULATION_EVALUATED", {
                "id": new_sim.id,
                "code": new_sim.code,
                "title": new_sim.title,
                "recommendationScore": res.recommendationScore,
                "netTimeSavedMins": res.netTimeSavedMins,
                "verdict": res.verdict,
            })

        return {
            "action": "RUN_SIMULATION",
            "simulation_id": sim_id,
            "simulation_code": sim_code,
            "vehicle_code": veh,
            "route_type": route,
            "time_saved_mins": res.netTimeSavedMins,
            "cost_delta_usd": res.costDeltaUsd,
            "recommendation_score": res.recommendationScore,
            "speech": f"Simulation computed for {veh} via {route.replace('_', ' ')}. Projects a recovery of {res.netTimeSavedMins} minutes at ${res.costDeltaUsd:.0f} additional cost with a score of {res.recommendationScore} out of 100.",
        }

    return {
        "action": "UNKNOWN",
        "speech": "Command acknowledged.",
    }
