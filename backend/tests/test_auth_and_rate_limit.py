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

@pytest.mark.asyncio
async def test_cors_preflight_allows_workspace_id_header(async_client: AsyncClient):
    response = await async_client.options(
        "/health/live",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization, X-Workspace-ID",
        },
    )
    assert response.status_code == 200
    allow_headers = response.headers.get("access-control-allow-headers", "").lower()
    assert "x-workspace-id" in allow_headers

@pytest.mark.asyncio
async def test_signup_privileged_role_forbidden(async_client: AsyncClient):
    """Test that public registration cannot self-assign ADMINISTRATOR role."""
    response = await async_client.post(
        "/api/v1/auth/signup",
        json={
            "email": "attacker@nexus.unauthorized",
            "name": "Attacker",
            "password": "Password123!",
            "role": "ADMINISTRATOR"
        }
    )
    assert response.status_code == 403
    data = response.json()
    assert "PRIVILEGED_ROLE_FORBIDDEN" in str(data)

@pytest.mark.asyncio
async def test_forgot_password_reports_unconfigured_delivery(async_client: AsyncClient):
    """Password recovery must not report success until reset links can be delivered."""
    response = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@nexus.ops"}
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "PASSWORD_RECOVERY_UNAVAILABLE"

@pytest.mark.asyncio
async def test_hs256_token_verification():
    """Verify local HS256 tokens decode properly through verify_clerk_token."""
    from app.core.security import create_access_token
    from app.auth.clerk_jwt import verify_clerk_token

    token = create_access_token(
        subject="usr-test-hs256",
        extra_claims={"email": "operator@nexus.ops", "role": "OPERATOR"}
    )
    claims = await verify_clerk_token(token)
    assert claims["sub"] == "usr-test-hs256"
    assert claims["role"] == "OPERATOR"

