from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Warehouse Schemas ---
class WarehouseBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: str
    name: str
    city: str
    state: str
    lat: float
    lng: float
    capacity_units: int = Field(10000, alias="capacityUnits")
    current_units: int = Field(0, alias="currentUnits")
    dock_count: int = Field(8, alias="dockCount")
    active_docks: int = Field(4, alias="activeDocks")
    efficiency_pct: float = Field(95.0, alias="efficiencyPct")
    status: str = "OPERATIONAL"

class WarehouseCreate(WarehouseBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class WarehouseUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: Optional[str] = None
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    capacity_units: Optional[int] = Field(None, alias="capacityUnits")
    current_units: Optional[int] = Field(None, alias="currentUnits")
    dock_count: Optional[int] = Field(None, alias="dockCount")
    active_docks: Optional[int] = Field(None, alias="activeDocks")
    efficiency_pct: Optional[float] = Field(None, alias="efficiencyPct")
    status: Optional[str] = None

class WarehouseRead(WarehouseBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")

# --- Vehicle Schemas ---
class VehicleBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: str
    name: str
    model: str
    driver_name: str = Field(..., alias="driverName")
    status: str = "IN_TRANSIT"
    current_lat: float = Field(..., alias="currentLat")
    current_lng: float = Field(..., alias="currentLng")
    speed_kmh: float = Field(0.0, alias="speedKmh")
    battery_pct: int = Field(100, alias="batteryPct")
    health_score: int = Field(95, alias="healthScore")
    current_route_id: Optional[str] = Field(None, alias="currentRouteId")
    current_route_name: Optional[str] = Field(None, alias="currentRouteName")

class VehicleCreate(VehicleBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class VehicleUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: Optional[str] = None
    name: Optional[str] = None
    model: Optional[str] = None
    driver_name: Optional[str] = Field(None, alias="driverName")
    status: Optional[str] = None
    current_lat: Optional[float] = Field(None, alias="currentLat")
    current_lng: Optional[float] = Field(None, alias="currentLng")
    speed_kmh: Optional[float] = Field(None, alias="speedKmh")
    battery_pct: Optional[int] = Field(None, alias="batteryPct")
    health_score: Optional[int] = Field(None, alias="healthScore")
    current_route_id: Optional[str] = Field(None, alias="currentRouteId")
    current_route_name: Optional[str] = Field(None, alias="currentRouteName")

class VehicleUpdateTelemetry(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    current_lat: Optional[float] = Field(None, alias="currentLat")
    current_lng: Optional[float] = Field(None, alias="currentLng")
    speed_kmh: Optional[float] = Field(None, alias="speedKmh")
    battery_pct: Optional[int] = Field(None, alias="batteryPct")
    health_score: Optional[int] = Field(None, alias="healthScore")
    status: Optional[str] = None

class VehicleRead(VehicleBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")

# --- Route Schemas ---
class RouteBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: str
    name: str
    origin_warehouse_id: str = Field(..., alias="originWarehouseId")
    origin_warehouse_name: str = Field(..., alias="originWarehouseName")
    dest_warehouse_id: str = Field(..., alias="destWarehouseId")
    dest_warehouse_name: str = Field(..., alias="destWarehouseName")
    distance_km: float = Field(..., alias="distanceKm")
    avg_duration_mins: int = Field(..., alias="avgDurationMins")
    traffic_condition: str = Field("NORMAL", alias="trafficCondition")
    waypoints: List[Any] = []

class RouteCreate(RouteBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class RouteUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    code: Optional[str] = None
    name: Optional[str] = None
    origin_warehouse_id: Optional[str] = Field(None, alias="originWarehouseId")
    origin_warehouse_name: Optional[str] = Field(None, alias="originWarehouseName")
    dest_warehouse_id: Optional[str] = Field(None, alias="destWarehouseId")
    dest_warehouse_name: Optional[str] = Field(None, alias="destWarehouseName")
    distance_km: Optional[float] = Field(None, alias="distanceKm")
    avg_duration_mins: Optional[int] = Field(None, alias="avgDurationMins")
    traffic_condition: Optional[str] = Field(None, alias="trafficCondition")
    waypoints: Optional[List[Any]] = None

class RouteRead(RouteBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")

# --- Order Schemas ---
class OrderBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    order_number: str = Field(..., alias="orderNumber")
    customer_name: str = Field(..., alias="customerName")
    destination: str
    priority: str = "STANDARD"
    status: str = "IN_TRANSIT"
    total_cost: float = Field(0.0, alias="totalCost")
    deadline: str
    vehicle_id: Optional[str] = Field(None, alias="vehicleId")
    vehicle_code: Optional[str] = Field(None, alias="vehicleCode")

class OrderCreate(OrderBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class OrderUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    order_number: Optional[str] = Field(None, alias="orderNumber")
    customer_name: Optional[str] = Field(None, alias="customerName")
    destination: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    total_cost: Optional[float] = Field(None, alias="totalCost")
    deadline: Optional[str] = None
    vehicle_id: Optional[str] = Field(None, alias="vehicleId")
    vehicle_code: Optional[str] = Field(None, alias="vehicleCode")

class OrderRead(OrderBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")
