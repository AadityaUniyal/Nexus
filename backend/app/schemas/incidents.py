from typing import List, Optional
from pydantic import BaseModel

class IncidentTimelineRead(BaseModel):
    id: str
    status: str
    note: str
    actor_name: str
    created_at: str

    model_config = {"from_attributes": True}

class IncidentBase(BaseModel):
    title: str
    summary: str
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    affected_entity_type: str
    affected_entity_id: str
    affected_entity_name: str
    delay_minutes: int = 0
    cost_estimate: float = 0.0
    root_cause: Optional[str] = None
    ai_analysis: Optional[str] = None

class IncidentCreate(IncidentBase):
    workspace_id: Optional[str] = None

class IncidentTransitionRequest(BaseModel):
    status: str
    note: str
    actor_name: str = "Sarah Chen"

class IncidentRead(IncidentBase):
    id: str
    code: str
    status: str
    workspace_id: str
    timeline: List[IncidentTimelineRead] = []
    created_at: str

    model_config = {"from_attributes": True}
