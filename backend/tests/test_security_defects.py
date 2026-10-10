import pytest
from httpx import AsyncClient
from app.core.config import Settings
from app.core.rate_limit import BoundedSlidingWindowLimiter
from app.core.time_utils import parse_and_validate_local_time
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_s1_deleted_prototype_endpoints_return_404(client_a: AsyncClient):
    """S1: Prototype fake endpoints (admin, weather, simulation, ai_chat) must not exist."""
    routes = [
        "/api/v1/admin/overview",
        "/api/v1/weather/hazards",
        "/api/v1/simulations/detour",
        "/api/v1/ai/briefing",
        "/api/v1/voice/copilot",
    ]
    for route in routes:
        response = await client_a.get(route)
        assert response.status_code == 404, f"Route {route} should return 404 but returned {response.status_code}"

@pytest.mark.asyncio
async def test_s2_config_fails_on_insecure_defaults():
    """S2: Configuration validator must reject default demo secrets in non-test mode."""
    with pytest.raises(ValueError, match="SECRET_KEY must be securely configured"):
        s = Settings(
            APP_ENV="production",
            CLERK_SECRET_KEY="dev_mock_key_change_in_production",
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db"
        )
        s.validate_runtime_config()

@pytest.mark.asyncio
async def test_s3_rate_limiter_throttles():
    """S3: Sliding window rate limiter throttles excessive requests."""
    limiter = BoundedSlidingWindowLimiter(capacity=100)
    key = "test-rate-limit-principal"
    
    # 5 allowed
    for _ in range(5):
        allowed, _ = limiter.is_allowed(key, max_requests=5, window_seconds=60)
        assert allowed is True
        
    # 6th blocked
    allowed, retry_after = limiter.is_allowed(key, max_requests=5, window_seconds=60)
    assert allowed is False
    assert retry_after > 0

@pytest.mark.asyncio
async def test_s4_owasp_security_headers_present(client_a: AsyncClient):
    """S4: Responses must include mandatory OWASP security headers."""
    response = await client_a.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"

@pytest.mark.asyncio
async def test_s7_dst_handling_and_timezones():
    """S7: DST gaps and ambiguities must be detected and handled with fold support."""
    # Test valid UTC conversion for America/New_York (EDT is UTC-4 in October)
    start_utc = parse_and_validate_local_time(
        local_time_str="2026-10-15 09:00:00",
        tz_name="America/New_York"
    )
    assert start_utc.tzinfo == timezone.utc
    assert start_utc.hour == 13

    # Spring forward gap: 2026-03-08 02:30:00 does not exist in America/New_York
    with pytest.raises(ValueError, match="LOCAL_TIME_NONEXISTENT"):
        parse_and_validate_local_time(
            local_time_str="2026-03-08 02:30:00",
            tz_name="America/New_York"
        )
