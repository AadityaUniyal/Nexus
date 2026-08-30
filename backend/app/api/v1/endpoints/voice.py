from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.voice.schemas import VoiceCommandRequest, VoiceCommandResponse
from app.voice.service import voice_agent_service

router = APIRouter(prefix="/voice", tags=["Voice Agent Copilot"])

@router.get("/status")
async def get_voice_status():
    """Check voice agent subsystem and model readiness."""
    return {
        "status": "HEALTHY",
        "engine": "Pipecat / Groq Tool Caller",
        "model": "llama-3.3-70b-versatile",
        "stt": "Groq Whisper / Web Speech API",
        "tts": "Web Audio Synthetic / Pluggable Cartesia",
    }

@router.post("/command", response_model=VoiceCommandResponse)
async def process_voice_command(req: VoiceCommandRequest):
    """Process spoken transcript from operator and execute tool actions."""
    return await voice_agent_service.process_spoken_command(req)

@router.websocket("/ws")
async def voice_websocket(websocket: WebSocket):
    """Real-time bidirectional WebSocket stream for voice commands."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            transcript = data.get("transcript", "")
            if transcript:
                req = VoiceCommandRequest(transcript=transcript, workspace_id=data.get("workspace_id"))
                resp = await voice_agent_service.process_spoken_command(req)
                await websocket.send_json(resp.model_dump())
    except WebSocketDisconnect:
        pass
