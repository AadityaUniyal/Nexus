from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/realtime", tags=["Realtime SSE"])

@router.get("/stream")
async def sse_event_stream():
    """Real-time Server-Sent Events (SSE) stream for live vehicle telemetry and incident notifications."""
    return StreamingResponse(
        broadcaster.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
