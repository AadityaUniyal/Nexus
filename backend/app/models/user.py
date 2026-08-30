import uuid
from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(64), default="ENTERPRISE_LOGISTICS")
    region: Mapped[str] = mapped_column(String(64), default="US_CENTRAL")
    timezone: Mapped[str] = mapped_column(String(64), default="America/Chicago")
    scale: Mapped[str] = mapped_column(String(64), default="NATIONAL_NETWORK")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    users: Mapped[List["User"]] = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    warehouses: Mapped[List["Warehouse"]] = relationship("Warehouse", back_populates="workspace", cascade="all, delete-orphan")
    vehicles: Mapped[List["Vehicle"]] = relationship("Vehicle", back_populates="workspace", cascade="all, delete-orphan")
    routes: Mapped[List["Route"]] = relationship("Route", back_populates="workspace", cascade="all, delete-orphan")
    incidents: Mapped[List["Incident"]] = relationship("Incident", back_populates="workspace", cascade="all, delete-orphan")
    simulations: Mapped[List["Simulation"]] = relationship("Simulation", back_populates="workspace", cascade="all, delete-orphan")

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_user_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(64), default="OPERATOR", nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    onboarding_status: Mapped[str] = mapped_column(String(64), default="COMPLETE")
    avatar_seed: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    last_active_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="users")

class WorkspaceMembership(Base, TimestampMixin):
    __tablename__ = "workspace_memberships"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(64), ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="OPERATOR")

class AvatarPreferences(Base, TimestampMixin):
    __tablename__ = "avatar_preferences"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False)
    companion_hints_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_variant: Mapped[str] = mapped_column(String(64), default="TACTILE_SPATIAL_MINIMAL")

class Invitation(Base, TimestampMixin):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="OPERATOR")
    token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    expires_at: Mapped[str] = mapped_column(String(64), nullable=False)
    accepted_at: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
