import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"org-{uuid.uuid4().hex[:12]}")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    industry: Mapped[str] = mapped_column(String(128), default="LOGISTICS_AND_FREIGHT")
    country: Mapped[str] = mapped_column(String(64), default="United States")
    operating_region: Mapped[str] = mapped_column(String(64), default="NORTH_AMERICA")
    fleet_size: Mapped[str] = mapped_column(String(64), default="50-250")
    plan: Mapped[str] = mapped_column(String(64), default="PROFESSIONAL")  # FREE, PROFESSIONAL, ENTERPRISE
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    workspaces: Mapped[List["Workspace"]] = relationship("Workspace", back_populates="organization", cascade="all, delete-orphan")
    memberships: Mapped[List["OrganizationMembership"]] = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")
    subscription: Mapped[Optional["SubscriptionPlan"]] = relationship("SubscriptionPlan", back_populates="organization", uselist=False, cascade="all, delete-orphan")


class OrganizationMembership(Base, TimestampMixin):
    __tablename__ = "organization_memberships"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"om-{uuid.uuid4().hex[:12]}")
    organization_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), default="OPERATOR")  # ADMINISTRATOR, OPERATIONS_MANAGER, DISPATCHER, ANALYST, OPERATOR, VIEWER
    is_default: Mapped[bool] = mapped_column(Boolean, default=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="memberships")
    user: Mapped["app.models.user.User"] = relationship("app.models.user.User", back_populates="organization_memberships")


class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"sub-{uuid.uuid4().hex[:12]}")
    organization_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_tier: Mapped[str] = mapped_column(String(64), default="PROFESSIONAL")  # FREE_TRIAL, PROFESSIONAL, ENTERPRISE
    max_vehicles: Mapped[int] = mapped_column(Integer, default=250)
    max_users: Mapped[int] = mapped_column(Integer, default=25)
    max_trips_monthly: Mapped[int] = mapped_column(Integer, default=10000)
    ai_copilot_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    fabric_integration_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")

    organization: Mapped["Organization"] = relationship("Organization", back_populates="subscription")
