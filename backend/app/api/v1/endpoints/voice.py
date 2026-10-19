from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.voice.schemas import VoiceCommandRequest, VoiceCommandResponse
from app.voice.service import voice_agent_service
from app.auth.dependencies import require_onboarded, require_permission
from app.auth.principal import PermissionEnum, RequestPrincipal

router = APIRouter(prefix="/voice", tags=["Voice Agent Copilot"])

@router.get("/status")
async def get_voice_status(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
):
    """Check voice agent subsystem and model readiness."""
    return {
        "status": "AVAILABLE" if voice_agent_service.client or voice_agent_service.gemini_api_key else "NOT_CONFIGURED",
        "engine": "Conversation only; operational actions are disabled",
        "model": voice_agent_service.groq_model if voice_agent_service.client else voice_agent_service.gemini_model if voice_agent_service.gemini_api_key else None,
        "stt": "Groq Whisper / Web Speech API",
        "tts": "Web Audio Synthetic / Pluggable Cartesia",
    }

@router.post("/command", response_model=VoiceCommandResponse)
async def process_voice_command(req: VoiceCommandRequest, principal: RequestPrincipal = Depends(require_onboarded)):
    """Process an authenticated operator query without executing operational actions."""
    return await voice_agent_service.process_spoken_command(req)

@router.websocket("/ws")
async def voice_websocket(websocket: WebSocket):
    """The legacy socket has no workspace authentication handshake and is disabled."""
    await websocket.close(code=4401, reason="Use the authenticated voice command endpoint")
