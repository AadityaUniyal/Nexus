"""
NEXUS Enterprise Asynchronous Task Queue & Event Pipeline
Provides non-blocking background workers and high-throughput event processing.
"""

import asyncio
import time
import uuid
import logging
from typing import Any, Callable, Dict, Optional, Awaitable

logger = logging.getLogger("nexus.task_queue")

class AsyncTaskQueue:
    def __init__(self, max_concurrency: int = 10):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._max_concurrency = max_concurrency
        self._running_tasks: Dict[str, Dict[str, Any]] = {}
        self._workers: list[asyncio.Task] = []
        self._is_running = False

    async def start(self):
        if self._is_running:
            return
        self._is_running = True
        for i in range(self._max_concurrency):
            t = asyncio.create_task(self._worker_loop(f"worker-{i+1}"))
            self._workers.append(t)
        logger.info(f"AsyncTaskQueue started with {self._max_concurrency} concurrent workers")

    async def stop(self):
        self._is_running = False
        for w in self._workers:
            w.cancel()
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()

    async def enqueue(
        self,
        name: str,
        coro_func: Callable[..., Awaitable[Any]],
        *args,
        **kwargs
    ) -> str:
        task_id = f"tsk-{uuid.uuid4().hex[:10]}"
        self._running_tasks[task_id] = {
            "id": task_id,
            "name": name,
            "status": "PENDING",
            "enqueued_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error": None
        }

        # Auto-start worker loop if not already running
        if not self._is_running:
            await self.start()

        await self._queue.put((task_id, coro_func, args, kwargs))
        return task_id

    async def _worker_loop(self, worker_name: str):
        while self._is_running:
            try:
                task_id, coro_func, args, kwargs = await self._queue.get()
                task_record = self._running_tasks.get(task_id)
                if task_record:
                    task_record["status"] = "RUNNING"
                    task_record["started_at"] = time.time()
                    task_record["worker"] = worker_name

                try:
                    result = await coro_func(*args, **kwargs)
                    if task_record:
                        task_record["status"] = "COMPLETED"
                        task_record["completed_at"] = time.time()
                        task_record["result"] = result
                except Exception as e:
                    logger.error(f"AsyncTaskQueue error in task {task_id} ({name}): {e}", exc_info=True)
                    if task_record:
                        task_record["status"] = "FAILED"
                        task_record["completed_at"] = time.time()
                        task_record["error"] = str(e)
                finally:
                    self._queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Unexpected worker error: {e}")

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self._running_tasks.get(task_id)

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "queue_depth": self._queue.qsize(),
            "active_workers": len(self._workers),
            "total_tasks_tracked": len(self._running_tasks),
            "is_running": self._is_running
        }

# Global task queue singleton
task_queue = AsyncTaskQueue(max_concurrency=8)
