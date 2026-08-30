from sqlalchemy import Column, String, Float, Boolean, Integer, JSON, ForeignKey
from app.db.base import Base, TimestampMixin

class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id = Column(String(64), primary_key=True, index=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    display_name = Column(String(255), nullable=False)
    formatted_address = Column(String(512), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    country = Column(String(128), nullable=True)
    country_code = Column(String(16), nullable=True)
    region = Column(String(128), nullable=True)
    city = Column(String(128), nullable=True)
    district = Column(String(128), nullable=True)
    postcode = Column(String(32), nullable=True)
    result_type = Column(String(64), default="city")
    provider = Column(String(64), default="geoapify")
    provider_place_id = Column(String(128), nullable=True)
    confidence = Column(Float, default=1.0)
    timezone = Column(String(64), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    version = Column(Integer, default=1, nullable=False)

class WorkspaceLocation(Base, TimestampMixin):
    __tablename__ = "workspace_locations"

    id = Column(String(64), primary_key=True, index=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(String(64), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(128), nullable=False, default="Primary Operations Area")
    type = Column(String(64), nullable=False, default="OPERATING_REGION")  # HEADQUARTERS, WAREHOUSE, DEPOT, OPERATING_REGION
    is_primary = Column(Boolean, default=True, nullable=False)
