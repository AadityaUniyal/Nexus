from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class RoleEnum(str, Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    ANALYST = "ANALYST"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

class PermissionEnum(str, Enum):
    VIEW_OPERATIONS = "VIEW_OPERATIONS"
    EDIT_OPERATIONS = "EDIT_OPERATIONS"
    EDIT_ASSIGNED_OPERATIONS = "EDIT_ASSIGNED_OPERATIONS"
    ACKNOWLEDGE_INCIDENT = "ACKNOWLEDGE_INCIDENT"
    RUN_SIMULATION = "RUN_SIMULATION"
    APPLY_DECISION = "APPLY_DECISION"
    VIEW_ANALYTICS = "VIEW_ANALYTICS"
    VIEW_INTELLIGENCE = "VIEW_INTELLIGENCE"
    VIEW_REPORTS = "VIEW_REPORTS"
    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_ROLES = "MANAGE_ROLES"
    MANAGE_ASSETS = "MANAGE_ASSETS"
    VIEW_AUDIT = "VIEW_AUDIT"
    MANAGE_INTEGRATIONS = "MANAGE_INTEGRATIONS"
    MANAGE_SYSTEM = "MANAGE_SYSTEM"

ROLE_PERMISSIONS_MAP = {
    RoleEnum.ADMINISTRATOR: [
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.EDIT_OPERATIONS,
        PermissionEnum.EDIT_ASSIGNED_OPERATIONS,
        PermissionEnum.ACKNOWLEDGE_INCIDENT,
        PermissionEnum.RUN_SIMULATION,
        PermissionEnum.APPLY_DECISION,
        PermissionEnum.VIEW_ANALYTICS,
        PermissionEnum.VIEW_INTELLIGENCE,
        PermissionEnum.VIEW_REPORTS,
        PermissionEnum.MANAGE_USERS,
        PermissionEnum.MANAGE_ROLES,
        PermissionEnum.MANAGE_ASSETS,
        PermissionEnum.VIEW_AUDIT,
        PermissionEnum.MANAGE_INTEGRATIONS,
        PermissionEnum.MANAGE_SYSTEM,
    ],
    RoleEnum.OPERATIONS_MANAGER: [
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.EDIT_OPERATIONS,
        PermissionEnum.EDIT_ASSIGNED_OPERATIONS,
        PermissionEnum.ACKNOWLEDGE_INCIDENT,
        PermissionEnum.RUN_SIMULATION,
        PermissionEnum.APPLY_DECISION,
        PermissionEnum.VIEW_ANALYTICS,
        PermissionEnum.VIEW_INTELLIGENCE,
        PermissionEnum.VIEW_REPORTS,
        PermissionEnum.VIEW_AUDIT,
    ],
    RoleEnum.ANALYST: [
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.VIEW_ANALYTICS,
        PermissionEnum.VIEW_INTELLIGENCE,
        PermissionEnum.VIEW_REPORTS,
        PermissionEnum.RUN_SIMULATION,
    ],
    RoleEnum.OPERATOR: [
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.EDIT_ASSIGNED_OPERATIONS,
        PermissionEnum.ACKNOWLEDGE_INCIDENT,
    ],
    RoleEnum.VIEWER: [
        PermissionEnum.VIEW_OPERATIONS,
        PermissionEnum.VIEW_ANALYTICS,
        PermissionEnum.VIEW_REPORTS,
    ],
}

@dataclass
class RequestPrincipal:
    nexus_user_id: str
    clerk_user_id: str
    email: str
    display_name: str
    workspace_id: Optional[str] = None
    role: RoleEnum = RoleEnum.OPERATIONS_MANAGER
    permissions: List[PermissionEnum] = field(default_factory=list)
    onboarding_completed: bool = True
    is_active: bool = True

    def has_permission(self, permission: PermissionEnum) -> bool:
        if self.role == RoleEnum.ADMINISTRATOR:
            return True
        return permission in self.permissions
