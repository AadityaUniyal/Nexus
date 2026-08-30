from typing import List, Optional, Any
from pydantic import BaseModel

# --- Warehouse Schemas ---
class WarehouseBase(BaseModel):
    code: str
    name: str
    city: str
    state: str
    lat: float
    lng: float
    capacity_units: int = 10000
    current_units: int = 0
    dock_count: int = 8
    active_docks: int = 4
    efficiency_pct: float = 95.0
    status: str = "OPERATIONAL"

class WarehouseCreate(WarehouseBase):
    workspace_id: str

class WarehouseRead(WarehouseBase):
    id: str
    workspace_id: str

    model_config = {"from_attributes": True}

# --- Vehicle Schemas ---
class VehicleBase(BaseModel):
    code: str
    name: str
    model: str
    driver_name: str
    status: str = "IN_TRANSIT"
    current_lat: float
    current_lng: float
    speed_kmh: float = 0.0
    battery_pct: int = 100
    health_score: int = 95
    current_route_id: Optional[str] = None
    current_route_name: Optional[str] = None

class VehicleCreate(VehicleBase):
    workspace_id: str

class VehicleUpdateTelemetry(BaseModel):
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    speed_kmh: Optional[float] = None
    battery_pct: Optional[int] = None
    health_score: Optional[int] = None
    status: Optional[str] = None

class VehicleRead(VehicleBase):
    id: str
    workspace_id: str

    model_config = {"from_attributes": True}

# --- Route Schemas ---
class RouteBase(BaseModel):
    code: str
    name: str
    origin_warehouse_id: str
    origin_warehouse_name: str
    dest_warehouse_id: str
    dest_warehouse_name: str
    distance_km: float
    avg_duration_mins: int
    traffic_condition: str = "NORMAL"
    waypoints: List[Any] = []

class RouteCreate(RouteBase):
    workspace_id: str

class RouteRead(RouteBase):
    id: str
    workspace_id: str

    model_config = {"from_attributes": True}

# --- Order Schemas ---
class OrderBase(BaseModel):
    order_number: str
    customer_name: str
    destination: str
    priority: str = "STANDARD"
    status: str = "IN_TRANSIT"
    total_cost: float = 0.0
    deadline: str
    vehicle_id: Optional[str] = None
    vehicle_code: Optional[str] = None

class OrderCreate(OrderBase):
    workspace_id: str

class OrderRead(OrderBase):
    id: str
    workspace_id: str

    model_config = {"from_attributes": True}
