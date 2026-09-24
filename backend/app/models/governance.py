import uuid
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Approval(Base, TimestampMixin):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"appr-{uuid.uuid4().hex[:10]}")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    simulation_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("simulations.id", ondelete="SET NULL"), nullable=True, index=True)
    action_type: Mapped[str] = mapped_column(String(64), default="REROUTE_VEHICLE")  # REROUTE_VEHICLE, REASSIGN_DRIVER, CANCEL_DISPATCH, NOTIFY_DRIVER
    proposed_changes_json: Mapped[dict] = mapped_column(JSON, default=dict)
    impact_summary: Mapped[str] = mapped_column(Text, nullable=False)
    cost_delta_usd: Mapped[float] = mapped_column(Float, default=0.0)
    time_saved_mins: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")  # PENDING, APPROVED, REJECTED, EXPIRED
    requested_by: Mapped[str] = mapped_column(String(128), default="Nexus AI Copilot")
    approved_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    approved_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    incident: Mapped[Optional["app.models.incidents.Incident"]] = relationship("app.models.incidents.Incident")
    simulation: Mapped[Optional["app.models.simulations.Simulation"]] = relationship("app.models.simulations.Simulation")
    executions: Mapped[list["ActionExecution"]] = relationship("ActionExecution", back_populates="approval", cascade="all, delete-orphan")


class ActionExecution(Base, TimestampMixin):
    __tablename__ = "action_executions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"exec-{uuid.uuid4().hex[:10]}")
    approval_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("approvals.id", ondelete="SET NULL"), nullable=True, index=True)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    target_entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    parameters_json: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS")  # QUEUED, EXECUTING, SUCCESS, FAILED
    result_summary: Mapped[str] = mapped_column(Text, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    executed_by: Mapped[str] = mapped_column(String(128), default="System Dispatch Worker")
    executed_at: Mapped[str] = mapped_column(String(64), nullable=False)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    approval: Mapped[Optional["Approval"]] = relationship("Approval", back_populates="executions")


class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"aud-{uuid.uuid4().hex[:14]}")
    organization_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    actor_name: Mapped[str] = mapped_column(String(128), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(64), default="OPERATOR")
    action: Mapped[str] = mapped_column(String(128), nullable=False)  # e.g., VEHICLE_REROUTE_APPROVED, DRIVER_ASSIGNED, DATA_IMPORTED
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    before_state_json: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    after_state_json: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    ai_involvement: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # e.g., "AI Recommendation Rec-802"
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
