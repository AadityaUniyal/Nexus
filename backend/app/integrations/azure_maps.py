import os
import time
import logging
import httpx
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from azure.identity import DefaultAzureCredential
from app.core.config import settings

logger = logging.getLogger("nexus.azure_maps")


class AzureMapsException(Exception):
    def __init__(self, message: str, status_code: int = 500, reason: str = "PROVIDER_UNAVAILABLE"):
        super().__init__(message)
        self.status_code = status_code
        self.reason = reason


class AzureMapsClient:
    """
    Client for Azure Maps Gen2 using Microsoft Entra ID authentication only.
    Zero API keys. Zero mock/fake routes. Raises typed exceptions on failure.
    """

    def __init__(self):
        self._credential: Optional[DefaultAzureCredential] = None
        self._cached_token: Optional[str] = None
        self._token_expires_at: float = 0
        self.base_url = "https://atlas.microsoft.com"

    def _get_credential(self) -> DefaultAzureCredential:
        if self._credential is None:
            self._credential = DefaultAzureCredential(exclude_interactive_browser_credential=True)
        return self._credential

    async def get_bearer_token(self) -> Tuple[str, int]:
        """
        Retrieves or refreshes an Entra ID token for Azure Maps scope.
        Returns (token_string, expires_in_seconds).
        """
        now = time.time()
        if self._cached_token and self._token_expires_at > (now + 120):
            return self._cached_token, int(self._token_expires_at - now)

        try:
            cred = self._get_credential()
            token_obj = cred.get_token("https://atlas.microsoft.com/.default")
            self._cached_token = token_obj.token
            self._token_expires_at = token_obj.expires_on
            expires_in = max(60, int(token_obj.expires_on - now))
            return self._cached_token, expires_in
        except Exception as exc:
            logger.error("Failed to acquire Entra ID token for Azure Maps: %s", exc)
            raise AzureMapsException(f"Authentication failure: {str(exc)}", status_code=502, reason="AUTH_FAILURE")

    def _get_client_id(self) -> str:
        cid = settings.AZURE_MAPS_CLIENT_ID or os.getenv("AZURE_MAPS_CLIENT_ID", "")
        return cid.strip()

    async def get_frontend_token(self) -> Dict[str, Any]:
        """Issues short-lived token details for the frontend MapLibre GL JS client."""
        token, expires_in = await self.get_bearer_token()
        client_id = self._get_client_id()
        return {
            "token": token,
            "clientId": client_id,
            "expiresIn": expires_in,
            "expiresAt": datetime.fromtimestamp(self._token_expires_at, tz=timezone.utc).isoformat(),
        }

    async def search_address(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search and autocomplete addresses globally."""
        if not query or not query.strip():
            return []

        token, _ = await self.get_bearer_token()
        client_id = self._get_client_id()

        headers = {
            "Authorization": f"Bearer {token}",
            "x-ms-client-id": client_id,
            "User-Agent": "NEXUS-Backend/2.0",
        }
        params = {
            "api-version": "1.0",
            "query": query.strip(),
            "limit": min(limit, 10),
            "typeahead": "true",
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/search/address/json", headers=headers, params=params)
                if resp.status_code != 200:
                    logger.warning("Azure Maps search HTTP %d: %s", resp.status_code, resp.text)
                    raise AzureMapsException(f"Azure Maps search error: HTTP {resp.status_code}", status_code=resp.status_code)
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    pos = item.get("position", {})
                    addr = item.get("address", {})
                    results.append({
                        "address": addr.get("freeformAddress", query),
                        "lat": pos.get("lat"),
                        "lon": pos.get("lon"),
                        "country": addr.get("countryCode", ""),
                        "score": item.get("score", 0),
                    })
                return results
            except httpx.RequestError as exc:
                logger.error("Azure Maps request failed: %s", exc)
                raise AzureMapsException("Connection to Azure Maps failed", status_code=504, reason="PROVIDER_UNAVAILABLE")

    async def calculate_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        depart_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculates directions with live traffic between origin and destination.
        """
        token, _ = await self.get_bearer_token()
        client_id = self._get_client_id()

        headers = {
            "Authorization": f"Bearer {token}",
            "x-ms-client-id": client_id,
            "User-Agent": "NEXUS-Backend/2.0",
        }
        coordinates_query = f"{origin_lat},{origin_lon}:{dest_lat},{dest_lon}"
        params: Dict[str, Any] = {
            "api-version": "1.0",
            "query": coordinates_query,
            "traffic": "true",
            "computeTravelTimeFor": "all",
            "routeType": "fastest",
        }
        if depart_at:
            params["departAt"] = depart_at.isoformat()

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(f"{self.base_url}/route/directions/json", headers=headers, params=params)
                if resp.status_code != 200:
                    logger.warning("Azure Maps route HTTP %d: %s", resp.status_code, resp.text)
                    raise AzureMapsException(f"Azure Maps route error: HTTP {resp.status_code}", status_code=resp.status_code)

                data = resp.json()
                routes = data.get("routes", [])
                if not routes:
                    raise AzureMapsException("No route found between coordinates", status_code=404, reason="NO_ROUTE_FOUND")

                summary = routes[0].get("summary", {})
                legs = routes[0].get("legs", [])
                points: List[List[float]] = []
                for leg in legs:
                    for pt in leg.get("points", []):
                        points.append([pt.get("longitude"), pt.get("latitude")])

                return {
                    "travel_time_seconds": summary.get("travelTimeInSeconds", 0),
                    "traffic_delay_seconds": summary.get("trafficDelayInSeconds", 0),
                    "distance_meters": summary.get("lengthInMeters", 0),
                    "coordinates": points,
                }
            except httpx.RequestError as exc:
                logger.error("Azure Maps request failed: %s", exc)
                raise AzureMapsException("Azure Maps connection error", status_code=504, reason="PROVIDER_UNAVAILABLE")

    async def calculate_route_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]]
    ) -> List[Dict[str, Any]]:
        """
        Calculates 1-to-N or N-to-N route matrix for dispatch optimization.
        """
        token, _ = await self.get_bearer_token()
        client_id = self._get_client_id()

        headers = {
            "Authorization": f"Bearer {token}",
            "x-ms-client-id": client_id,
            "Content-Type": "application/json",
            "User-Agent": "NEXUS-Backend/2.0",
        }
        body = {
            "origins": {"type": "MultiPoint", "coordinates": [[o[1], o[0]] for o in origins]},
            "destinations": {"type": "MultiPoint", "coordinates": [[d[1], d[0]] for d in destinations]},
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}/route/matrix/json?api-version=1.0&traffic=true",
                    headers=headers,
                    json=body
                )
                if resp.status_code != 200:
                    raise AzureMapsException(f"Azure Maps matrix error: HTTP {resp.status_code}", status_code=resp.status_code)

                data = resp.json()
                matrix = data.get("matrix", [])
                results = []
                for row_idx, row in enumerate(matrix):
                    for col_idx, cell in enumerate(row):
                        resp_data = cell.get("response", {})
                        route_summary = resp_data.get("routeSummary", {})
                        results.append({
                            "origin_index": row_idx,
                            "destination_index": col_idx,
                            "status_code": cell.get("statusCode", 200),
                            "travel_time_seconds": route_summary.get("travelTimeInSeconds"),
                            "length_meters": route_summary.get("lengthInMeters"),
                        })
                return results
            except httpx.RequestError as exc:
                raise AzureMapsException("Azure Maps matrix connection error", status_code=504, reason="PROVIDER_UNAVAILABLE")


azure_maps_client = AzureMapsClient()
