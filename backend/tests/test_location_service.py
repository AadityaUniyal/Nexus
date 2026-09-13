import pytest
from app.services.location_service import LocationService

@pytest.mark.asyncio
async def test_location_autocomplete_empty_query():
    results = await LocationService.autocomplete(query="a", limit=5)
    assert results == []

@pytest.mark.asyncio
async def test_location_autocomplete_valid():
    results = await LocationService.autocomplete(query="Cheyenne Hub", limit=3)
    assert isinstance(results, list)

@pytest.mark.asyncio
async def test_resolve_location_by_query():
    res = await LocationService.resolve_location(query="Denver Superhub")
    assert res is not None
    assert res.formatted_address is not None
    assert res.latitude is not None and res.longitude is not None
