"""
NEXUS In-Memory High-Throughput Entity Cache
Provides sub-5ms cached spatial and operational queries with background sync.
"""

import time
from typing import Any, Dict, Optional, Callable, Awaitable

class EntityCache:
    def __init__(self, default_ttl_seconds: float = 30.0):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            return None
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None
        return entry["data"]

    def set(self, key: str, data: Any, ttl_seconds: Optional[float] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl,
            "cached_at": time.time()
        }

    def invalidate(self, key_prefix: str = "") -> None:
        if not key_prefix:
            self._cache.clear()
        else:
            keys_to_delete = [k for k in self._cache if k.startswith(key_prefix)]
            for k in keys_to_delete:
                del self._cache[k]

    async def get_or_set(
        self,
        key: str,
        fetch_coro: Callable[[], Awaitable[Any]],
        ttl_seconds: Optional[float] = None
    ) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        data = await fetch_coro()
        if data is not None:
            self.set(key, data, ttl_seconds)
        return data

# Global entity cache instance
entity_cache = EntityCache(default_ttl_seconds=15.0)
