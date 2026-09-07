import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(String(64), default="DETECTED")  # DETECTED, ACKNOWLEDGED, INVESTIGATING, SIMULATING, ACTION_PENDING, ACTION_APPLIED, MONITORING, RESOLVED, ARCHIVED
    
    affected_entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    affected_entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    affected_entity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    vehicle_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    vehicle: Mapped[Optional["app.models.operations.Vehicle"]] = relationship("app.models.operations.Vehicle")
    
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0)
    cost_estimate: Mapped[float] = mapped_column(Float, default=0.0)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="incidents")
    timeline: Mapped[List["IncidentTimeline"]] = relationship("IncidentTimeline", back_populates="incident", cascade="all, delete-orphan")
    simulations: Mapped[List["app.models.simulations.Simulation"]] = relationship("app.models.simulations.Simulation", back_populates="incident")

class IncidentTimeline(Base, TimestampMixin):
    __tablename__ = "incident_timelines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    incident: Mapped["Incident"] = relationship("Incident", back_populates="timeline")
    
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    actor_name: Mapped[str] = mapped_column(String(128), default="System")
