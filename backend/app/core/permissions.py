from enum import Enum
from typing import List, Set

class RoleEnum(str, Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    ANALYST = "ANALYST"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

class PermissionEnum(str, Enum):
    # Operations
    VIEW_OPERATIONS = "VIEW_OPERATIONS"
    MANAGE_OPERATIONS = "MANAGE_OPERATIONS"
    EDIT_ASSETS = "EDIT_ASSETS"
    
    # Incidents
    VIEW_INCIDENTS = "VIEW_INCIDENTS"
    CREATE_INCIDENT = "CREATE_INCIDENT"
    TRANSITION_INCIDENT = "TRANSITION_INCIDENT"
    RESOLVE_INCIDENT = "RESOLVE_INCIDENT"
    
    # Simulations & Decisions
    RUN_SIMULATION = "RUN_SIMULATION"
    APPLY_DECISION = "APPLY_DECISION"
    
    # Platform / Admin
    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_WORKSPACE = "MANAGE_WORKSPACE"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
    MANAGE_INTEGRATIONS = "MANAGE_INTEGRATIONS"

ROLE_PERMISSIONS_MAP: dict[RoleEnum, Set[PermissionEnum]] = {
    RoleEnum.ADMINISTRATOR: {p for p in PermissionEnum},
    RoleEnum.OPERATIONS_MANAGER: {
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.MANAGE_OPERATIONS,
        PermissionEnum.EDIT_ASSETS,
        PermissionEnum.VIEW_INCIDENTS,
        PermissionEnum.CREATE_INCIDENT,
        PermissionEnum.TRANSITION_INCIDENT,
        PermissionEnum.RESOLVE_INCIDENT,
        PermissionEnum.RUN_SIMULATION,
        PermissionEnum.APPLY_DECISION,
        PermissionEnum.VIEW_AUDIT_LOGS,
    },
    RoleEnum.ANALYST: {
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.VIEW_INCIDENTS,
        PermissionEnum.RUN_SIMULATION,
        PermissionEnum.VIEW_AUDIT_LOGS,
    },
    RoleEnum.OPERATOR: {
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.VIEW_INCIDENTS,
        PermissionEnum.CREATE_INCIDENT,
        PermissionEnum.TRANSITION_INCIDENT,
        PermissionEnum.RUN_SIMULATION,
    },
    RoleEnum.VIEWER: {
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.VIEW_INCIDENTS,
    },
}

def has_permission(user_role: str, permission: PermissionEnum) -> bool:
    """Check if given role possesses specified permission."""
    try:
        role = RoleEnum(user_role)
        return permission in ROLE_PERMISSIONS_MAP.get(role, set())
    except ValueError:
        return False
