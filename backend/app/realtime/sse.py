import asyncio
import json
from typing import AsyncGenerator, Set
from datetime import datetime, timezone

class EventBroadcaster:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """Subscribe to real-time server-sent events stream."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(queue)
        try:
            # Yield initial connection heartbeat
            initial_payload = {
                "type": "CONNECTION_ESTABLISHED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "STREAM_ACTIVE"
            }
            yield f"data: {json.dumps(initial_payload)}\n\n"

            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            self._subscribers.remove(queue)

    async def broadcast(self, event_type: str, payload: dict) -> None:
        """Broadcast an operational event to all active SSE subscribers."""
        message = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        }
        for queue in list(self._subscribers):
            try:
                await queue.put(message)
            except Exception:
                pass

    async def broadcast_event(self, event_type: str, data: dict) -> None:
        """Alias for broadcast method accepting 'data' parameter for event_service compatibility."""
        await self.broadcast(event_type=event_type, payload=data)

broadcaster = EventBroadcaster()
