import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Warehouse(Base, TimestampMixin):
    __tablename__ = "warehouses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"wh-{uuid.uuid4().hex[:8]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    capacity_units: Mapped[int] = mapped_column(Integer, default=10000)
    current_units: Mapped[int] = mapped_column(Integer, default=0)
    dock_count: Mapped[int] = mapped_column(Integer, default=8)
    active_docks: Mapped[int] = mapped_column(Integer, default=4)
    efficiency_pct: Mapped[float] = mapped_column(Float, default=95.0)
    status: Mapped[str] = mapped_column(String(64), default="OPERATIONAL")
    version: Mapped[int] = mapped_column(Integer, default=1)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="warehouses")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="warehouse")


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"veh-{uuid.uuid4().hex[:8]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    driver_name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="IN_TRANSIT")
    current_lat: Mapped[float] = mapped_column(Float, nullable=False)
    current_lng: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)
    battery_pct: Mapped[int] = mapped_column(Integer, default=100)
    health_score: Mapped[int] = mapped_column(Integer, default=95)
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    vehicle_type_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vehicle_types.id", ondelete="SET NULL"), nullable=True, index=True)
    vehicle_type: Mapped[Optional["app.models.fleet.VehicleType"]] = relationship("app.models.fleet.VehicleType", back_populates="vehicles")

    current_route_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True)
    current_route_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="vehicles")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="vehicle")

    device: Mapped[Optional["app.models.fleet.VehicleDevice"]] = relationship("app.models.fleet.VehicleDevice", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    assignments: Mapped[List["app.models.fleet.DriverVehicleAssignment"]] = relationship("app.models.fleet.DriverVehicleAssignment", back_populates="vehicle", cascade="all, delete-orphan")
    trips: Mapped[List["app.models.logistics.Trip"]] = relationship("app.models.logistics.Trip", back_populates="vehicle", cascade="all, delete-orphan")
    telemetry_events: Mapped[List["app.models.telemetry.TelemetryEvent"]] = relationship("app.models.telemetry.TelemetryEvent", back_populates="vehicle", cascade="all, delete-orphan")
    status_snapshot: Mapped[Optional["app.models.telemetry.VehicleStatus"]] = relationship("app.models.telemetry.VehicleStatus", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")


class Route(Base, TimestampMixin):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"rt-{uuid.uuid4().hex[:8]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    origin_warehouse_id: Mapped[str] = mapped_column(String(64), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    origin_warehouse_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dest_warehouse_id: Mapped[str] = mapped_column(String(64), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    dest_warehouse_name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    avg_duration_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    traffic_condition: Mapped[str] = mapped_column(String(64), default="NORMAL")
    waypoints: Mapped[dict] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="routes")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="route")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"ord-{uuid.uuid4().hex[:8]}")
    order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="STANDARD")
    status: Mapped[str] = mapped_column(String(64), default="IN_TRANSIT")
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    deadline: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    warehouse_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True, index=True)
    warehouse: Mapped[Optional["Warehouse"]] = relationship("Warehouse", back_populates="orders")
    
    route_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True)
    route: Mapped[Optional["Route"]] = relationship("Route", back_populates="orders")
    
    vehicle_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    vehicle: Mapped[Optional["Vehicle"]] = relationship("Vehicle", back_populates="orders")
    vehicle_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="orders")
    customer_rel: Mapped[Optional["app.models.logistics.Customer"]] = relationship("app.models.logistics.Customer", back_populates="orders")
