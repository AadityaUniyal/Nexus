import hashlib
import uuid
import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.errors import NexusException
from app.integrations.location.base import LocationProvider
from app.integrations.location.schemas import (
    Coordinate,
    LocationAutocompleteItem,
    MatrixCell,
    PlaceItem,
    ResolvedLocation,
    RouteLeg,
    RouteMatrixResult,
    RouteResult,
)

class GeoapifyLocationProvider(LocationProvider):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.GEOAPIFY_API_KEY
        self.base_url = (base_url or settings.GEOAPIFY_BASE_URL).rstrip("/")
        self.timeout = settings.GEOAPIFY_REQUEST_TIMEOUT_SECONDS

    async def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=self.timeout)

    async def autocomplete(
        self,
        query: str,
        country: Optional[str] = None,
        limit: int = 5,
        bias_lat: Optional[float] = None,
        bias_lng: Optional[float] = None,
    ) -> List[LocationAutocompleteItem]:
        if not query or len(query.strip()) < 2:
            return []

        params: Dict[str, Any] = {
            "text": query.strip(),
            "apiKey": self.api_key,
            "limit": min(limit, 10),
            "format": "json",
        }
        if country:
            params["filter"] = f"countrycode:{country.lower()}"
        if bias_lat is not None and bias_lng is not None:
            params["bias"] = f"proximity:{bias_lng},{bias_lat}"

        url = f"{self.base_url}/geocode/autocomplete"
        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []
                data = resp.json()

            results: List[LocationAutocompleteItem] = []
            features = data.get("results", []) or data.get("features", [])
            for feat in features:
                # Geoapify results format handling
                props = feat.get("properties", feat)
                lat = props.get("lat") or feat.get("lat")
                lon = props.get("lon") or feat.get("lon")
                if lat is None or lon is None:
                    continue

                item_id = props.get("place_id") or f"loc-{uuid.uuid4().hex[:8]}"
                label = props.get("formatted") or props.get("name") or query
                city = props.get("city") or props.get("town") or props.get("village")
                state = props.get("state") or props.get("region")
                country_name = props.get("country")
                country_code = props.get("country_code")
                res_type = props.get("result_type") or "city"

                sec_parts = [p for p in [state, country_name] if p]
                sec_label = ", ".join(sec_parts) if sec_parts else None

                results.append(
                    LocationAutocompleteItem(
                        id=str(item_id),
                        label=label,
                        secondary_label=sec_label,
                        latitude=float(lat),
                        longitude=float(lon),
                        type=res_type,
                        country=country_name,
                        country_code=country_code,
                        state=state,
                        city=city,
                        postcode=props.get("postcode"),
                        confidence=float(props.get("rank", {}).get("confidence", 1.0)) if isinstance(props.get("rank"), dict) else 1.0,
                    )
                )
            return results
        except Exception:
            return []

    async def geocode(self, query: str, limit: int = 1) -> List[ResolvedLocation]:
        if not query:
            return []

        params = {
            "text": query.strip(),
            "apiKey": self.api_key,
            "limit": limit,
            "format": "json",
        }
        url = f"{self.base_url}/geocode/search"
        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []
                data = resp.json()

            results: List[ResolvedLocation] = []
            features = data.get("results", []) or data.get("features", [])
            for feat in features:
                props = feat.get("properties", feat)
                lat = props.get("lat") or feat.get("lat")
                lon = props.get("lon") or feat.get("lon")
                if lat is None or lon is None:
                    continue

                display = props.get("formatted") or props.get("name") or query
                results.append(
                    ResolvedLocation(
                        id=str(props.get("place_id") or f"res-{uuid.uuid4().hex[:8]}"),
                        display_name=display,
                        formatted_address=props.get("formatted"),
                        latitude=float(lat),
                        longitude=float(lon),
                        country=props.get("country"),
                        country_code=props.get("country_code"),
                        region=props.get("state") or props.get("region"),
                        city=props.get("city"),
                        district=props.get("district") or props.get("suburb"),
                        postcode=props.get("postcode"),
                        type=props.get("result_type") or "place",
                        confidence=float(props.get("rank", {}).get("confidence", 1.0)) if isinstance(props.get("rank"), dict) else 1.0,
                        provider="geoapify",
                        provider_place_id=props.get("place_id"),
                        timezone=props.get("timezone", {}).get("name") if isinstance(props.get("timezone"), dict) else None,
                        metadata=props,
                    )
                )
            return results
        except Exception:
            return []

    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float,
    ) -> ResolvedLocation:
        params = {
            "lat": latitude,
            "lon": longitude,
            "apiKey": self.api_key,
            "format": "json",
        }
        url = f"{self.base_url}/geocode/reverse"
        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    raise NexusException(code="REVERSE_GEOCODE_FAILED", message="Reverse geocoding failed.")
                data = resp.json()

            features = data.get("results", []) or data.get("features", [])
            if not features:
                return ResolvedLocation(
                    id=f"rev-{uuid.uuid4().hex[:8]}",
                    display_name=f"{latitude:.4f}, {longitude:.4f}",
                    formatted_address=f"{latitude:.4f}, {longitude:.4f}",
                    latitude=latitude,
                    longitude=longitude,
                    type="coordinate",
                    provider="geoapify",
                )

            props = features[0].get("properties", features[0])
            display = props.get("formatted") or f"{latitude:.4f}, {longitude:.4f}"
            return ResolvedLocation(
                id=str(props.get("place_id") or f"rev-{uuid.uuid4().hex[:8]}"),
                display_name=display,
                formatted_address=props.get("formatted"),
                latitude=latitude,
                longitude=longitude,
                country=props.get("country"),
                country_code=props.get("country_code"),
                region=props.get("state") or props.get("region"),
                city=props.get("city"),
                district=props.get("district"),
                postcode=props.get("postcode"),
                type=props.get("result_type") or "street",
                confidence=1.0,
                provider="geoapify",
                provider_place_id=props.get("place_id"),
                timezone=props.get("timezone", {}).get("name") if isinstance(props.get("timezone"), dict) else None,
                metadata=props,
            )
        except Exception:
            return ResolvedLocation(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                display_name=f"{latitude:.4f}, {longitude:.4f}",
                formatted_address=f"{latitude:.4f}, {longitude:.4f}",
                latitude=latitude,
                longitude=longitude,
                type="coordinate",
                provider="geoapify",
            )

    async def route(
        self,
        origin: Coordinate,
        destination: Coordinate,
        mode: str = "drive",
        waypoints: Optional[List[Coordinate]] = None,
    ) -> RouteResult:
        pts = [f"{origin.latitude},{origin.longitude}"]
        if waypoints:
            for wp in waypoints:
                pts.append(f"{wp.latitude},{wp.longitude}")
        pts.append(f"{destination.latitude},{destination.longitude}")

        route_pts_str = "|".join(pts)
        params = {
            "waypoints": route_pts_str,
            "mode": mode,
            "apiKey": self.api_key,
        }
        url = f"{self.base_url}/routing"
        route_hash = hashlib.sha256(f"{route_pts_str}:{mode}".encode("utf-8")).hexdigest()[:16]

        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    # Fallback straight-line road approximation
                    return self._approximate_route(origin, destination, mode, route_hash)
                data = resp.json()

            features = data.get("features", [])
            if not features:
                return self._approximate_route(origin, destination, mode, route_hash)

            feature = features[0]
            props = feature.get("properties", {})
            distance_meters = float(props.get("distance", 0.0))
            duration_seconds = float(props.get("time", 0.0))
            geometry = feature.get("geometry", {})

            legs: List[RouteLeg] = []
            for leg_data in props.get("legs", []):
                legs.append(
                    RouteLeg(
                        distance_meters=float(leg_data.get("distance", 0.0)),
                        duration_seconds=float(leg_data.get("time", 0.0)),
                        steps=leg_data.get("steps", []),
                    )
                )

            return RouteResult(
                distance_meters=distance_meters,
                duration_seconds=duration_seconds,
                geometry=geometry,
                legs=legs,
                mode=mode,
                provider="geoapify",
                route_hash=route_hash,
            )
        except Exception:
            return self._approximate_route(origin, destination, mode, route_hash)

    def _approximate_route(self, origin: Coordinate, dest: Coordinate, mode: str, route_hash: str) -> RouteResult:
        # Straight-line Euclidean approx with realistic road detour multiplier (1.28)
        import math
        dlat = math.radians(dest.latitude - origin.latitude)
        dlon = math.radians(dest.longitude - origin.longitude)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(origin.latitude)) * math.cos(math.radians(dest.latitude)) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        straight_meters = 6371000 * c
        road_meters = straight_meters * 1.28
        avg_speed_mps = 18.0  # ~65 km/h
        duration = road_meters / avg_speed_mps

        geojson_geom = {
            "type": "LineString",
            "coordinates": [
                [origin.longitude, origin.latitude],
                [(origin.longitude + dest.longitude) / 2, (origin.latitude + dest.latitude) / 2 + 0.005],
                [dest.longitude, dest.latitude],
            ],
        }

        return RouteResult(
            distance_meters=road_meters,
            duration_seconds=duration,
            geometry=geojson_geom,
            legs=[RouteLeg(distance_meters=road_meters, duration_seconds=duration)],
            mode=mode,
            provider="geoapify-approx",
            route_hash=route_hash,
        )

    async def route_matrix(
        self,
        sources: List[Coordinate],
        targets: List[Coordinate],
        mode: str = "drive",
    ) -> RouteMatrixResult:
        body = {
            "mode": mode,
            "sources": [{"location": [s.longitude, s.latitude]} for s in sources],
            "targets": [{"location": [t.longitude, t.latitude]} for t in targets],
        }
        url = f"{self.base_url}/routematrix?apiKey={self.api_key}"

        try:
            async with await self._get_client() as client:
                resp = await client.post(url, json=body)
                if resp.status_code == 200:
                    data = resp.json()
                    matrix_rows = data.get("sources_to_targets", [])
                    cells: List[MatrixCell] = []
                    for s_idx, row in enumerate(matrix_rows):
                        s_id = sources[s_idx].id or f"src_{s_idx}"
                        for t_idx, item in enumerate(row):
                            t_id = targets[t_idx].id or f"tgt_{t_idx}"
                            cells.append(
                                MatrixCell(
                                    source_id=s_id,
                                    target_id=t_id,
                                    distance_meters=float(item.get("distance", 0.0)),
                                    duration_seconds=float(item.get("time", 0.0)),
                                    status="OK",
                                )
                            )
                    return RouteMatrixResult(
                        cells=cells,
                        sources_count=len(sources),
                        targets_count=len(targets),
                        provider="geoapify",
                    )
        except Exception:
            pass

        # Fallback matrix computation
        cells = []
        for s_idx, s in enumerate(sources):
            s_id = s.id or f"src_{s_idx}"
            for t_idx, t in enumerate(targets):
                t_id = t.id or f"tgt_{t_idx}"
                r = self._approximate_route(s, t, mode, "matrix-hash")
                cells.append(
                    MatrixCell(
                        source_id=s_id,
                        target_id=t_id,
                        distance_meters=r.distance_meters,
                        duration_seconds=r.duration_seconds,
                        status="OK",
                    )
                )

        return RouteMatrixResult(
            cells=cells,
            sources_count=len(sources),
            targets_count=len(targets),
            provider="geoapify-approx",
        )

    async def places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        categories: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[PlaceItem]:
        cats_str = ",".join(categories) if categories else "commercial.transportation,service.vehicle,industry"
        params = {
            "categories": cats_str,
            "filter": f"circle:{longitude},{latitude},{radius_meters}",
            "limit": min(limit, 50),
            "apiKey": self.api_key,
        }
        url = f"{self.base_url}/places"
        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return []
                data = resp.json()

            places: List[PlaceItem] = []
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                places.append(
                    PlaceItem(
                        id=str(props.get("place_id") or f"poi-{uuid.uuid4().hex[:8]}"),
                        name=props.get("name") or props.get("formatted") or "Logistics Facility",
                        category=props.get("categories", ["facility"])[0] if props.get("categories") else "facility",
                        latitude=float(props.get("lat", latitude)),
                        longitude=float(props.get("lon", longitude)),
                        formatted_address=props.get("formatted"),
                        distance_meters=float(props.get("distance", 0.0)),
                        raw_data=props,
                    )
                )
            return places
        except Exception:
            return []

    async def place_details(self, provider_place_id: str) -> Optional[Dict[str, Any]]:
        params = {
            "id": provider_place_id,
            "apiKey": self.api_key,
        }
        url = f"{self.base_url}/place-details"
        try:
            async with await self._get_client() as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            pass
        return None

    async def health_check(self) -> Dict[str, Any]:
        try:
            res = await self.geocode("Tokyo", limit=1)
            if res:
                return {
                    "status": "HEALTHY",
                    "provider": "geoapify",
                    "geocoding": "operational",
                    "routing": "operational",
                    "places": "operational",
                }
            return {
                "status": "DEGRADED",
                "provider": "geoapify",
                "message": "Geocoding returned empty results.",
            }
        except Exception as e:
            return {
                "status": "UNAVAILABLE",
                "provider": "geoapify",
                "error": str(e),
            }
