import uuid
from typing import Optional
from sqlalchemy import String, Integer, Float, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Simulation(Base, TimestampMixin):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="EVALUATED")  # DRAFT, QUEUED, RUNNING, COMPLETED, APPLIED, FAILED, ARCHIVED
    
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    base_snapshot_version: Mapped[int] = mapped_column(Integer, default=1)
    variables: Mapped[dict] = mapped_column(JSON, default=dict)
    baseline_metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    simulated_metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    ai_briefing: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    applied_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    applied_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    workspace: Mapped["app.models.user.Workspace"] = relationship("app.models.user.Workspace", back_populates="simulations")

class Decision(Base, TimestampMixin):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id: Mapped[str] = mapped_column(String(64), nullable=False)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    applied_by: Mapped[str] = mapped_column(String(128), nullable=False)
    applied_at: Mapped[str] = mapped_column(String(64), nullable=False)
    impact_summary: Mapped[str] = mapped_column(Text, nullable=False)
    changes_json: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)
