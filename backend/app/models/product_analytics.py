"""Product analytics (first-party event tracking) stored in Neon PostgreSQL.

Events are append-only. Hot queries hit (name, occurred_at) and
(workspace_id, occurred_at) indexes; raw batches are also archived to the
Azure Blob 'bronze' tier and mirrored to Application Insights.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProductEvent(Base):
    __tablename__ = "product_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    workspace_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    anonymous_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    referrer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    device: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    properties: Mapped[dict] = mapped_column(JSON, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_product_events_name_time", "name", "occurred_at"),
        Index("ix_product_events_ws_time", "workspace_id", "occurred_at"),
    )
