from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class UserProfileRead(BaseModel):
    id: str
    clerkUserId: str
    email: str
    name: str
    role: str
    department: Optional[str] = None
    isActive: bool = True

class WorkspaceRead(BaseModel):
    id: str
    name: str
    slug: str
    type: str
    region: str
    scale: str
    isDemo: bool

class OnboardingProgress(BaseModel):
    completed: bool
    status: str
    nextStep: Optional[str] = None

class AvatarPreferencesDTO(BaseModel):
    enabled: bool = True
    reducedMotion: bool = False
    companionHintsEnabled: bool = True
    soundEnabled: bool = False
    avatarVariant: str = "TACTILE_SPATIAL_MINIMAL"

class BootstrapResponse(BaseModel):
    user: UserProfileRead
    workspace: Optional[WorkspaceRead] = None
    role: str
    permissions: List[str]
    onboarding: OnboardingProgress
    unreadNotifications: int
    dataFreshness: str = "FRESH"
    destination: str = "/app/overview"
    avatar: AvatarPreferencesDTO
