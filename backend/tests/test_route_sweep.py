import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_unauthenticated_route_sweep(unauth_client: AsyncClient):
    """Unauthenticated calls to protected routes must be rejected with 401/403."""
    protected_get_routes = [
        "/api/v1/me",
        "/api/v1/workspaces/current",
        "/api/v1/drivers",
        "/api/v1/jobs",
        "/api/v1/analytics",
        "/api/v1/audit",
        "/api/v1/maps/token",
    ]
    for route in protected_get_routes:
        res = await unauth_client.get(route)
        assert res.status_code in [401, 403], f"Route {route} allowed unauthenticated access: {res.status_code}"

@pytest.mark.asyncio
async def test_malformed_payload_sweep(client_a: AsyncClient):
    """Malformed payloads must return 400/422 validation errors with zero 500 crashes."""
    invalid_post_cases = [
        ("/api/v1/drivers", {"name": ""}),
        ("/api/v1/jobs", {"title": 12345}),
        ("/api/v1/jobs/preview-route", {"origin_lat": "not-a-number"}),
        ("/api/v1/workspaces/invites", {"role": "superadmin_invalid"}),
    ]
    for route, bad_payload in invalid_post_cases:
        res = await client_a.post(route, json=bad_payload)
        assert res.status_code in [400, 422], f"Route {route} did not return 400/422 for bad payload: {res.status_code}"
