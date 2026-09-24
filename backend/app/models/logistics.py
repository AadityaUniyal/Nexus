import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"cust-{uuid.uuid4().hex[:10]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(128), default="Operations Lead")
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), default="+1 (800) 555-0199")
    sla_tier: Mapped[str] = mapped_column(String(32), default="GOLD_95")  # PLATINUM_99, GOLD_95, STANDARD_90
    account_status: Mapped[str] = mapped_column(String(32), default="ACTIVE")
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    orders: Mapped[List["app.models.operations.Order"]] = relationship("app.models.operations.Order", back_populates="customer_rel")
    shipments: Mapped[List["Shipment"]] = relationship("Shipment", back_populates="customer", cascade="all, delete-orphan")


class Shipment(Base, TimestampMixin):
    __tablename__ = "shipments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"shp-{uuid.uuid4().hex[:10]}")
    tracking_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), default="General Freight Consignment")
    weight_kg: Mapped[float] = mapped_column(Float, default=12500.0)
    declared_value_usd: Mapped[float] = mapped_column(Float, default=45000.0)
    origin_city: Mapped[str] = mapped_column(String(128), nullable=False)
    dest_city: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="IN_TRANSIT")  # BOOKED, LOADED, IN_TRANSIT, DELIVERED, EXCEPTION
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="shipments")


class Trip(Base, TimestampMixin):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"trip-{uuid.uuid4().hex[:10]}")
    trip_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    vehicle_id: Mapped[str] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True, index=True)
    route_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True)
    origin_warehouse_id: Mapped[str] = mapped_column(String(64), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    dest_warehouse_id: Mapped[str] = mapped_column(String(64), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="IN_TRANSIT")  # PLANNED, DISPATCHED, IN_TRANSIT, DELAYED, COMPLETED, CANCELLED
    scheduled_departure: Mapped[str] = mapped_column(String(64), nullable=False)
    actual_departure: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    scheduled_arrival: Mapped[str] = mapped_column(String(64), nullable=False)
    estimated_arrival: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    risk_score: Mapped[int] = mapped_column(Integer, default=15)
    distance_km: Mapped[float] = mapped_column(Float, default=1200.0)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    vehicle: Mapped["app.models.operations.Vehicle"] = relationship("app.models.operations.Vehicle", back_populates="trips")
    driver: Mapped[Optional["app.models.fleet.Driver"]] = relationship("app.models.fleet.Driver", back_populates="trips")
    route: Mapped[Optional["app.models.operations.Route"]] = relationship("app.models.operations.Route")
    stops: Mapped[List["Stop"]] = relationship("Stop", back_populates="trip", cascade="all, delete-orphan")


class Stop(Base, TimestampMixin):
    __tablename__ = "stops"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"stop-{uuid.uuid4().hex[:10]}")
    trip_id: Mapped[str] = mapped_column(String(64), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    stop_type: Mapped[str] = mapped_column(String(32), default="DELIVERY")  # PICKUP, DELIVERY, REST_BREAK, CHARGING
    planned_eta: Mapped[str] = mapped_column(String(64), nullable=False)
    actual_arrival: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")  # PENDING, ARRIVED, DEPARTED, SKIPPED
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="stops")
