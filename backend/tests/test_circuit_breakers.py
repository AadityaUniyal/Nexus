import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.core.resilience import CircuitBreaker, CircuitState, geo_circuit, weather_circuit, ai_circuit
from app.integrations.location.geoapify import GeoapifyLocationProvider
from app.integrations.location.schemas import Coordinate
from app.integrations.weather.open_meteo import OpenMeteoWeatherProvider
from app.services.ai_service import AIService, AIResult


@pytest.fixture(autouse=True)
def reset_circuits():
    geo_circuit.reset()
    weather_circuit.reset()
    ai_circuit.reset()
    yield
    geo_circuit.reset()
    weather_circuit.reset()
    ai_circuit.reset()


@pytest.mark.asyncio
async def test_circuit_breaker_closed_to_open_transition():
    cb = CircuitBreaker("test_circuit", failure_threshold=3, recovery_timeout_seconds=0.1, request_timeout_seconds=1.0)
    assert cb.state == CircuitState.CLOSED

    async def failing_call():
        raise RuntimeError("External service error")

    # Call fails 1 and 2: still CLOSED
    for i in range(2):
        with pytest.raises(RuntimeError):
            await cb.call(failing_call)
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == i + 1

    # Call 3: reaches threshold -> trips to OPEN
    with pytest.raises(RuntimeError):
        await cb.call(failing_call)
    assert cb.state == CircuitState.OPEN
    assert cb.failure_count == 3


@pytest.mark.asyncio
async def test_circuit_breaker_open_executes_fallback_without_calling_target():
    cb = CircuitBreaker("test_fallback", failure_threshold=2, recovery_timeout_seconds=10.0)
    target_called = False

    async def failing_target():
        nonlocal target_called
        target_called = True
        raise RuntimeError("Service down")

    # Trip the circuit
    for _ in range(2):
        with pytest.raises(RuntimeError):
            await cb.call(failing_target)
    assert cb.state == CircuitState.OPEN

    target_called = False
    fallback_res = await cb.call(failing_target, fallback_func=lambda: "fallback_value")
    assert fallback_res == "fallback_value"
    assert target_called is False  # Target was never invoked because circuit is OPEN!
    assert cb.total_fallbacks >= 1


@pytest.mark.asyncio
async def test_circuit_breaker_half_open_recovery():
    cb = CircuitBreaker("test_recovery", failure_threshold=2, recovery_timeout_seconds=0.05)
    async def failing():
        raise RuntimeError("fail")

    for _ in range(2):
        with pytest.raises(RuntimeError):
            await cb.call(failing)
    assert cb.state == CircuitState.OPEN

    # Wait for recovery timeout
    await asyncio.sleep(0.06)

    # Next call should be permitted as HALF_OPEN probe; if successful, transition to CLOSED
    async def probe_success():
        return "recovered"

    result = await cb.call(probe_success)
    assert result == "recovered"
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


@pytest.mark.asyncio
async def test_geo_circuit_wires_into_geoapify_route():
    provider = GeoapifyLocationProvider(api_key="test-key")
    geo_circuit.reset()

    # Mock client to fail with HTTP 500 / 429
    mock_resp = MagicMock()
    mock_resp.status_code = 500

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_resp)

    with patch.object(provider, "_get_client", AsyncMock(return_value=mock_client)):
        origin = Coordinate(latitude=40.0, longitude=-105.0)
        dest = Coordinate(latitude=40.5, longitude=-105.2)

        # 3 failures should trip geo_circuit
        for _ in range(3):
            res = await provider.route(origin, dest)
            assert res.provider == "geoapify-approx"

        assert geo_circuit.state == CircuitState.OPEN
        assert geo_circuit.failure_count >= 3

        # Next call should fast-return fallback approximation without even calling client.get
        mock_client.get.reset_mock()
        res_fast = await provider.route(origin, dest)
        assert res_fast.provider == "geoapify-approx"
        assert mock_client.get.call_count == 0


@pytest.mark.asyncio
async def test_ai_circuit_wires_into_ai_service_complete():
    svc = AIService()
    svc._client = object()
    svc.groq_key = "test"
    ai_circuit.reset()

    # Simulate Groq raising rate limit error
    svc._call_groq = AsyncMock(side_effect=RuntimeError("Groq HTTP 429: Rate limit reached"))

    # When AI provider fails 3 times, ai_circuit trips to OPEN
    for _ in range(3):
        res = await svc.complete("sys", "user")
        assert res is None

    assert ai_circuit.state == CircuitState.OPEN

    # Once OPEN, AIService gracefully falls through without calling Groq
    svc._call_groq.reset_mock()
    res_open = await svc.complete("sys", "user")
    assert res_open is None
    assert svc._call_groq.call_count == 0

    # Downstream explain_metrics falls back gracefully to deterministic
    insights = await svc.explain_metrics({"slaComplianceRate": 98.2})
    assert insights["provider"] == "deterministic"
    assert "98.2%" in insights["insights"]


@pytest.mark.asyncio
async def test_weather_circuit_wires_into_open_meteo_fallback():
    weather_circuit.reset()
    provider = OpenMeteoWeatherProvider()

    # Simulate network failure
    with patch("httpx.AsyncClient.get", AsyncMock(side_effect=httpx.ConnectError("Network drop"))):
        # 3 failures trip weather_circuit
        for _ in range(3):
            w = await provider.get_point_weather(41.1399, -104.8202)
            assert w["provider"] == "open-meteo-fallback"
            assert w["hazard_level"] == "NORMAL"

        assert weather_circuit.state == CircuitState.OPEN

        # In OPEN state, fallback is returned immediately
        w_fast = await provider.get_point_weather(41.1399, -104.8202)
        assert w_fast["provider"] == "open-meteo-fallback"
