from typing import Optional, List
from pydantic import BaseModel
from app.auth.principal import RoleEnum

class OnboardingStateRead(BaseModel):
    status: str
    completed: bool
    currentStep: int
    totalSteps: int = 5
    workspaceId: Optional[str] = None
    rolePreference: Optional[str] = None

class WorkspaceCreateRequest(BaseModel):
    name: str
    type: str = "ENTERPRISE_LOGISTICS"
    region: str = "US_CENTRAL"
    timezone: str = "America/Chicago"
    scale: str = "NATIONAL_NETWORK"
    isDemo: bool = False

class EnvironmentSetupRequest(BaseModel):
    telemetryRateHz: int = 1
    simulationSandbox: bool = True
    cloudSyncMode: str = "HYBRID_LOCAL_MIRRORED"

class RolePreferenceRequest(BaseModel):
    preferredRole: RoleEnum = RoleEnum.OPERATIONS_MANAGER
    department: str = "Global Logistics"

class NotificationsSetupRequest(BaseModel):
    criticalPush: bool = True
    simulationAlerts: bool = True
    digestEmail: bool = True

class OnboardingCompleteResponse(BaseModel):
    success: bool
    workspaceId: str
    destination: str = "/app/overview"
    message: str
