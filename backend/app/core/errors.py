import uuid
from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class NexusException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "NEXUS_ERROR",
        message: str = "An operational error occurred.",
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.request_id = request_id or str(uuid.uuid4())
        super().__init__(
            status_code=status_code,
            detail={
                "code": self.code,
                "message": self.message,
                "details": self.details,
                "requestId": self.request_id,
            },
        )

class EntityNotFoundException(NexusException):
    def __init__(self, entity_name: str, entity_id: str, request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=f"{entity_name.upper()}_NOT_FOUND",
            message=f"{entity_name} with id '{entity_id}' could not be found.",
            details={"entityName": entity_name, "entityId": entity_id},
            request_id=request_id,
        )

class UnauthorizedException(NexusException):
    def __init__(self, message: str = "Authentication required or credentials invalid.", request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHENTICATED",
            message=message,
            request_id=request_id,
        )

UnauthenticatedException = UnauthorizedException

class ForbiddenException(NexusException):
    def __init__(self, message: str = "Insufficient role permissions for this operation.", request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
            request_id=request_id,
        )

class VersionConflictException(NexusException):
    def __init__(self, current_version: int, expected_version: int, request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="VERSION_CONFLICT",
            message=f"Version conflict: current version {current_version} differs from expected {expected_version}.",
            details={"currentVersion": current_version, "expectedVersion": expected_version},
            request_id=request_id,
        )

class SimulationStaleException(NexusException):
    def __init__(self, message: str = "The live operation changed after this simulation was created.", request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="SIMULATION_STALE",
            message=message,
            request_id=request_id,
        )

class InvalidStateTransitionException(NexusException):
    def __init__(self, from_state: str, to_state: str, allowed_states: list, request_id: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="INVALID_STATE_TRANSITION",
            message=f"Cannot transition from '{from_state}' to '{to_state}'. Allowed transitions: {allowed_states}",
            details={"fromState": from_state, "toState": to_state, "allowedStates": allowed_states},
            request_id=request_id,
        )

class SimulationExecutionException(NexusException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, request_id: Optional[str] = None):
        super().__init__(
            status_code=422,
            code="SIMULATION_EXECUTION_FAILED",
            message=message,
            details=details,
            request_id=request_id,
        )
