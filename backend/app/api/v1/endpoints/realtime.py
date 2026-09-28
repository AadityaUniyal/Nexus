from typing import Optional
from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from app.realtime.sse import broadcaster
from app.auth.dependencies import get_optional_principal
from app.auth.principal import RequestPrincipal

router = APIRouter(prefix="/realtime", tags=["Realtime SSE"])

@router.get("/stream")
async def sse_event_stream(
    workspace_id: Optional[str] = Query(default=None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal)
):
    """Real-time Server-Sent Events (SSE) stream for live vehicle telemetry and incident notifications."""
    ws = principal.workspace_id if (principal and principal.workspace_id) else (workspace_id or "ws-continental-fleet-01")
    return StreamingResponse(
        broadcaster.subscribe(workspace_id=ws),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
