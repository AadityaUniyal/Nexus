import json
from typing import Dict, Any, List
from app.integrations.location import get_location_provider
from app.schemas.simulations import BaseMetricsSnapshot, SimulationVariables
from app.services.simulation_engine import run_deterministic_simulation

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
]

async def execute_voice_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a function call requested by the voice agent."""
    if tool_name == "map_fly_to":
        loc_name = arguments.get("location_name", "Chicago")
        provider = get_location_provider()
        resolved = await provider.geocode(loc_name)
        
        target = None
        if isinstance(resolved, list) and len(resolved) > 0:
            target = resolved[0]
        elif resolved and hasattr(resolved, "latitude"):
            target = resolved

        lat = getattr(target, "latitude", 41.8781) if target else 41.8781
        lng = getattr(target, "longitude", -87.6298) if target else -87.6298

        return {
            "action": "MAP_FLY_TO",
            "location_name": loc_name,
            "latitude": lat,
            "longitude": lng,
            "speech": f"Navigating operational map viewport to {loc_name}.",
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
        
        snapshot = BaseMetricsSnapshot(
            totalDistanceKm=1620.0,
            avgDurationMins=940,
            currentDelayMins=180,
            ordersCount=14,
            totalOrderValue=45000.0,
            baseCostUsd=1450.0,
        )
        vars_obj = SimulationVariables(
            vehicleId=veh,
            alternateRouteType=route,
            speedDeltaPct=10,
            fuelCostPerKm=0.42,
            priorityReordering=True,
        )
        res = run_deterministic_simulation(snapshot, vars_obj)
        return {
            "action": "RUN_SIMULATION",
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
