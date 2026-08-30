import pytest
from app.api.v1.endpoints.admin import (
    get_geoapify_integration_status,
    test_geoapify_integration,
    get_data_pipeline_health,
)

@pytest.mark.asyncio
async def test_admin_geoapify_diagnostics():
    status = await get_geoapify_integration_status()
    assert status["configured"] is True
    assert "metrics" in status
    assert status["status"] in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]

    test_res = await test_geoapify_integration()
    assert "provider" in test_res
    assert test_res["status"] in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]

@pytest.mark.asyncio
async def test_admin_pipeline_health():
    from unittest.mock import AsyncMock
    mock_db = AsyncMock()
    nodes = await get_data_pipeline_health(db=mock_db)
    assert len(nodes) >= 4
    source_types = [n.source_type for n in nodes]
    assert "IOT_TELEMETRY" in source_types
    assert "AZURE_HUB" in source_types
    assert "FABRIC_LAKE" in source_types
