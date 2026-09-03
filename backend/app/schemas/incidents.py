from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class IncidentTimelineRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    status: str
    note: str
    actor_name: str = Field(..., alias="actorName")
    created_at: str = Field(..., alias="createdAt")

class IncidentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str
    summary: str
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    affected_entity_type: str = Field(..., alias="affectedEntityType")
    affected_entity_id: str = Field(..., alias="affectedEntityId")
    affected_entity_name: str = Field(..., alias="affectedEntityName")
    delay_minutes: int = Field(0, alias="delayMinutes")
    cost_estimate: float = Field(0.0, alias="costEstimate")
    root_cause: Optional[str] = Field(None, alias="rootCause")
    ai_analysis: Optional[str] = Field(None, alias="aiAnalysis")

class IncidentCreate(IncidentBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    workspace_id: Optional[str] = Field(None, alias="workspaceId")

class IncidentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: Optional[str] = None
    summary: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    affected_entity_type: Optional[str] = Field(None, alias="affectedEntityType")
    affected_entity_id: Optional[str] = Field(None, alias="affectedEntityId")
    affected_entity_name: Optional[str] = Field(None, alias="affectedEntityName")
    delay_minutes: Optional[int] = Field(None, alias="delayMinutes")
    cost_estimate: Optional[float] = Field(None, alias="costEstimate")
    root_cause: Optional[str] = Field(None, alias="rootCause")
    ai_analysis: Optional[str] = Field(None, alias="aiAnalysis")
    note: Optional[str] = None
    actor_name: Optional[str] = Field(None, alias="actorName")

class IncidentTransitionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    status: str
    note: str = "State transitioned"
    actor_name: str = Field("Sarah Chen", alias="actorName")

class IncidentRead(IncidentBase):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    code: str
    status: str
    workspace_id: str = Field(..., alias="workspaceId")
    timeline: List[IncidentTimelineRead] = []
    created_at: str = Field(..., alias="createdAt")
