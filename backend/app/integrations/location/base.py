from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.integrations.location.schemas import (
    Coordinate,
    LocationAutocompleteItem,
    PlaceItem,
    ResolvedLocation,
    RouteMatrixResult,
    RouteResult,
)

class LocationProvider(ABC):
    @abstractmethod
    async def autocomplete(
        self,
        query: str,
        country: Optional[str] = None,
        limit: int = 5,
        bias_lat: Optional[float] = None,
        bias_lng: Optional[float] = None,
    ) -> List[LocationAutocompleteItem]:
        """Fetch address and place search suggestions for given text."""
        pass

    @abstractmethod
    async def geocode(self, query: str, limit: int = 1) -> List[ResolvedLocation]:
        """Forward geocode a text query to normalized coordinates and metadata."""
        pass

    @abstractmethod
    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float,
    ) -> ResolvedLocation:
        """Reverse geocode coordinates into a structured location."""
        pass

    @abstractmethod
    async def route(
        self,
        origin: Coordinate,
        destination: Coordinate,
        mode: str = "drive",
        waypoints: Optional[List[Coordinate]] = None,
    ) -> RouteResult:
        """Calculate a turn-by-turn road route with GeoJSON geometry and distance/duration."""
        pass

    @abstractmethod
    async def route_matrix(
        self,
        sources: List[Coordinate],
        targets: List[Coordinate],
        mode: str = "drive",
    ) -> RouteMatrixResult:
        """Compute an MxN distance and duration matrix between source and target points."""
        pass

    @abstractmethod
    async def places(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int = 5000,
        categories: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[PlaceItem]:
        """Discover points of interest around geographic coordinates."""
        pass

    @abstractmethod
    async def place_details(self, provider_place_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve detailed metadata for a specific geographic place."""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Verify API connectivity, credentials validity, and service health."""
        pass
