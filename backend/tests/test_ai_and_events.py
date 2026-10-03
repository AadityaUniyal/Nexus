import pytest
from unittest.mock import AsyncMock, patch

from app.services.ai_service import AIResult, AIService, ai_service
from app.services.platform_metrics import PlatformMetrics


@pytest.mark.asyncio
async def test_ai_status_reports_chain(async_client):
    r = await async_client.get("/api/v1/ai/status")
    assert r.status_code == 200
    body = r.json()
    assert body["chain"][-1] == "deterministic"
    assert set(body["providers"]) == {"groq", "gemini"}


@pytest.mark.asyncio
async def test_ai_chat_falls_back_without_keys(async_client):
    with patch.object(ai_service, "complete", AsyncMock(return_value=None)):
        r = await async_client.post("/api/v1/ai/chat", json={"prompt": "How is SLA?"})
    assert r.status_code == 200
    assert r.json()["source"] == "deterministic"


@pytest.mark.asyncio
async def test_ai_chat_uses_provider_result(async_client):
    fake = AIResult(text="SLA is fine", provider="gemini", model="gemini-2.5-flash", latency_ms=12)
    with patch.object(ai_service, "complete", AsyncMock(return_value=fake)):
        r = await async_client.post("/api/v1/ai/chat", json={"prompt": "SLA?"})
    assert r.json()["reply"] == "SLA is fine"
    assert r.json()["source"] == "gemini"


@pytest.mark.asyncio
async def test_ai_insights_deterministic(async_client):
    with patch.object(ai_service, "complete", AsyncMock(return_value=None)):
        r = await async_client.post("/api/v1/ai/insights", json={"timeframe": "7d"})
    assert r.status_code == 200
    assert r.json()["provider"] == "deterministic"
    assert "SLA" in r.json()["insights"]


@pytest.mark.asyncio
async def test_ai_briefing_shape(async_client):
    r = await async_client.post("/api/v1/ai/briefing")
    assert r.status_code == 200
    assert "briefing" in r.json()


@pytest.mark.asyncio
async def test_provider_chain_falls_through_to_gemini():
    svc = AIService()
    svc._client = object()
    svc.gemini_key = "test"
    svc._call_groq = AsyncMock(side_effect=RuntimeError("rate limited"))
    svc._call_gemini = AsyncMock(return_value="from gemini")
    result = await svc.complete("sys", "user")
    assert result.provider == "gemini" and result.text == "from gemini"
    assert svc.stats.get("groq").failures == 1


@pytest.mark.asyncio
async def test_track_events_accepts_batch(async_client):
    payload = {"events": [
        {"name": "page_view", "path": "/analytics", "sessionId": "s1", "device": "desktop"},
        {"name": "feature_used", "properties": {"feature": "export", "nested": {"x": 1}}},
    ]}
    r = await async_client.post("/api/v1/events/track", json=payload)
    assert r.status_code == 202
    assert r.json()["accepted"] == 2


@pytest.mark.asyncio
async def test_track_rejects_unknown_event(async_client):
    r = await async_client.post("/api/v1/events/track", json={"events": [{"name": "drop_table"}]})
    assert r.status_code == 422


def test_platform_metrics_percentiles():
    m = PlatformMetrics()
    for i in range(100):
        m.record("/api/v1/incidents/abc123def", 200 if i < 98 else 500, float(i))
    snap = m.snapshot()
    assert snap["requests"] == 100
    assert snap["errorRatePct"] == 2.0
    assert snap["latencyMs"]["p50"] == 50.0
    assert snap["topRoutes"][0]["route"] == "/api/v1/incidents/:id"
