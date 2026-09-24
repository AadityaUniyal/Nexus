import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class VehicleType(Base, TimestampMixin):
    __tablename__ = "vehicle_types"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"vtype-{uuid.uuid4().hex[:10]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(64), default="CLASS_8_HEAVY_TRUCK")
    fuel_type: Mapped[str] = mapped_column(String(32), default="BATTERY_ELECTRIC")  # BATTERY_ELECTRIC, DIESEL, HYBRID, HYDROGEN
    cargo_capacity_kg: Mapped[float] = mapped_column(Float, default=24000.0)
    max_range_km: Mapped[float] = mapped_column(Float, default=480.0)
    battery_kwh: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=500.0)
    efficiency_kwh_per_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=1.3)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    vehicles: Mapped[List["app.models.operations.Vehicle"]] = relationship("app.models.operations.Vehicle", back_populates="vehicle_type")


class Driver(Base, TimestampMixin):
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"drv-{uuid.uuid4().hex[:10]}")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(64), default="+1 (555) 019-2834")
    license_number: Mapped[str] = mapped_column(String(64), nullable=False)
    license_class: Mapped[str] = mapped_column(String(32), default="CDL_CLASS_A")
    duty_status: Mapped[str] = mapped_column(String(32), default="ON_DUTY")  # ON_DUTY, DRIVING, RESTING, OFF_DUTY
    total_hours_today: Mapped[float] = mapped_column(Float, default=4.5)
    remaining_drive_hours: Mapped[float] = mapped_column(Float, default=6.5)
    current_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    assignments: Mapped[List["DriverVehicleAssignment"]] = relationship("DriverVehicleAssignment", back_populates="driver", cascade="all, delete-orphan")
    trips: Mapped[List["app.models.logistics.Trip"]] = relationship("app.models.logistics.Trip", back_populates="driver")


class VehicleDevice(Base, TimestampMixin):
    __tablename__ = "vehicle_devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"dev-{uuid.uuid4().hex[:10]}")
    vehicle_id: Mapped[str] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="CASCADE"), unique=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(64), default="AZURE_IOT")  # SAMSARA, GEOTAB, AZURE_IOT, TELEMATICS_WEBHOOK
    serial_number: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    imei: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    firmware_version: Mapped[str] = mapped_column(String(64), default="v2.4.1")
    is_online: Mapped[bool] = mapped_column(Boolean, default=True)
    last_heartbeat_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    vehicle: Mapped["app.models.operations.Vehicle"] = relationship("app.models.operations.Vehicle", back_populates="device")


class DriverVehicleAssignment(Base, TimestampMixin):
    __tablename__ = "driver_vehicle_assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"dva-{uuid.uuid4().hex[:10]}")
    driver_id: Mapped[str] = mapped_column(String(64), ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id: Mapped[str] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")  # ACTIVE, COMPLETED, CANCELLED
    assigned_at: Mapped[str] = mapped_column(String(64), nullable=False)
    unassigned_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    driver: Mapped["Driver"] = relationship("Driver", back_populates="assignments")
    vehicle: Mapped["app.models.operations.Vehicle"] = relationship("app.models.operations.Vehicle", back_populates="assignments")
