from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class VoiceCommandRequest(BaseModel):
    transcript: str = Field(..., description="Spoken transcript from operator")
    workspace_id: Optional[str] = Field(None, description="Active workspace identifier")
    session_id: Optional[str] = Field(None, description="Voice session ID")

class VoiceToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

class VoiceCommandResponse(BaseModel):
    speech_response: str = Field(..., description="Synthesized spoken tactical response")
    action_type: str = Field(..., description="Executed or suggested action type (e.g., MAP_FLY_TO, RUN_SIMULATION, FILTER_FLEET)")
    action_payload: Optional[Dict[str, Any]] = Field(None, description="Spatial coordinates, simulation params, or filter criteria")
    tool_calls: Optional[List[VoiceToolCall]] = Field(default_factory=list)
    confidence: float = Field(default=0.98)
