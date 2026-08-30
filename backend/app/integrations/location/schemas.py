from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class LocationAutocompleteItem(BaseModel):
    id: str
    label: str
    secondary_label: Optional[str] = None
    latitude: float
    longitude: float
    type: str = "city"
    country: Optional[str] = None
    country_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    confidence: Optional[float] = 1.0

class ResolvedLocation(BaseModel):
    id: str
    display_name: str
    formatted_address: Optional[str] = None
    latitude: float
    longitude: float
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postcode: Optional[str] = None
    type: str = "city"
    confidence: float = 1.0
    provider: str = "geoapify"
    provider_place_id: Optional[str] = None
    timezone: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Coordinate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    id: Optional[str] = None

class RouteLeg(BaseModel):
    distance_meters: float
    duration_seconds: float
    steps: Optional[List[Dict[str, Any]]] = None

class RouteResult(BaseModel):
    distance_meters: float
    duration_seconds: float
    geometry: Dict[str, Any]  # GeoJSON LineString or MultiLineString
    legs: List[RouteLeg] = []
    mode: str = "drive"
    provider: str = "geoapify"
    route_hash: Optional[str] = None

class MatrixCell(BaseModel):
    source_id: str
    target_id: str
    distance_meters: float
    duration_seconds: float
    status: str = "OK"

class RouteMatrixResult(BaseModel):
    cells: List[MatrixCell]
    sources_count: int
    targets_count: int
    provider: str = "geoapify"

class PlaceItem(BaseModel):
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    formatted_address: Optional[str] = None
    distance_meters: Optional[float] = None
    raw_data: Optional[Dict[str, Any]] = None
