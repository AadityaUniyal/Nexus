"""
Canonical Role and Permission Definitions for NEXUS Platform.
Single Source of Truth aliasing auth.principal definitions.
"""
from app.auth.principal import (
    RoleEnum,
    PermissionEnum,
    ROLE_PERMISSIONS_MAP,
    RequestPrincipal,
)

def has_permission(user_role: str, permission: PermissionEnum) -> bool:
    """Check if given role possesses specified permission."""
    try:
        role = RoleEnum(user_role)
        if role == RoleEnum.ADMINISTRATOR:
            return True
        allowed_permissions = ROLE_PERMISSIONS_MAP.get(role, [])
        return permission in allowed_permissions
    except (ValueError, KeyError):
        return False

__all__ = [
    "RoleEnum",
    "PermissionEnum",
    "ROLE_PERMISSIONS_MAP",
    "RequestPrincipal",
    "has_permission",
]
