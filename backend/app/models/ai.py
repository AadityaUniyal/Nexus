import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"conv-{uuid.uuid4().hex[:10]}")
    title: Mapped[str] = mapped_column(String(255), default="Operational Intelligence Inquiry")
    context_type: Mapped[str] = mapped_column(String(64), default="FLEET")  # FLEET, INCIDENT, SIMULATION, GENERAL
    context_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")
    agent_runs: Mapped[List["AgentRun"]] = relationship("AgentRun", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"msg-{uuid.uuid4().hex[:12]}")
    conversation_id: Mapped[str] = mapped_column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender: Mapped[str] = mapped_column(String(32), nullable=False)  # USER, COPILOT, SYSTEM, TOOL
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls_json: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    citations_json: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    recommended_action_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class AgentRun(Base, TimestampMixin):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"run-{uuid.uuid4().hex[:10]}")
    conversation_id: Mapped[str] = mapped_column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(64), default="MICROSOFT_FOUNDRY")  # MICROSOFT_FOUNDRY, GROQ, AZURE_OPENAI
    model: Mapped[str] = mapped_column(String(64), default="gpt-4o")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="agent_runs")
    tool_calls: Mapped[List["ToolCallRecord"]] = relationship("ToolCallRecord", back_populates="agent_run", cascade="all, delete-orphan")


class ToolCallRecord(Base, TimestampMixin):
    __tablename__ = "tool_call_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"tc-{uuid.uuid4().hex[:10]}")
    agent_run_id: Mapped[str] = mapped_column(String(64), ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name: Mapped[str] = mapped_column(String(64), nullable=False)
    category: Mapped[str] = mapped_column(String(32), default="READ")  # READ, ANALYZE, ACT
    arguments_json: Mapped[dict] = mapped_column(JSON, default=dict)
    result_json: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS")  # SUCCESS, FAILED, REQUIRES_APPROVAL
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="tool_calls")


class AIRecommendation(Base, TimestampMixin):
    __tablename__ = "ai_recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"rec-{uuid.uuid4().hex[:10]}")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    verdict: Mapped[str] = mapped_column(String(64), default="RECOMMENDED")  # HIGHLY_RECOMMENDED, RECOMMENDED, ALTERNATIVE, RISKY
    confidence_score: Mapped[float] = mapped_column(Float, default=92.0)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    simulation_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("simulations.id", ondelete="SET NULL"), nullable=True, index=True)
    proposed_actions_json: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")  # PENDING, ACCEPTED, REJECTED, EXPIRED
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
