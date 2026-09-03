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

    workspace_id: str = Field(..., alias="workspaceId")

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

    workspace_id: str = Field(..., alias="workspaceId")

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

    workspace_id: str = Field(..., alias="workspaceId")

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

    workspace_id: str = Field(..., alias="workspaceId")

class OrderRead(OrderBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")
