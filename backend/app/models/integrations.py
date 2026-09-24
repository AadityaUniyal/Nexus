import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class IntegrationProvider(Base, TimestampMixin):
    __tablename__ = "integration_providers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"intp-{uuid.uuid4().hex[:10]}")
    provider: Mapped[str] = mapped_column(String(64), index=True, nullable=False)  # SAMSARA, GEOTAB, AZURE_IOT, MICROSOFT_FABRIC, WEBHOOK
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")  # ACTIVE, PAUSED, ERROR
    config_json: Mapped[dict] = mapped_column(JSON, default=dict)
    auth_type: Mapped[str] = mapped_column(String(32), default="API_KEY")  # API_KEY, OAUTH2, WEBHOOK_SECRET
    last_sync_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    sync_jobs: Mapped[List["SyncJob"]] = relationship("SyncJob", back_populates="integration", cascade="all, delete-orphan")


class IntegrationCredentialReference(Base, TimestampMixin):
    __tablename__ = "integration_credentials"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"cred-{uuid.uuid4().hex[:10]}")
    integration_id: Mapped[str] = mapped_column(String(64), ForeignKey("integration_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    key_vault_secret_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="Managed Azure Key Vault Secret Reference")
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)


class WebhookEndpoint(Base, TimestampMixin):
    __tablename__ = "webhook_endpoints"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"whk-{uuid.uuid4().hex[:10]}")
    provider: Mapped[str] = mapped_column(String(64), nullable=False)  # SAMSARA, GEOTAB, AZURE_IOT, CUSTOM
    signing_secret: Mapped[str] = mapped_column(String(128), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    events_received: Mapped[int] = mapped_column(Integer, default=0)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    events: Mapped[List["IntegrationEvent"]] = relationship("IntegrationEvent", back_populates="webhook", cascade="all, delete-orphan")


class SyncJob(Base, TimestampMixin):
    __tablename__ = "sync_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"job-{uuid.uuid4().hex[:10]}")
    integration_id: Mapped[str] = mapped_column(String(64), ForeignKey("integration_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(String(64), default="FLEET_TELEMETRY_SYNC")  # FLEET_TELEMETRY_SYNC, DRIVER_SYNC, TRIP_IMPORT
    status: Mapped[str] = mapped_column(String(32), default="SUCCESS")  # QUEUED, RUNNING, SUCCESS, FAILED
    records_processed: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[str] = mapped_column(String(64), nullable=False)
    completed_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    error_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    integration: Mapped["IntegrationProvider"] = relationship("IntegrationProvider", back_populates="sync_jobs")


class IntegrationEvent(Base, TimestampMixin):
    __tablename__ = "integration_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"intev-{uuid.uuid4().hex[:14]}")
    webhook_id: Mapped[str] = mapped_column(String(64), ForeignKey("webhook_endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    external_event_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    processed: Mapped[bool] = mapped_column(Boolean, default=True)
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    webhook: Mapped["WebhookEndpoint"] = relationship("WebhookEndpoint", back_populates="events")
