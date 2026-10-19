from typing import Optional
from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from app.realtime.sse import broadcaster
from app.auth.dependencies import require_workspace
from app.auth.principal import RequestPrincipal

router = APIRouter(prefix="/realtime", tags=["Realtime SSE"])

@router.get("/stream")
async def sse_event_stream(
    principal: RequestPrincipal = Depends(require_workspace),
):
    """Real-time Server-Sent Events (SSE) stream for live vehicle telemetry and incident notifications."""
    ws = principal.workspace_id
    return StreamingResponse(
        broadcaster.subscribe(workspace_id=ws),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
