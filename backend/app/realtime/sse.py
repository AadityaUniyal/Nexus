import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Set, Optional
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger(__name__)

class EventBroadcaster:
    """
    High-Throughput Operational Event Broadcaster.
    Supports local asyncio in-memory queues and distributed Redis Pub/Sub cluster distribution.
    """
    def __init__(self):
        # Maps workspace_id -> set of queues (and None/all for global)
        self._subscribers: Dict[Optional[str], Set[asyncio.Queue]] = {}
        self._redis_client = None
        self._pubsub_task: Optional[asyncio.Task] = None
        self._redis_channel = "nexus:events:broadcast"
        self._initialized_redis = False

    async def _ensure_redis(self) -> None:
        if self._initialized_redis:
            return
        self._initialized_redis = True

        if not settings.REDIS_ENABLED or not settings.REDIS_URL:
            logger.info("SSE Broadcaster: Redis disabled or REDIS_URL not configured. Operating in high-performance in-memory mode.")
            return

        try:
            import redis.asyncio as aioredis
            self._redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=3.0,
                health_check_interval=30
            )
            # Test ping
            await self._redis_client.ping()
            pubsub = self._redis_client.pubsub()
            await pubsub.subscribe(self._redis_channel)
            self._pubsub_task = asyncio.create_task(self._listen_redis(pubsub))
            logger.info("SSE Broadcaster: Connected to Redis Pub/Sub cluster on channel '%s'", self._redis_channel)
        except Exception as exc:
            logger.warning("SSE Broadcaster: Redis connection failed (%s); operating in local in-memory fallback.", exc)
            self._redis_client = None

    async def _listen_redis(self, pubsub) -> None:
        try:
            async for message in pubsub.listen():
                if message and message.get("type") == "message":
                    raw_data = message.get("data")
                    if raw_data:
                        try:
                            payload_obj = json.loads(raw_data)
                            target_ws = payload_obj.get("workspace_id")
                            self._deliver_to_local(payload_obj, target_ws)
                        except Exception as e:
                            logger.error("SSE Broadcaster: Failed to parse cluster broadcast: %s", e)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.warning("SSE Broadcaster: Redis pubsub listener error: %s", exc)

    def _deliver_to_local(self, message: dict, target_ws: Optional[str]) -> None:
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
                if queue.full():
                    try:
                        queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                queue.put_nowait(message)
            except Exception:
                pass

    async def subscribe(self, workspace_id: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Subscribe to real-time server-sent events stream scoped to workspace."""
        await self._ensure_redis()

        queue: asyncio.Queue = asyncio.Queue(maxsize=256)
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
        """Broadcast an operational event to active SSE subscribers across local queues or Redis cluster."""
        await self._ensure_redis()

        target_ws = workspace_id or payload.get("workspace_id") or payload.get("workspaceId")
        message = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
            "workspace_id": target_ws,
        }

        # If Redis cluster is connected, publish to Redis channel
        if self._redis_client is not None:
            try:
                await self._redis_client.publish(self._redis_channel, json.dumps(message))
                return
            except Exception as exc:
                logger.warning("SSE Broadcaster: Redis publish failed (%s); failing over to local delivery.", exc)

        # Fallback to local in-memory delivery
        self._deliver_to_local(message, target_ws)

    async def broadcast_event(self, event_type: str, data: dict, workspace_id: Optional[str] = None) -> None:
        """Alias for broadcast method accepting 'data' parameter for event_service compatibility."""
        await self.broadcast(event_type=event_type, payload=data, workspace_id=workspace_id)

    async def close(self) -> None:
        """Gracefully terminate background listener and Redis connection."""
        if self._pubsub_task and not self._pubsub_task.done():
            self._pubsub_task.cancel()
        if self._redis_client is not None:
            try:
                await self._redis_client.close()
            except Exception:
                pass
            self._redis_client = None

broadcaster = EventBroadcaster()
