from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.dependencies import get_current_principal, require_authenticated
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.core.errors import ForbiddenException
from app.db.session import get_db
from app.integrations.location.schemas import (
    Coordinate,
    LocationAutocompleteItem,
    PlaceItem,
    ResolvedLocation,
    RouteMatrixResult,
    RouteResult,
)
from app.services.location_service import LocationService

router = APIRouter()

class ResolveLocationRequest(BaseModel):
    query: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    resultType: str = "city"
    providerResultId: Optional[str] = None

class ReverseGeocodeRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy: Optional[float] = None

class RouteCalculationRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    mode: str = "drive"
    waypoints: Optional[List[Coordinate]] = None

class RouteMatrixRequest(BaseModel):
    sources: List[Coordinate]
    targets: List[Coordinate]
    mode: str = "drive"
    options: Optional[Dict[str, Any]] = None

class SetWorkspaceLocationRequest(BaseModel):
    location: ResolvedLocation
    label: str = "Primary Operations Area"
    type: str = "OPERATING_REGION"
    isPrimary: bool = True

@router.get("/autocomplete", response_model=List[LocationAutocompleteItem])
async def autocomplete_locations(
    q: str = Query(..., min_length=1, description="Location search text"),
    country: Optional[str] = Query(None, description="ISO country code filter (e.g. 'in', 'us', 'jp')"),
    limit: int = Query(5, ge=1, le=10),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    principal: RequestPrincipal = Depends(require_authenticated),
):
    return await LocationService.autocomplete(
        query=q,
        country=country,
        limit=limit,
        bias_lat=lat,
        bias_lng=lng,
    )

@router.post("/resolve", response_model=ResolvedLocation)
async def resolve_location(
    req: ResolveLocationRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
):
    return await LocationService.resolve_location(
        query=req.query,
        latitude=req.latitude,
        longitude=req.longitude,
        result_type=req.resultType,
        provider_result_id=req.providerResultId,
    )

@router.post("/reverse", response_model=ResolvedLocation)
async def reverse_geocode(
    req: ReverseGeocodeRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
):
    return await LocationService.reverse_geocode(req.latitude, req.longitude)

@router.post("/route", response_model=RouteResult)
async def calculate_route(
    req: RouteCalculationRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
):
    return await LocationService.calculate_route(
        origin=req.origin,
        destination=req.destination,
        mode=req.mode,
        waypoints=req.waypoints,
    )

@router.post("/route-matrix", response_model=RouteMatrixResult)
async def calculate_route_matrix(
    req: RouteMatrixRequest,
    principal: RequestPrincipal = Depends(require_authenticated),
):
    return await LocationService.calculate_route_matrix(
        sources=req.sources,
        targets=req.targets,
        mode=req.mode,
        options=req.options,
    )

@router.get("/places", response_model=List[PlaceItem])
async def get_nearby_places(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    radius: int = Query(5000, ge=100, le=50000),
    categories: Optional[str] = Query(None, description="Comma-separated category codes"),
    limit: int = Query(20, ge=1, le=50),
    principal: RequestPrincipal = Depends(require_authenticated),
):
    cat_list = [c.strip() for c in categories.split(",") if c.strip()] if categories else None
    return await LocationService.get_places(
        latitude=lat,
        longitude=lng,
        radius_meters=radius,
        categories=cat_list,
        limit=limit,
    )

@router.get("/place/{provider_place_id}")
async def get_place_details(
    provider_place_id: str,
    principal: RequestPrincipal = Depends(require_authenticated),
):
    res = await LocationService.get_place_details(provider_place_id)
    return res or {"placeId": provider_place_id, "status": "NOT_FOUND"}

# Workspace Locations
@router.get("/workspaces/{workspace_id}/locations")
async def get_workspace_locations(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_authenticated),
):
    if principal.workspace_id and principal.workspace_id != workspace_id:
        raise ForbiddenException("Access to this workspace's locations is forbidden.")
    return await LocationService.get_workspace_locations(db, workspace_id)

@router.post("/workspaces/{workspace_id}/locations", status_code=status.HTTP_201_CREATED)
async def set_workspace_location(
    workspace_id: str,
    req: SetWorkspaceLocationRequest,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_authenticated),
):
    if principal.workspace_id and principal.workspace_id != workspace_id:
        raise ForbiddenException("Access to this workspace is forbidden.")
    return await LocationService.set_workspace_location(
        db=db,
        workspace_id=workspace_id,
        location_data=req.location,
        label=req.label,
        location_type=req.type,
        is_primary=req.isPrimary,
        actor_id=principal.nexus_user_id,
        actor_name=principal.display_name,
    )
