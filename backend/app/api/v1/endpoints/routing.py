"""
NEXUS Dynamic VRPTW Routing & Fleet Optimization Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.auth.dependencies import require_onboarded, require_workspace
from app.auth.principal import RequestPrincipal
from app.services.vrptw_solver import (
    vrptw_solver,
    DeliveryStop,
    FleetVehicle,
    VRPTWOptimizationResult
)

router = APIRouter(prefix="/routing", tags=["Dynamic Fleet Routing & VRPTW"])

class VRPTWSolveRequest(BaseModel):
    depot_lat: float = Field(default=41.8781, description="Depot latitude (e.g., Chicago Hub)")
    depot_lng: float = Field(default=-87.6298, description="Depot longitude")
    start_time_min: int = Field(default=480, description="Dispatch start in minutes from midnight (480 = 08:00 AM)")
    vehicles: Optional[List[FleetVehicle]] = None
    stops: Optional[List[DeliveryStop]] = None

@router.get("/demo-scenario")
def get_demo_scenario(
    principal: RequestPrincipal = Depends(require_onboarded)
) -> Dict[str, Any]:
    """Returns a rich ready-to-solve VRPTW fleet scenario with 4 vehicles and 12 multi-stop deliveries."""
    return {
        "depot": {"name": "Central Intermodal Hub", "lat": 41.8781, "lng": -87.6298},
        "start_time_min": 480,
        "vehicles": [
            {
                "id": "VEH-ALPHA-01",
                "code": "NEXUS-PRIME-01",
                "driver_name": "Marcus Vance",
                "capacity_kg": 18000.0,
                "start_lat": 41.8781,
                "start_lng": -87.6298,
                "average_speed_kmh": 68.0,
                "fuel_consumption_liters_per_100km": 30.5
            },
            {
                "id": "VEH-BETA-02",
                "code": "NEXUS-PRIME-02",
                "driver_name": "Sarah Jenkins",
                "capacity_kg": 16000.0,
                "start_lat": 41.8781,
                "start_lng": -87.6298,
                "average_speed_kmh": 65.0,
                "fuel_consumption_liters_per_100km": 31.0
            },
            {
                "id": "VEH-GAMMA-03",
                "code": "NEXUS-PRIME-03",
                "driver_name": "Aarav Sharma",
                "capacity_kg": 20000.0,
                "start_lat": 41.8781,
                "start_lng": -87.6298,
                "average_speed_kmh": 70.0,
                "fuel_consumption_liters_per_100km": 32.0
            }
        ],
        "stops": [
            {"id": "STP-01", "order_id": "ORD-701", "customer_name": "Apex Logistics Milwaukee", "lat": 43.0389, "lng": -87.9065, "demand_kg": 3200.0, "time_window_start_min": 540, "time_window_end_min": 660, "service_duration_min": 35},
            {"id": "STP-02", "order_id": "ORD-702", "customer_name": "Rockford Precision Goods", "lat": 42.2711, "lng": -89.0940, "demand_kg": 2400.0, "time_window_start_min": 560, "time_window_end_min": 720, "service_duration_min": 30},
            {"id": "STP-03", "order_id": "ORD-703", "customer_name": "Madison Biotech Distribution", "lat": 43.0731, "lng": -89.4012, "demand_kg": 4100.0, "time_window_start_min": 600, "time_window_end_min": 750, "service_duration_min": 45},
            {"id": "STP-04", "order_id": "ORD-704", "customer_name": "Green Bay Freight Terminal", "lat": 44.5192, "lng": -88.0198, "demand_kg": 5200.0, "time_window_start_min": 660, "time_window_end_min": 840, "service_duration_min": 40},
            {"id": "STP-05", "order_id": "ORD-705", "customer_name": "South Bend Cargo Depot", "lat": 41.6764, "lng": -86.2520, "demand_kg": 3600.0, "time_window_start_min": 510, "time_window_end_min": 640, "service_duration_min": 30},
            {"id": "STP-06", "order_id": "ORD-706", "customer_name": "Grand Rapids FastTrans", "lat": 42.9634, "lng": -85.6681, "demand_kg": 4800.0, "time_window_start_min": 600, "time_window_end_min": 780, "service_duration_min": 40},
            {"id": "STP-07", "order_id": "ORD-707", "customer_name": "Kalamazoo Cold Storage", "lat": 42.2917, "lng": -85.5872, "demand_kg": 2900.0, "time_window_start_min": 540, "time_window_end_min": 700, "service_duration_min": 30},
            {"id": "STP-08", "order_id": "ORD-708", "customer_name": "Fort Wayne Cross-Dock", "lat": 41.0793, "lng": -85.1394, "demand_kg": 3700.0, "time_window_start_min": 570, "time_window_end_min": 730, "service_duration_min": 35}
        ]
    }

@router.post("/vrptw-solve", response_model=VRPTWOptimizationResult)
def solve_vrptw(
    req: VRPTWSolveRequest,
    principal: RequestPrincipal = Depends(require_onboarded)
) -> VRPTWOptimizationResult:
    """
    Executes dynamic Clarke-Wright Savings + 2-Opt route optimization subject to:
    - Vehicle payload capacity constraints
    - Delivery time windows [start_min, end_min]
    - Driver daily driving hours
    Returns optimized vehicle routes, stop sequences, and quantifiable carbon/fuel savings.
    """
    # If no vehicles or stops provided in payload, use default demo scenario
    if not req.vehicles or not req.stops:
        demo = get_demo_scenario(principal)
        vehicles = [FleetVehicle(**v) for v in demo["vehicles"]]
        stops = [DeliveryStop(**s) for s in demo["stops"]]
    else:
        vehicles = req.vehicles
        stops = req.stops

    return vrptw_solver.solve(
        depot_lat=req.depot_lat,
        depot_lng=req.depot_lng,
        vehicles=vehicles,
        stops=stops,
        start_time_min=req.start_time_min
    )
