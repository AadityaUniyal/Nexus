import threading
import time
from typing import Dict

from fastapi import HTTPException, status

from app.core.config import settings

# Simple in‑memory counters for demonstration. In production you would pull real usage metrics
# from Azure Monitor, Application Insights, or the Azure SDKs.

class QuotaGuard:
    """Runtime guardrails to ensure Azure free‑tier limits are respected.

    The guard tracks a handful of key services used by Nexus and raises an HTTPException
    when a configured threshold is exceeded. All limits are defined in ``settings`` as
    ``*_FREE_TIER_LIMIT`` values (or fall back to sensible defaults).
    """

    _lock = threading.Lock()
    _counters: Dict[str, int] = {}

    def _increment(self, name: str, amount: int = 1) -> int:
        with self._lock:
            self._counters[name] = self._counters.get(name, 0) + amount
            return self._counters[name]

    def _get(self, name: str) -> int:
        return self._counters.get(name, 0)

    # ---------------------------------------------------------------------
    # Event Hub guard
    # ---------------------------------------------------------------------
    def check_event_hub(self, events: int = 1):
        limit = getattr(settings, "EVENT_HUB_FREE_TIER_LIMIT", 1_000_000)
        used = self._increment("event_hub", events)
        if used > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Event Hub free‑tier quota exceeded.\n" f"Used {used} / {limit} events.",
            )
        return used

    # ---------------------------------------------------------------------
    # Blob Storage guard (reads + writes)
    # ---------------------------------------------------------------------
    def check_blob_storage(self, bytes_written: int = 0, reads: int = 0):
        # Simple byte quota – defaults to 5 GB (5 * 1024 ** 3)
        byte_limit = getattr(settings, "BLOB_STORAGE_BYTE_LIMIT", 5 * 1024 ** 3)
        read_limit = getattr(settings, "BLOB_STORAGE_READ_LIMIT", 20_000)

        if bytes_written:
            used_bytes = self._increment("blob_bytes", bytes_written)
            if used_bytes > byte_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Blob storage byte quota exceeded.",
                )
        if reads:
            used_reads = self._increment("blob_reads", reads)
            if used_reads > read_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Blob storage read quota exceeded.",
                )
        return self._get("blob_bytes"), self._get("blob_reads")

    # ---------------------------------------------------------------------
    # Azure OpenAI token guard (fallback to Groq if exhausted)
    # ---------------------------------------------------------------------
    def check_ai_tokens(self, tokens: int = 1):
        # $18 credit ≈ 100k tokens – we guard at 80k to keep a safety margin.
        token_limit = getattr(settings, "OPENAI_TOKEN_FREE_TIER_LIMIT", 80_000)
        used = self._increment("ai_tokens", tokens)
        if used > token_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Azure OpenAI free‑tier token quota exceeded. Falling back to Groq.",
            )
        return used

    # ---------------------------------------------------------------------
    # Helper to expose current usage (useful for admin dashboard)
    # ---------------------------------------------------------------------
    def snapshot(self) -> Dict[str, int]:
        return dict(self._counters)

# Singleton instance used across the application
quota_guard = QuotaGuard()
