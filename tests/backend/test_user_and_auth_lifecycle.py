import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_auth_login_wrong_password_denied():
    """Verify that wrong password attempts are strictly denied with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/auth/login", json={
            "email": "sarah.chen@nexus.ops",
            "password": "wrongpassword123!",
        })
        # Should strictly deny invalid password with 401 Unauthorized
        assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_login_valid_demo():
    """Verify that valid demo user login returns token and user payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/auth/login", json={
            "email": "sarah.chen@nexus.ops",
            "password": "Password123!",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "OPERATIONS_MANAGER"

from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_admin_governance_user_list():
    """Verify that admin user listing returns RBAC clearance profiles."""
    transport = ASGITransport(app=app)
    admin_token = create_access_token(
        subject="usr-admin-test",
        extra_claims={"email": "admin@nexus.continental", "name": "Sarah Chen", "role": "ADMINISTRATOR"}
    )
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        users = res.json()
        assert len(users) >= 4
        roles = [u["role"] for u in users]
        assert "ADMINISTRATOR" in roles
        assert "OPERATIONS_MANAGER" in roles
