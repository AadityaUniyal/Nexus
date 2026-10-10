import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.realtime.sse import sse_manager

router = APIRouter(tags=["Realtime SSE Stream"])


@router.get("/stream")
async def stream_workspace_events(
    principal: RequestPrincipal = Depends(get_current_principal),
    last_event_id: Optional[str] = Header(None, alias="Last-Event-ID"),
):
    """
    Server-Sent Events endpoint strictly scoped to the authenticated caller's workspace.
    Supports Last-Event-ID replay and disconnect cleanup (AC-55, AC-56).
    """
    queue = await sse_manager.subscribe(
        workspace_id=principal.workspace_id,
        last_event_id=last_event_id
    )

    async def event_generator():
        try:
            # Initial ping/connection handshake
            yield f"event: connected\ndata: {{\"workspace_id\":\"{principal.workspace_id}\"}}\n\n"

            while True:
                try:
                    # Wait for message with 15s keep-alive timeout
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield msg.to_sse_format()
                except asyncio.TimeoutError:
                    # Send keep-alive comment
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await sse_manager.unsubscribe(principal.workspace_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
