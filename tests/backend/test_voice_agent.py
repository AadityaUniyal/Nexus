import pytest
from app.voice.service import voice_agent_service
from app.voice.schemas import VoiceCommandRequest
from app.voice.tools import execute_voice_tool


@pytest.mark.asyncio
async def test_voice_tool_map_fly_to():
    res = await execute_voice_tool("map_fly_to", {"location_name": "Chicago"})
    assert res["action"] == "MAP_FLY_TO"
    assert "latitude" in res
    assert "longitude" in res
    assert "Chicago" in res["speech"]


@pytest.mark.asyncio
async def test_voice_tool_simulation_run():
    res = await execute_voice_tool("run_whatif_simulation", {
        "vehicle_code": "NX-104",
        "detour_route": "I-70_SOUTH_DETOUR",
    })
    assert res["action"] == "RUN_SIMULATION"
    assert res["time_saved_mins"] > 0
    assert res["recommendation_score"] >= 80


@pytest.mark.asyncio
async def test_voice_command_processing():
    req = VoiceCommandRequest(transcript="Fly map to Denver terminal")
    res = await voice_agent_service.process_spoken_command(req)
    assert res.speech_response is not None
    assert len(res.speech_response) > 5
