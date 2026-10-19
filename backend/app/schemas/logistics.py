from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class TripBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    trip_number: str = Field(..., alias="tripNumber")
    vehicle_id: str = Field(..., alias="vehicleId")
    driver_id: Optional[str] = Field(None, alias="driverId")
    route_id: Optional[str] = Field(None, alias="routeId")
    origin_warehouse_id: str = Field(..., alias="originWarehouseId")
    dest_warehouse_id: str = Field(..., alias="destWarehouseId")
    status: str = "PLANNED"  # PLANNED, DISPATCHED, IN_TRANSIT, ARRIVED, COMPLETED, CANCELLED
    scheduled_departure: str = Field(..., alias="scheduledDeparture")
    actual_departure: Optional[str] = Field(None, alias="actualDeparture")
    scheduled_arrival: str = Field(..., alias="scheduledArrival")
    estimated_arrival: Optional[str] = Field(None, alias="estimatedArrival")
    delay_minutes: int = Field(0, alias="delayMinutes")
    risk_score: int = Field(0, alias="riskScore")
    distance_km: float = Field(0.0, alias="distanceKm")


class TripCreate(TripBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")
    order_ids: Optional[List[str]] = Field(default_factory=list, alias="orderIds")


class TripUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    status: Optional[str] = None
    actual_departure: Optional[str] = Field(None, alias="actualDeparture")
    scheduled_arrival: Optional[str] = Field(None, alias="scheduledArrival")
    estimated_arrival: Optional[str] = Field(None, alias="estimatedArrival")
    delay_minutes: Optional[int] = Field(None, alias="delayMinutes")
    risk_score: Optional[int] = Field(None, alias="riskScore")
    vehicle_id: Optional[str] = Field(None, alias="vehicleId")
    driver_id: Optional[str] = Field(None, alias="driverId")
    route_id: Optional[str] = Field(None, alias="routeId")


class TripRead(TripBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")
    created_at: Optional[Any] = Field(None, alias="createdAt")
    updated_at: Optional[Any] = Field(None, alias="updatedAt")


class TripDispatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trip_id: str = Field(..., alias="tripId")
    trip_number: str = Field(..., alias="tripNumber")
    vehicle_code: str = Field(..., alias="vehicleCode")
    driver_name: Optional[str] = Field(None, alias="driverName")
    driver_pass_url: str = Field(..., alias="driverPassUrl")
    client_tracking_url: str = Field(..., alias="clientTrackingUrl")
    whatsapp_dispatch_link: str = Field(..., alias="whatsappDispatchLink")


class DetentionClockResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trip_id: str = Field(..., alias="tripId")
    trip_number: str = Field(..., alias="tripNumber")
    vehicle_code: str = Field(..., alias="vehicleCode")
    dest_warehouse_name: str = Field(..., alias="destWarehouseName")
    dock_geofence_meters: float = Field(500.0, alias="dockGeofenceMeters")
    entered_geofence: bool = Field(..., alias="enteredGeofence")
    dock_arrival_time: Optional[str] = Field(None, alias="dockArrivalTime")
    pod_submission_time: Optional[str] = Field(None, alias="podSubmissionTime")
    total_dock_wait_minutes: int = Field(0, alias="totalDockWaitMinutes")
    free_dock_minutes: int = Field(120, alias="freeDockMinutes")
    billable_detention_minutes: int = Field(0, alias="billableDetentionMinutes")
    billable_detention_hours: float = Field(0.0, alias="billableDetentionHours")
    hourly_detention_rate_inr: float = Field(500.0, alias="hourlyDetentionRateInr")
    total_detention_charge_inr: float = Field(0.0, alias="totalDetentionChargeInr")
    detention_status: str = Field(..., alias="detentionStatus")
