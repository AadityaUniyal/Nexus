from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class NotificationRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")
    type: str
    title: str
    message: str
    deep_link: Optional[str] = Field(None, alias="deepLink")
    read: bool
    created_at: str = Field(..., alias="createdAt")

class AuditLogRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    workspace_id: str = Field(..., alias="workspaceId")
    actor_id: str = Field(..., alias="actorId")
    actor_name: str = Field(..., alias="actorName")
    action: str
    entity_type: str = Field(..., alias="entityType")
    entity_id: str = Field(..., alias="entityId")
    details: str
    metadata_json: Dict[str, Any] = Field(default_factory=dict, alias="metadataJson")
    created_at: str = Field(..., alias="createdAt")

class PipelineHealthRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    source_name: str = Field(..., alias="sourceName")
    source_type: str = Field(..., alias="sourceType")
    status: str
    latency_ms: int = Field(..., alias="latencyMs")
    throughput_per_sec: int = Field(..., alias="throughputPerSec")
    records_today: int = Field(..., alias="recordsToday")

class HealthCheckResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    status: str
    version: str
    database: str
    database_connected: bool = Field(True, alias="databaseConnected")
    redis: Optional[str] = "NOT_CONFIGURED"
    ai_inference: Optional[str] = Field("ONLINE", alias="aiInference")
    azure_iot: Optional[str] = Field("OPTIONAL", alias="azureIot")
    fabric_lake: Optional[str] = Field("OPTIONAL", alias="fabricLake")
    timestamp: str

class AiBriefingResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    briefing: str
    model: str
    generated_at: str = Field(..., alias="generatedAt")
