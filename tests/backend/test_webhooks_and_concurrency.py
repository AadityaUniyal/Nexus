import pytest
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP
from app.auth.webhook_verifier import verify_clerk_webhook
from app.core.errors import UnauthenticatedException, ForbiddenException

def test_principal_role_permissions():
    analyst = RequestPrincipal(
        nexus_user_id="usr-elena-03",
        clerk_user_id="clerk_usr_03",
        email="elena.rostova@nexus.continental",
        display_name="Elena Rostova",
        workspace_id="ws-continental-fleet-01",
        role=RoleEnum.ANALYST,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ANALYST]
    )

    # Analyst can view operations and analytics
    assert analyst.has_permission(PermissionEnum.VIEW_OPERATIONS) is True
    assert analyst.has_permission(PermissionEnum.VIEW_ANALYTICS) is True
    # Analyst cannot apply decisions or manage users
    assert analyst.has_permission(PermissionEnum.APPLY_DECISION) is False
    assert analyst.has_permission(PermissionEnum.MANAGE_USERS) is False

def test_admin_has_all_permissions():
    admin = RequestPrincipal(
        nexus_user_id="usr-sarah-104",
        clerk_user_id="clerk_sarah",
        email="sarah.chen@nexus.continental",
        display_name="Sarah Chen",
        workspace_id="ws-continental-fleet-01",
        role=RoleEnum.ADMINISTRATOR,
        permissions=ROLE_PERMISSIONS_MAP[RoleEnum.ADMINISTRATOR]
    )
    for perm in PermissionEnum:
        assert admin.has_permission(perm) is True

def test_clerk_webhook_verification_pass_in_dev():
    headers = {
        "svix-id": "msg_p5j2GejqFt2R4Ek",
        "svix-timestamp": "1614555122",
        "svix-signature": "v1,g0hM9LdwAuteFTcfAhio5GMTb4gQrwhDxAinPooljqQ="
    }
    payload = b'{"type":"user.created","data":{"id":"user_29w83sxmvgfqpv4nkf25k18"}}'
    assert verify_clerk_webhook(headers, payload) is True
