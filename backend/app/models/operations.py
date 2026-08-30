import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Warehouse(Base, TimestampMixin):
    __tablename__ = "warehouses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
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

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    workspace: Mapped["Workspace"] = relationship("app.models.user.Workspace", back_populates="warehouses")

class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
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
    
    current_route_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("routes.id"), nullable=True)
    current_route_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    workspace: Mapped["Workspace"] = relationship("app.models.user.Workspace", back_populates="vehicles")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="vehicle")

class Route(Base, TimestampMixin):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    origin_warehouse_id: Mapped[str] = mapped_column(String(64), nullable=False)
    origin_warehouse_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dest_warehouse_id: Mapped[str] = mapped_column(String(64), nullable=False)
    dest_warehouse_name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    avg_duration_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    traffic_condition: Mapped[str] = mapped_column(String(64), default="NORMAL")
    waypoints: Mapped[dict] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    workspace: Mapped["Workspace"] = relationship("app.models.user.Workspace", back_populates="routes")

class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="STANDARD")
    status: Mapped[str] = mapped_column(String(64), default="IN_TRANSIT")
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    deadline: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    vehicle_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vehicles.id"), nullable=True)
    vehicle: Mapped[Optional["Vehicle"]] = relationship("Vehicle", back_populates="orders")
    vehicle_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
