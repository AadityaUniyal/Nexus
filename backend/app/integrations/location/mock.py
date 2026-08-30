import uuid
from typing import Any, Dict, List, Optional
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

PREDEFINED_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "dehradun": {
        "id": "loc-dehradun-01",
        "display_name": "Dehradun, Uttarakhand, India",
        "formatted_address": "Dehradun, Uttarakhand, 248001, India",
        "latitude": 30.3165,
        "longitude": 78.0322,
        "country": "India",
        "country_code": "in",
        "region": "Uttarakhand",
        "city": "Dehradun",
        "district": "Dehradun",
        "postcode": "248001",
        "type": "city",
    },
    "delhi": {
        "id": "loc-delhi-02",
        "display_name": "New Delhi, Delhi, India",
        "formatted_address": "Connaught Place, New Delhi, Delhi, 110001, India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "country": "India",
        "country_code": "in",
        "region": "Delhi",
        "city": "New Delhi",
        "district": "Central Delhi",
        "postcode": "110001",
        "type": "city",
    },
    "tokyo": {
        "id": "loc-tokyo-03",
        "display_name": "Tokyo, Japan",
        "formatted_address": "Chiyoda City, Tokyo, 100-0001, Japan",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "country": "Japan",
        "country_code": "jp",
        "region": "Kanto",
        "city": "Tokyo",
        "district": "Chiyoda",
        "postcode": "100-0001",
        "type": "city",
    },
    "london": {
        "id": "loc-london-04",
        "display_name": "London, Greater London, United Kingdom",
        "formatted_address": "Westminster, London, SW1A 1AA, United Kingdom",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "country": "United Kingdom",
        "country_code": "gb",
        "region": "England",
        "city": "London",
        "district": "Westminster",
        "postcode": "SW1A 1AA",
        "type": "city",
    },
    "new york": {
        "id": "loc-nyc-05",
        "display_name": "New York, NY, United States",
        "formatted_address": "Manhattan, New York, NY 10001, United States",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "country": "United States",
        "country_code": "us",
        "region": "New York",
        "city": "New York",
        "district": "Manhattan",
        "postcode": "10001",
        "type": "city",
    },
    "chicago": {
        "id": "loc-chi-06",
        "display_name": "Chicago, IL, United States",
        "formatted_address": "Chicago, IL 60601, United States",
        "latitude": 41.8781,
        "longitude": -87.6298,
        "country": "United States",
        "country_code": "us",
        "region": "Illinois",
        "city": "Chicago",
        "district": "Cook",
        "postcode": "60601",
        "type": "city",
    },
}

class MockLocationProvider(LocationProvider):
    async def autocomplete(
        self,
        query: str,
        country: Optional[str] = None,
        limit: int = 5,
        bias_lat: Optional[float] = None,
        bias_lng: Optional[float] = None,
    ) -> List[LocationAutocompleteItem]:
        q = query.lower().strip()
        results: List[LocationAutocompleteItem] = []
        for key, loc in PREDEFINED_LOCATIONS.items():
            if q in key or key in q or q in loc["display_name"].lower():
                results.append(
                    LocationAutocompleteItem(
                        id=loc["id"],
                        label=loc["display_name"],
                        secondary_label=f"{loc['region']}, {loc['country']}",
                        latitude=loc["latitude"],
                        longitude=loc["longitude"],
                        type=loc["type"],
                        country=loc["country"],
                        country_code=loc["country_code"],
                        state=loc["region"],
                        city=loc["city"],
                        postcode=loc["postcode"],
                        confidence=0.98,
                    )
                )

        if not results:
            results.append(
                LocationAutocompleteItem(
                    id=f"loc-{uuid.uuid4().hex[:8]}",
                    label=f"{query.title()}, Operational Zone",
                    secondary_label="Regional Logistics Terminal",
                    latitude=30.3165,
                    longitude=78.0322,
                    type="city",
                    country="Global",
                    country_code="gl",
                    city=query.title(),
                    confidence=0.90,
                )
            )

        return results[:limit]

    async def geocode(self, query: str, limit: int = 1) -> List[ResolvedLocation]:
        q = query.lower().strip()
        for key, loc in PREDEFINED_LOCATIONS.items():
            if q in key or key in q:
                return [
                    ResolvedLocation(
                        id=loc["id"],
                        display_name=loc["display_name"],
                        formatted_address=loc["formatted_address"],
                        latitude=loc["latitude"],
                        longitude=loc["longitude"],
                        country=loc["country"],
                        country_code=loc["country_code"],
                        region=loc["region"],
                        city=loc["city"],
                        district=loc["district"],
                        postcode=loc["postcode"],
                        type=loc["type"],
                        confidence=1.0,
                        provider="mock",
                    )
                ]
        return [
            ResolvedLocation(
                id=f"res-{uuid.uuid4().hex[:8]}",
                display_name=f"{query.title()}, Operational Node",
                formatted_address=f"{query.title()}, Operational Logistics Node",
                latitude=30.3165,
                longitude=78.0322,
                country="Global",
                country_code="gl",
                city=query.title(),
                type="city",
                confidence=0.85,
                provider="mock",
            )
        ]

    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float,
    ) -> ResolvedLocation:
        for loc in PREDEFINED_LOCATIONS.values():
            if abs(loc["latitude"] - latitude) < 0.2 and abs(loc["longitude"] - longitude) < 0.2:
                return ResolvedLocation(
                    id=loc["id"],
                    display_name=loc["display_name"],
                    formatted_address=loc["formatted_address"],
                    latitude=latitude,
                    longitude=longitude,
                    country=loc["country"],
                    country_code=loc["country_code"],
                    region=loc["region"],
                    city=loc["city"],
                    type=loc["type"],
                    confidence=1.0,
                    provider="mock",
                )
        return ResolvedLocation(
            id=f"rev-{uuid.uuid4().hex[:8]}",
            display_name=f"{latitude:.4f}, {longitude:.4f}",
            formatted_address=f"{latitude:.4f}, {longitude:.4f}",
            latitude=latitude,
            longitude=longitude,
            type="coordinate",
            provider="mock",
        )

    async def route(
        self,
        origin: Coordinate,
        destination: Coordinate,
        mode: str = "drive",
        waypoints: Optional[List[Coordinate]] = None,
    ) -> RouteResult:
        import math
        dlat = math.radians(destination.latitude - origin.latitude)
        dlon = math.radians(destination.longitude - origin.longitude)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(origin.latitude)) * math.cos(math.radians(destination.latitude)) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        road_meters = 6371000 * c * 1.25
        duration = road_meters / 18.0

        coords = [[origin.longitude, origin.latitude]]
        if waypoints:
            for wp in waypoints:
                coords.append([wp.longitude, wp.latitude])
        coords.append([(origin.longitude + destination.longitude) / 2, (origin.latitude + destination.latitude) / 2 + 0.01])
        coords.append([destination.longitude, destination.latitude])

        return RouteResult(
            distance_meters=road_meters,
            duration_seconds=duration,
            geometry={"type": "LineString", "coordinates": coords},
            legs=[RouteLeg(distance_meters=road_meters, duration_seconds=duration)],
            mode=mode,
            provider="mock",
            route_hash="mock-route-hash",
        )

    async def route_matrix(
        self,
        sources: List[Coordinate],
        targets: List[Coordinate],
        mode: str = "drive",
    ) -> RouteMatrixResult:
        cells = []
        for s_idx, s in enumerate(sources):
            s_id = s.id or f"src_{s_idx}"
            for t_idx, t in enumerate(targets):
                t_id = t.id or f"tgt_{t_idx}"
                r = await self.route(s, t, mode)
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
            provider="mock",
        )

    async def places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        categories: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[PlaceItem]:
        return [
            PlaceItem(
                id="poi-mock-1",
                name="Central Freight Terminal & Charging Hub",
                category="commercial.transportation",
                latitude=latitude + 0.008,
                longitude=longitude + 0.005,
                formatted_address="Industrial Corridor 4, Logistics Park",
                distance_meters=850.0,
            ),
            PlaceItem(
                id="poi-mock-2",
                name="Intermodal Rail Relay Station",
                category="service.railway",
                latitude=latitude - 0.012,
                longitude=longitude - 0.008,
                formatted_address="Rail Road Terminal 2",
                distance_meters=1420.0,
            ),
        ]

    async def place_details(self, provider_place_id: str) -> Optional[Dict[str, Any]]:
        return {
            "place_id": provider_place_id,
            "name": "NEXUS Certified Logistics Hub",
            "categories": ["commercial.transportation"],
            "opening_hours": "24/7",
        }

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "HEALTHY",
            "provider": "mock",
            "geocoding": "operational",
            "routing": "operational",
            "places": "operational",
        }
