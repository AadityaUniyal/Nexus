import hashlib
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.errors import NexusException, EntityNotFoundException
from app.integrations.location import get_location_provider
from app.integrations.location.schemas import (
    Coordinate,
    LocationAutocompleteItem,
    PlaceItem,
    ResolvedLocation,
    RouteMatrixResult,
    RouteResult,
)
from app.models.location import Location, WorkspaceLocation
from app.services.audit_service import log_audit_action
from app.services.event_service import record_operational_event

# In-Memory Cache with TTL
_MEMORY_CACHE: Dict[str, Dict[str, Any]] = {}

# In-Memory Provider Usage Metrics
_METRICS = {
    "requests_today": 0,
    "estimated_credits": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "autocomplete_requests": 0,
    "geocode_requests": 0,
    "reverse_requests": 0,
    "route_requests": 0,
    "matrix_requests": 0,
    "places_requests": 0,
    "failed_requests": 0,
    "last_error": None,
    "last_checked_at": datetime.now(timezone.utc).isoformat(),
}

def _cache_get(key: str) -> Optional[Any]:
    if key in _MEMORY_CACHE:
        entry = _MEMORY_CACHE[key]
        if time.time() < entry["expires_at"]:
            _METRICS["cache_hits"] += 1
            return entry["val"]
        else:
            del _MEMORY_CACHE[key]
    _METRICS["cache_misses"] += 1
    return None

def _cache_set(key: str, val: Any, ttl_seconds: int = 3600):
    _MEMORY_CACHE[key] = {
        "val": val,
        "expires_at": time.time() + ttl_seconds,
    }

class LocationService:
    @staticmethod
    async def autocomplete(
        query: str,
        country: Optional[str] = None,
        limit: int = 5,
        bias_lat: Optional[float] = None,
        bias_lng: Optional[float] = None,
    ) -> List[LocationAutocompleteItem]:
        q_norm = query.strip().lower()
        if len(q_norm) < 2:
            return []

        cache_key = f"location:auto:{q_norm}:{country or 'all'}:{limit}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return [LocationAutocompleteItem(**item) for item in cached]

        _METRICS["requests_today"] += 1
        _METRICS["autocomplete_requests"] += 1
        _METRICS["estimated_credits"] += 1

        provider = get_location_provider()
        try:
            results = await provider.autocomplete(
                query=query,
                country=country,
                limit=limit,
                bias_lat=bias_lat,
                bias_lng=bias_lng,
            )
            _cache_set(cache_key, [r.model_dump() for r in results], ttl_seconds=1800)
            return results
        except Exception as e:
            _METRICS["failed_requests"] += 1
            _METRICS["last_error"] = str(e)
            return []

    @staticmethod
    async def resolve_location(
        query: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        result_type: str = "city",
        provider_result_id: Optional[str] = None,
    ) -> ResolvedLocation:
        if latitude is not None and longitude is not None:
            return await LocationService.reverse_geocode(latitude, longitude)

        q_norm = query.strip().lower()
        cache_key = f"location:geocode:{q_norm}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return ResolvedLocation(**cached)

        _METRICS["requests_today"] += 1
        _METRICS["geocode_requests"] += 1
        _METRICS["estimated_credits"] += 1

        provider = get_location_provider()
        results = await provider.geocode(query, limit=1)
        if not results:
            loc = ResolvedLocation(
                id=f"res-{uuid.uuid4().hex[:8]}",
                display_name=query.title(),
                latitude=latitude or 30.3165,
                longitude=longitude or 78.0322,
                type=result_type,
                provider="nexus-fallback",
            )
        else:
            loc = results[0]

        _cache_set(cache_key, loc.model_dump(), ttl_seconds=86400)
        return loc

    @staticmethod
    async def reverse_geocode(latitude: float, longitude: float) -> ResolvedLocation:
        lat_r = round(latitude, 4)
        lng_r = round(longitude, 4)
        cache_key = f"location:reverse:{lat_r}:{lng_r}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return ResolvedLocation(**cached)

        _METRICS["requests_today"] += 1
        _METRICS["reverse_requests"] += 1
        _METRICS["estimated_credits"] += 1

        provider = get_location_provider()
        loc = await provider.reverse_geocode(latitude, longitude)
        _cache_set(cache_key, loc.model_dump(), ttl_seconds=86400)
        return loc

    @staticmethod
    async def calculate_route(
        origin: Coordinate,
        destination: Coordinate,
        mode: str = "drive",
        waypoints: Optional[List[Coordinate]] = None,
    ) -> RouteResult:
        hash_input = f"{origin.latitude:.4f},{origin.longitude:.4f}:{destination.latitude:.4f},{destination.longitude:.4f}:{mode}"
        route_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()[:16]
        cache_key = f"route:{route_hash}"

        cached = _cache_get(cache_key)
        if cached is not None:
            return RouteResult(**cached)

        _METRICS["requests_today"] += 1
        _METRICS["route_requests"] += 1
        _METRICS["estimated_credits"] += 2

        provider = get_location_provider()
        res = await provider.route(origin, destination, mode=mode, waypoints=waypoints)
        res.route_hash = route_hash
        _cache_set(cache_key, res.model_dump(), ttl_seconds=3600)
        return res

    @staticmethod
    async def calculate_route_matrix(
        sources: List[Coordinate],
        targets: List[Coordinate],
        mode: str = "drive",
    ) -> RouteMatrixResult:
        if len(sources) > 10 or len(targets) > 10:
            raise NexusException(code="MATRIX_TOO_LARGE", message="Matrix dimension exceeds maximum limit of 10x10.")

        matrix_hash = hashlib.sha256(f"{len(sources)}:{len(targets)}:{mode}".encode("utf-8")).hexdigest()[:16]
        cache_key = f"matrix:{matrix_hash}"

        cached = _cache_get(cache_key)
        if cached is not None:
            return RouteMatrixResult(**cached)

        _METRICS["requests_today"] += 1
        _METRICS["matrix_requests"] += 1
        _METRICS["estimated_credits"] += (len(sources) * len(targets))

        provider = get_location_provider()
        res = await provider.route_matrix(sources, targets, mode=mode)
        _cache_set(cache_key, res.model_dump(), ttl_seconds=1800)
        return res

    @staticmethod
    async def get_places(
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        categories: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[PlaceItem]:
        cache_key = f"places:{round(latitude, 3)}:{round(longitude, 3)}:{radius_meters}:{limit}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return [PlaceItem(**p) for p in cached]

        _METRICS["requests_today"] += 1
        _METRICS["places_requests"] += 1
        _METRICS["estimated_credits"] += 1

        provider = get_location_provider()
        places = await provider.places(latitude, longitude, radius_meters=radius_meters, categories=categories, limit=limit)
        _cache_set(cache_key, [p.model_dump() for p in places], ttl_seconds=3600)
        return places

    @staticmethod
    async def get_place_details(place_id: str) -> Optional[Dict[str, Any]]:
        cache_key = f"place_details:{place_id}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        provider = get_location_provider()
        details = await provider.place_details(place_id)
        if details:
            _cache_set(cache_key, details, ttl_seconds=86400)
        return details

    # Workspace Location Management
    @staticmethod
    async def get_workspace_locations(db: AsyncSession, workspace_id: str) -> List[Dict[str, Any]]:
        stmt = (
            select(WorkspaceLocation, Location)
            .join(Location, WorkspaceLocation.location_id == Location.id)
            .where(WorkspaceLocation.workspace_id == workspace_id)
            .order_by(WorkspaceLocation.is_primary.desc(), WorkspaceLocation.created_at.desc())
        )
        res = await db.execute(stmt)
        rows = res.all()
        out = []
        for wl, loc in rows:
            out.append({
                "id": wl.id,
                "workspaceId": wl.workspace_id,
                "locationId": wl.location_id,
                "label": wl.label,
                "type": wl.type,
                "isPrimary": wl.is_primary,
                "location": {
                    "id": loc.id,
                    "displayName": loc.display_name,
                    "formattedAddress": loc.formatted_address,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "country": loc.country,
                    "region": loc.region,
                    "city": loc.city,
                },
            })
        return out

    @staticmethod
    async def set_workspace_location(
        db: AsyncSession,
        workspace_id: str,
        location_data: ResolvedLocation,
        label: str = "Operating Headquarters",
        location_type: str = "OPERATING_REGION",
        is_primary: bool = True,
        actor_id: Optional[str] = None,
        actor_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        # 1. Persist Location entity
        loc_id = f"loc-{uuid.uuid4().hex[:12]}"
        loc = Location(
            id=loc_id,
            workspace_id=workspace_id,
            display_name=location_data.display_name,
            formatted_address=location_data.formatted_address,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            country=location_data.country,
            country_code=location_data.country_code,
            region=location_data.region,
            city=location_data.city,
            district=location_data.district,
            postcode=location_data.postcode,
            result_type=location_data.type,
            provider=location_data.provider,
            provider_place_id=location_data.provider_place_id,
            confidence=location_data.confidence,
            timezone=location_data.timezone,
            metadata_json=location_data.metadata,
        )
        db.add(loc)

        if is_primary:
            # Demote existing primary locations
            demote_stmt = select(WorkspaceLocation).where(
                WorkspaceLocation.workspace_id == workspace_id,
                WorkspaceLocation.is_primary == True,
            )
            demote_res = await db.execute(demote_stmt)
            for existing in demote_res.scalars().all():
                existing.is_primary = False

        wl_id = f"wloc-{uuid.uuid4().hex[:12]}"
        wl = WorkspaceLocation(
            id=wl_id,
            workspace_id=workspace_id,
            location_id=loc_id,
            label=label,
            type=location_type,
            is_primary=is_primary,
        )
        db.add(wl)

        await record_operational_event(
            db=db,
            workspace_id=workspace_id,
            event_type="workspace.location.changed",
            entity_type="WORKSPACE",
            entity_id=workspace_id,
            message=f"Workspace operating location updated to {location_data.display_name} ({location_data.latitude:.4f}, {location_data.longitude:.4f})",
            severity="INFO",
            payload={"locationId": loc_id, "displayName": location_data.display_name},
        )

        await log_audit_action(
            db=db,
            actor_id=actor_id or "system",
            actor_name=actor_name or "System Operator",
            action="WORKSPACE_LOCATION_SET",
            entity_type="WORKSPACE_LOCATION",
            entity_id=wl_id,
            workspace_id=workspace_id,
            details=f"Workspace primary location set to {location_data.display_name}",
            metadata_json={"location": location_data.display_name, "isPrimary": is_primary},
        )

        await db.commit()

        return {
            "id": wl_id,
            "workspaceId": workspace_id,
            "locationId": loc_id,
            "label": label,
            "type": location_type,
            "isPrimary": is_primary,
            "location": location_data.model_dump(),
        }

    @staticmethod
    def get_metrics() -> Dict[str, Any]:
        total_cache_queries = _METRICS["cache_hits"] + _METRICS["cache_misses"]
        hit_rate = round((_METRICS["cache_hits"] / total_cache_queries * 100), 1) if total_cache_queries > 0 else 100.0
        return {
            **_METRICS,
            "cache_hit_rate_pct": hit_rate,
            "last_checked_at": datetime.now(timezone.utc).isoformat(),
        }
