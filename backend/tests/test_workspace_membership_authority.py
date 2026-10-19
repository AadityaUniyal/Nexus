from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth import dependencies
from app.auth.principal import PermissionEnum, RoleEnum, RequestPrincipal, ROLE_PERMISSIONS_MAP
from app.auth.dependencies import require_permission
from app.api.v1.endpoints.admin import list_admin_users, update_user_role
from app.api.v1.endpoints.organizations import MemberInvite, invite_member
from app.models.organization import OrganizationMembership
from app.models.user import User, WorkspaceMembership
from app.core.errors import ForbiddenException
from app.schemas.user import UserRoleUpdate
from app.main import app
from app.db.session import get_db
from httpx import AsyncClient


class ExecuteResult:
    def __init__(self, *, user=None, scalar=None, row=None, rows=None):
        self.user = user
        self.scalar = scalar
        self.row = row
        self.rows = rows or []

    def scalars(self):
        result = MagicMock()
        result.first.return_value = self.user
        return result

    def scalar_one_or_none(self):
        return self.scalar

    def first(self):
        return self.row

    def all(self):
        return self.rows


@pytest.mark.asyncio
async def test_workspace_switch_uses_membership_role_and_workspace_organization(monkeypatch):
    user = SimpleNamespace(
        id="usr-1", email="admin@example.test", name="Admin",
        role="ADMINISTRATOR", workspace_id="ws-home", organization_id="org-home",
        is_active=True,
    )
    membership = SimpleNamespace(role="DISPATCHER")
    workspace = SimpleNamespace(id="ws-other", organization_id="org-other", is_active=True)
    db = AsyncMock()
    executed_statements = []

    async def execute(statement):
        executed_statements.append(statement)
        results = [ExecuteResult(user=user), ExecuteResult(scalar=membership), ExecuteResult(scalar=workspace)]
        return results[len(executed_statements) - 1]

    db.execute.side_effect = execute

    async def verify_token(_token):
        return {"sub": "clerk-1", "email": "different@example.test", "name": "Untrusted Claim"}

    monkeypatch.setattr(dependencies, "verify_clerk_token", verify_token)
    principal = await dependencies.get_current_principal(
        authorization="Bearer token",
        session_cookie=None,
        x_workspace_id="ws-other",
        db=db,
    )

    assert principal.workspace_id == "ws-other"
    assert principal.organization_id == "org-other"
    assert principal.role is RoleEnum.DISPATCHER
    assert principal.email == user.email
    assert principal.display_name == user.name
    assert principal.has_permission(PermissionEnum.EDIT_OPERATIONS)
    assert not principal.has_permission(PermissionEnum.MANAGE_USERS)
    assert "users.email" not in str(executed_statements[0]).split("WHERE", 1)[1]


@pytest.mark.asyncio
async def test_workspace_switch_without_membership_is_forbidden(monkeypatch):
    user = SimpleNamespace(
        id="usr-1", email="admin@example.test", name="Admin",
        role="ADMINISTRATOR", workspace_id="ws-home", organization_id="org-home",
        is_active=True,
    )
    db = AsyncMock()
    db.execute.side_effect = [ExecuteResult(user=user), ExecuteResult(scalar=None)]

    async def verify_token(_token):
        return {"sub": "clerk-1", "email": user.email}

    monkeypatch.setattr(dependencies, "verify_clerk_token", verify_token)

    with pytest.raises(ForbiddenException, match="not a member"):
        await dependencies.get_current_principal(
            authorization="Bearer token",
            session_cookie=None,
            x_workspace_id="ws-foreign",
            db=db,
        )


@pytest.mark.asyncio
async def test_admin_user_list_and_role_update_use_workspace_membership():
    principal = RequestPrincipal(
        nexus_user_id="usr-admin", clerk_user_id="clerk-admin",
        email="admin@example.test", display_name="Admin",
        workspace_id="ws-selected", role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
    )
    member = SimpleNamespace(
        id="usr-member", email="member@example.com", name="Member",
        role="ADMINISTRATOR", department=None, is_active=True,
        workspace_id="ws-home", created_at="2026-01-01T00:00:00Z",
    )
    membership = SimpleNamespace(role="DISPATCHER")
    db = AsyncMock()
    statements = []

    async def execute(statement):
        statements.append(str(statement))
        if len(statements) == 1:
            return ExecuteResult(rows=[(member, "DISPATCHER")])
        return ExecuteResult(row=(member, membership))

    db.execute.side_effect = execute
    users = await list_admin_users(skip=0, limit=50, workspace_id="ws-ignored", db=db, principal=principal)
    updated = await update_user_role(
        user_id=member.id,
        req=UserRoleUpdate(role="VIEWER"),
        db=db,
        principal=principal,
    )

    assert users[0].role == "DISPATCHER"
    assert users[0].workspace_id == "ws-selected"
    assert "workspace_memberships.workspace_id" in statements[0]
    assert "workspace_memberships.workspace_id" in statements[1]
    assert membership.role == "VIEWER"
    assert member.role == "ADMINISTRATOR"  # another workspace's default role is unchanged
    assert updated.role == "VIEWER"
    assert updated.workspace_id == "ws-selected"


def test_csv_import_permission_matches_dispatcher_first_workflow():
    authorize_import = require_permission(PermissionEnum.IMPORT_DATA)
    dispatcher = RequestPrincipal(
        nexus_user_id="usr-dispatcher", clerk_user_id="clerk-dispatcher",
        email="dispatcher@example.com", display_name="Dispatcher",
        workspace_id="ws-a", role=RoleEnum.DISPATCHER,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.DISPATCHER],
    )
    viewer = RequestPrincipal(
        nexus_user_id="usr-viewer", clerk_user_id="clerk-viewer",
        email="viewer@example.com", display_name="Viewer",
        workspace_id="ws-a", role=RoleEnum.VIEWER,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.VIEWER],
    )

    assert authorize_import(principal=dispatcher) is dispatcher
    with pytest.raises(ForbiddenException):
        authorize_import(principal=viewer)


@pytest.mark.asyncio
@pytest.mark.parametrize("path", [
    "/api/v1/events/platform",
    "/api/v1/ai/status",
    "/api/v1/ml/status",
    "/api/v1/voice/status",
])
async def test_provider_status_is_hidden_from_workspace_viewer(path: str, async_client: AsyncClient):
    viewer = RequestPrincipal(
        nexus_user_id="usr-viewer", clerk_user_id="clerk-viewer",
        email="viewer@example.com", display_name="Viewer",
        workspace_id="ws-a", role=RoleEnum.VIEWER,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.VIEWER],
    )
    from app.auth.dependencies import require_onboarded
    app.dependency_overrides[require_onboarded] = lambda: viewer

    response = await async_client.get(path)

    assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize("path", [
    "/api/v1/events/platform",
    "/api/v1/ai/status",
    "/api/v1/ml/status",
    "/api/v1/voice/status",
])
async def test_workspace_admin_can_read_provider_status(path: str, async_client: AsyncClient):
    from app.auth.dependencies import require_onboarded
    admin = RequestPrincipal(
        nexus_user_id="usr-admin", clerk_user_id="clerk-admin",
        email="admin@example.com", display_name="Admin",
        workspace_id="ws-a", role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
    )
    app.dependency_overrides[require_onboarded] = lambda: admin

    response = await async_client.get(path)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_unconfigured_support_ticket_routes_return_unavailable(async_client: AsyncClient):
    listed = await async_client.get("/api/v1/support/tickets")
    submitted = await async_client.post("/api/v1/support/tickets", json={
        "subject": "Help needed",
        "description": "A real request",
    })

    assert listed.status_code == 503
    assert submitted.status_code == 503
    assert "not available" in listed.json()["detail"].lower()


@pytest.mark.asyncio
async def test_workspace_location_read_rejects_another_workspace(async_client: AsyncClient):
    response = await async_client.get("/api/v1/location/workspaces/ws-foreign/locations")

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_workspace_location_write_requires_asset_permission(async_client: AsyncClient):
    viewer = RequestPrincipal(
        nexus_user_id="usr-viewer", clerk_user_id="clerk-viewer",
        email="viewer@example.com", display_name="Viewer", workspace_id="ws-continental-fleet-01",
        role=RoleEnum.VIEWER, permissions=ROLE_PERMISSIONS_MAP[RoleEnum.VIEWER],
    )
    from app.auth.dependencies import require_onboarded
    app.dependency_overrides[require_onboarded] = lambda: viewer

    response = await async_client.post(
        "/api/v1/location/workspaces/ws-continental-fleet-01/locations",
        json={"location": {}, "label": "Area"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invitation_cannot_target_a_different_workspace_in_same_organization():
    principal = RequestPrincipal(
        nexus_user_id="usr-admin", clerk_user_id="clerk-admin",
        email="admin@example.com", display_name="Admin",
        organization_id="org-a", workspace_id="ws-selected",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
    )
    db = AsyncMock()

    with pytest.raises(ForbiddenException, match="currently selected workspace"):
        await invite_member(
            MemberInvite(email="operator@example.com", role="OPERATOR", workspace_id="ws-same-org-other"),
            principal=principal,
            db=db,
        )

    db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_legacy_pdf_briefing_requires_report_access_and_stays_unavailable(async_client: AsyncClient):
    viewer = RequestPrincipal(
        nexus_user_id="usr-viewer", clerk_user_id="clerk-viewer",
        email="viewer@example.com", display_name="Viewer", workspace_id="ws-a",
        role=RoleEnum.OPERATOR, permissions=ROLE_PERMISSIONS_MAP[RoleEnum.OPERATOR],
    )
    from app.auth.dependencies import require_onboarded
    app.dependency_overrides[require_onboarded] = lambda: viewer
    denied = await async_client.get("/api/v1/reports/download-pdf")
    assert denied.status_code == 403

    admin = RequestPrincipal(
        nexus_user_id="usr-admin", clerk_user_id="clerk-admin",
        email="admin@example.com", display_name="Admin", workspace_id="ws-a",
        role=RoleEnum.ADMINISTRATOR, permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR],
    )
    app.dependency_overrides[require_onboarded] = lambda: admin
    unavailable = await async_client.get("/api/v1/reports/download-pdf")
    assert unavailable.status_code == 503
    assert "workspace-backed" in unavailable.json()["detail"]


@pytest.mark.asyncio
async def test_clerk_webhook_idempotency_uses_delivery_header(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/clerk",
        headers={"svix-id": "evt-delivery-123"},
        json={"type": "session.created", "data": {"id": "user-123"}},
    )

    assert response.status_code == 200
    assert response.json()["eventId"] == "evt-delivery-123"


@pytest.mark.asyncio
async def test_clerk_provisioning_creates_workspace_and_organization_memberships(async_client: AsyncClient):
    workspace = SimpleNamespace(id="ws-new", organization_id="org-new")
    duplicate_check = SimpleNamespace(scalars=lambda: SimpleNamespace(first=lambda: None))
    workspace_lookup = SimpleNamespace(scalar_one_or_none=lambda: workspace)
    db = AsyncMock()
    db.execute.side_effect = [duplicate_check, workspace_lookup]
    db.add = MagicMock()
    app.dependency_overrides[get_db] = lambda: db

    response = await async_client.post(
        "/api/v1/clerk",
        headers={"svix-id": "evt-user-created-1"},
        json={
            "type": "user.created",
            "data": {
                "id": "clerk-user-123456",
                "email_addresses": [{"email_address": "new@example.com"}],
                "public_metadata": {"workspace_id": "ws-new"},
            },
        },
    )

    assert response.status_code == 200
    created = [call.args[0] for call in db.add.call_args_list]
    user = next(record for record in created if isinstance(record, User))
    workspace_membership = next(record for record in created if isinstance(record, WorkspaceMembership))
    organization_membership = next(record for record in created if isinstance(record, OrganizationMembership))
    assert user.organization_id == "org-new"
    assert workspace_membership.user_id == user.id
    assert workspace_membership.workspace_id == "ws-new"
    assert workspace_membership.role == "OPERATOR"
    assert organization_membership.user_id == user.id
    assert organization_membership.organization_id == "org-new"


def test_webhook_verification_fails_closed_without_secret_outside_local(monkeypatch):
    from app.auth.webhook_verifier import verify_clerk_webhook
    from app.core.config import settings

    monkeypatch.setattr(settings, "CLERK_WEBHOOK_SECRET", "")
    monkeypatch.setattr(settings, "APP_ENV", "staging")

    with pytest.raises(Exception, match="must be configured"):
        verify_clerk_webhook({}, b"{}")
