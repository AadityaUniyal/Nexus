import asyncio
import json
import logging
from typing import Dict, Set, Optional, List
from collections import deque
from datetime import datetime, timezone

logger = logging.getLogger("nexus.sse")

MAX_QUEUE_SIZE = 100
MAX_HISTORY_PER_WORKSPACE = 50


class SSEMessage:
    def __init__(self, event_id: str, event_type: str, data: dict):
        self.id = event_id
        self.event = event_type
        self.data = data
        self.created_at = datetime.now(timezone.utc)

    def to_sse_format(self) -> str:
        data_json = json.dumps(self.data, separators=(",", ":"))
        return f"id: {self.id}\nevent: {self.event}\ndata: {data_json}\n\n"


class SSEManager:
    """
    Manages Server-Sent Events subscribers strictly scoped by workspace_id.
    Guarantees cross-tenant isolation and bounded memory queues.
    """

    def __init__(self):
        # workspace_id -> set of asyncio.Queue
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # workspace_id -> deque of recent SSEMessages for Last-Event-ID replay
        self._history: Dict[str, deque[SSEMessage]] = {}
        self._counter = 0
        self._lock = asyncio.Lock()

    async def subscribe(
        self,
        workspace_id: str,
        last_event_id: Optional[str] = None
    ) -> asyncio.Queue:
        if not workspace_id or not workspace_id.strip():
            raise ValueError("workspace_id is mandatory for SSE subscription")

        queue: asyncio.Queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)

        async with self._lock:
            if workspace_id not in self._subscribers:
                self._subscribers[workspace_id] = set()
                self._history[workspace_id] = deque(maxlen=MAX_HISTORY_PER_WORKSPACE)
            self._subscribers[workspace_id].add(queue)

        # Handle Last-Event-ID replay if provided
        if last_event_id and workspace_id in self._history:
            history = list(self._history[workspace_id])
            found_idx = -1
            for idx, msg in enumerate(history):
                if msg.id == last_event_id:
                    found_idx = idx
                    break

            if found_idx != -1:
                # Replay events since last_event_id
                for msg in history[found_idx + 1:]:
                    try:
                        queue.put_nowait(msg)
                    except asyncio.QueueFull:
                        break
            else:
                # Gap too large or unknown event id -> send resync instruction
                resync_msg = SSEMessage(
                    event_id=f"resync-{int(datetime.now(timezone.utc).timestamp())}",
                    event_type="resync",
                    data={"reason": "EVENT_GAP_TOO_LARGE"}
                )
                try:
                    queue.put_nowait(resync_msg)
                except asyncio.QueueFull:
                    pass

        return queue

    async def unsubscribe(self, workspace_id: str, queue: asyncio.Queue) -> None:
        async with self._lock:
            if workspace_id in self._subscribers:
                self._subscribers[workspace_id].discard(queue)
                if not self._subscribers[workspace_id]:
                    del self._subscribers[workspace_id]

    async def broadcast(self, workspace_id: str, event_type: str, data: dict) -> None:
        """
        Broadcasts an event strictly to subscribers of the specified workspace.
        """
        if not workspace_id or not workspace_id.strip():
            raise ValueError("workspace_id is mandatory for event broadcast; broadcast without workspace is forbidden")

        async with self._lock:
            self._counter += 1
            event_id = f"{workspace_id}-{int(datetime.now(timezone.utc).timestamp())}-{self._counter}"
            message = SSEMessage(event_id, event_type, data)

            if workspace_id not in self._history:
                self._history[workspace_id] = deque(maxlen=MAX_HISTORY_PER_WORKSPACE)
            self._history[workspace_id].append(message)

            targets = list(self._subscribers.get(workspace_id, []))

        for q in targets:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                # Queue full: client is too slow or hung; drop oldest or skip
                logger.warning("SSE queue full for subscriber in workspace %s", workspace_id)
                try:
                    _ = q.get_nowait()
                    q.put_nowait(message)
                except (asyncio.QueueEmpty, asyncio.QueueFull):
                    pass


sse_manager = SSEManager()
