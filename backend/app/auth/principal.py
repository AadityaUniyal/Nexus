from dataclasses import dataclass
from typing import Optional
from enum import Enum


class RoleEnum(str, Enum):
    OWNER = "owner"
    DISPATCHER = "dispatcher"
    VIEWER = "viewer"


@dataclass
class RequestPrincipal:
    user_id: str
    email: str
    display_name: str
    workspace_id: str
    role: RoleEnum
    needs_onboarding: bool = False

    def is_owner(self) -> bool:
        return self.role == RoleEnum.OWNER

    def can_dispatch(self) -> bool:
        return self.role in (RoleEnum.OWNER, RoleEnum.DISPATCHER)

    def can_mutate(self) -> bool:
        return self.role in (RoleEnum.OWNER, RoleEnum.DISPATCHER)
