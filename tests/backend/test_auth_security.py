from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.core.permissions import has_permission, PermissionEnum, RoleEnum

def test_password_hashing_and_verification():
    raw = "MissionCriticalOps2026!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_roundtrip():
    user_id = "usr-sarah-104"
    token = create_access_token(subject=user_id)
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id

def test_rbac_permissions():
    assert has_permission(RoleEnum.ADMINISTRATOR, PermissionEnum.MANAGE_USERS) is True
    assert has_permission(RoleEnum.OPERATIONS_MANAGER, PermissionEnum.APPLY_DECISION) is True
    assert has_permission(RoleEnum.VIEWER, PermissionEnum.APPLY_DECISION) is False
