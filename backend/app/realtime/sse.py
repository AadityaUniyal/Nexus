import asyncio
import json
from typing import AsyncGenerator, Dict, Set, Optional
from datetime import datetime, timezone

class EventBroadcaster:
    def __init__(self):
        # Maps workspace_id -> set of queues (and None/all for global)
        self._subscribers: Dict[Optional[str], Set[asyncio.Queue]] = {}

    async def subscribe(self, workspace_id: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Subscribe to real-time server-sent events stream scoped to workspace."""
        queue: asyncio.Queue = asyncio.Queue()
        if workspace_id not in self._subscribers:
            self._subscribers[workspace_id] = set()
        self._subscribers[workspace_id].add(queue)

        try:
            # Yield initial connection heartbeat
            initial_payload = {
                "type": "CONNECTION_ESTABLISHED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "STREAM_ACTIVE",
                "workspace_id": workspace_id or "global"
            }
            yield f"data: {json.dumps(initial_payload)}\n\n"

            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if workspace_id in self._subscribers and queue in self._subscribers[workspace_id]:
                self._subscribers[workspace_id].remove(queue)
                if not self._subscribers[workspace_id]:
                    del self._subscribers[workspace_id]

    async def broadcast(self, event_type: str, payload: dict, workspace_id: Optional[str] = None) -> None:
        """Broadcast an operational event to active SSE subscribers scoped to workspace."""
        target_ws = workspace_id or payload.get("workspace_id") or payload.get("workspaceId")
        message = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        }

        # Send to workspace subscribers
        queues_to_notify: Set[asyncio.Queue] = set()
        if target_ws and target_ws in self._subscribers:
            queues_to_notify.update(self._subscribers[target_ws])
        
        # Also notify global (None) subscribers
        if None in self._subscribers:
            queues_to_notify.update(self._subscribers[None])

        # If no workspace specified, notify all subscribers
        if not target_ws:
            for s_set in self._subscribers.values():
                queues_to_notify.update(s_set)

        for queue in queues_to_notify:
            try:
                await queue.put(message)
            except Exception:
                pass

    async def broadcast_event(self, event_type: str, data: dict, workspace_id: Optional[str] = None) -> None:
        """Alias for broadcast method accepting 'data' parameter for event_service compatibility."""
        await self.broadcast(event_type=event_type, payload=data, workspace_id=workspace_id)

broadcaster = EventBroadcaster()
