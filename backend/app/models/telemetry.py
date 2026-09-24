import uuid
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class TelemetryEvent(Base, TimestampMixin):
    __tablename__ = "telemetry_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"telem-{uuid.uuid4().hex[:14]}")
    vehicle_id: Mapped[str] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)
    heading: Mapped[float] = mapped_column(Float, default=0.0)
    battery_pct: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fuel_pct: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engine_state: Mapped[str] = mapped_column(String(32), default="RUNNING")  # RUNNING, IDLE, OFF, CHARGING
    temp_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    device_timestamp: Mapped[str] = mapped_column(String(64), nullable=False)
    external_device_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    source_provider: Mapped[str] = mapped_column(String(64), default="REST_INGESTION")  # SAMSARA, GEOTAB, AZURE_IOT, FABRIC, REST_INGESTION
    raw_payload: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    vehicle: Mapped["app.models.operations.Vehicle"] = relationship("app.models.operations.Vehicle", back_populates="telemetry_events")

    __table_args__ = (
        Index("idx_telem_workspace_vehicle_time", "workspace_id", "vehicle_id", "device_timestamp"),
    )


class VehicleStatus(Base, TimestampMixin):
    __tablename__ = "vehicle_statuses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"vs-{uuid.uuid4().hex[:10]}")
    vehicle_id: Mapped[str] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="CASCADE"), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="IN_TRANSIT")  # IN_TRANSIT, IDLE, CHARGING, MAINTENANCE, OUT_OF_SERVICE
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)
    heading: Mapped[float] = mapped_column(Float, default=0.0)
    battery_pct: Mapped[int] = mapped_column(Integer, default=100)
    health_score: Mapped[int] = mapped_column(Integer, default=95)
    last_telemetry_at: Mapped[str] = mapped_column(String(64), nullable=False)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    vehicle: Mapped["app.models.operations.Vehicle"] = relationship("app.models.operations.Vehicle", back_populates="status_snapshot")
