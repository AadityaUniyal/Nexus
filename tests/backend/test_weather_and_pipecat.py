import pytest
from app.integrations.weather import open_meteo_provider
from app.voice.pipecat_bot import run_pipecat_session

@pytest.mark.asyncio
async def test_open_meteo_point_weather():
    res = await open_meteo_provider.get_point_weather(41.1399, -104.8202)
    assert "temperature_c" in res
    assert "wind_speed_kmh" in res
    assert "hazard_level" in res
    assert res["hazard_level"] in ["NORMAL", "WARNING", "CRITICAL"]

@pytest.mark.asyncio
async def test_native_pipecat_pipeline_session():
    test_transcript = "Fly map to Chicago hub"
    output = await run_pipecat_session(test_transcript)
    assert isinstance(output, str)
    assert len(output) > 5
