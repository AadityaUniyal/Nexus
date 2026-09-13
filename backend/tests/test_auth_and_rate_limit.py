import time
import pytest
from httpx import AsyncClient
from app.core.rate_limit import SlidingWindowRateLimiter

def test_sliding_window_rate_limiter():
    limiter = SlidingWindowRateLimiter()
    client_ip = "192.168.1.100"

    allowed, limit, remaining, reset_time = limiter.check(client_ip, tier="standard")
    assert allowed is True
    assert limit == 120
    assert remaining == 119

    now = time.time()
    limiter.history[f"standard:{client_ip}"] = [now] * 120
    allowed, limit, remaining, reset_time = limiter.check(client_ip, tier="standard")
    assert allowed is False
    assert remaining == 0

@pytest.mark.asyncio
async def test_cors_headers(async_client: AsyncClient):
    response = await async_client.get("/health/live", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000" or response.headers.get("access-control-allow-origin") == "*"
