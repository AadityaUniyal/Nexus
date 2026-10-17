import pytest
from httpx import AsyncClient
from app.auth.principal import RequestPrincipal, RoleEnum, ROLE_PERMISSIONS_MAP
from app.main import app
from app.auth.dependencies import require_workspace, require_authenticated

@pytest.mark.asyncio
async def test_tenant_isolation_analytics_access(async_client: AsyncClient):
    """
    Verify that an authenticated user in Tenant A (ws-continental-fleet-01)
    cannot be overridden to view Tenant B data by passing another workspace ID.
    """
    # Request overview with explicit foreign workspace ID
    res = await async_client.get(
        "/api/v1/analytics/overview?workspace_id=ws-tenant-bravo",
        headers={"Authorization": "Bearer demo-admin-token"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    # The returned data must strictly be bound to the authenticated principal's workspace
    assert data["workspaceId"] == "ws-continental-fleet-01"

@pytest.mark.asyncio
async def test_driver_endpoint_token_protection(async_client: AsyncClient):
    """
    Verify that driver manifest and status routes reject unauthorized or invalid tokens.
    """
    # Manifest without valid token
    res_manifest = await async_client.get("/api/v1/driver/manifest?vehicle_code=NX-804&token=invalid-token")
    assert res_manifest.status_code == 401

    # Status update without valid token
    res_status = await async_client.post("/api/v1/driver/status", json={
        "vehicle_code": "NX-804",
        "status": "EN_ROUTE",
        "token": "invalid-token"
    })
    assert res_status.status_code == 401

@pytest.mark.asyncio
async def test_driver_dispatch_token_issuance_and_validation(async_client: AsyncClient):
    """
    Verify that generating a dispatch token returns a valid token that can authenticate driver requests.
    """
    tok_res = await async_client.post("/api/v1/driver/dispatch-token", json={
        "vehicle_code": "NX-804",
        "route_code": "COR-DEL-DED-01",
        "driver_name": "Rajesh Sharma"
    })
    assert tok_res.status_code == 200
    tok_data = tok_res.json()
    assert "token" in tok_data
    token = tok_data["token"]

    # Now fetch manifest with the issued token
    man_res = await async_client.get(f"/api/v1/driver/manifest?vehicle_code=NX-804&token={token}")
    assert man_res.status_code == 200
    man_data = man_res.json()
    assert man_data["vehicle_code"] == "NX-804"
