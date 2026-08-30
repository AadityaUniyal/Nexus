from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class NotificationRead(BaseModel):
    id: str
    workspace_id: str
    type: str
    title: str
    message: str
    deep_link: Optional[str] = None
    read: bool
    created_at: str

    model_config = {"from_attributes": True}

class AuditLogRead(BaseModel):
    id: str
    workspace_id: str
    actor_id: str
    actor_name: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    metadata_json: Dict[str, Any]
    created_at: str

    model_config = {"from_attributes": True}

class PipelineHealthRead(BaseModel):
    id: str
    source_name: str
    source_type: str
    status: str
    latency_ms: int
    throughput_per_sec: int
    records_today: int

    model_config = {"from_attributes": True}

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: str
    ai_inference: str
    azure_iot: str
    fabric_lake: str
    timestamp: str

class AiBriefingResponse(BaseModel):
    briefing: str
    model: str
    generated_at: str
