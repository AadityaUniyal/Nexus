import pytest
from app.integrations.location.mock import MockLocationProvider
from app.integrations.location.schemas import Coordinate
from app.services.location_service import LocationService

@pytest.mark.asyncio
async def test_mock_location_autocomplete():
    provider = MockLocationProvider()
    results = await provider.autocomplete("Dehradun", limit=5)
    assert len(results) >= 1
    assert any("Dehradun" in r.label for r in results)
    item = results[0]
    assert item.latitude > 0
    assert item.longitude > 0
    assert item.country == "India"

@pytest.mark.asyncio
async def test_mock_location_geocode_and_reverse():
    provider = MockLocationProvider()
    geo_res = await provider.geocode("Tokyo")
    assert len(geo_res) == 1
    tokyo = geo_res[0]
    assert tokyo.city == "Tokyo"
    assert tokyo.country == "Japan"

    rev_res = await provider.reverse_geocode(35.6762, 139.6503)
    assert rev_res.city == "Tokyo"
    assert rev_res.country == "Japan"

@pytest.mark.asyncio
async def test_mock_location_routing():
    provider = MockLocationProvider()
    origin = Coordinate(latitude=30.3165, longitude=78.0322, id="wh-dehradun")
    destination = Coordinate(latitude=28.6139, longitude=77.2090, id="wh-delhi")
    
    route = await provider.route(origin, destination, mode="drive")
    assert route.distance_meters > 100000  # >100 km
    assert route.duration_seconds > 0
    assert route.geometry["type"] == "LineString"
    assert len(route.geometry["coordinates"]) >= 2

@pytest.mark.asyncio
async def test_mock_route_matrix():
    provider = MockLocationProvider()
    sources = [
        Coordinate(latitude=30.3165, longitude=78.0322, id="v-01"),
        Coordinate(latitude=30.3200, longitude=78.0400, id="v-02"),
    ]
    targets = [
        Coordinate(latitude=28.6139, longitude=77.2090, id="cust-101"),
    ]
    matrix = await provider.route_matrix(sources, targets)
    assert matrix.sources_count == 2
    assert matrix.targets_count == 1
    assert len(matrix.cells) == 2
    assert matrix.cells[0].source_id == "v-01"
    assert matrix.cells[1].source_id == "v-02"

@pytest.mark.asyncio
async def test_location_service_caching():
    res1 = await LocationService.autocomplete("London")
    assert len(res1) > 0
    res2 = await LocationService.autocomplete("London")
    assert len(res2) == len(res1)
    metrics = LocationService.get_metrics()
    assert metrics["cache_hits"] >= 1
