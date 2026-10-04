"""
NEXUS Enterprise High-Throughput Multi-Tier Entity Cache
Provides sub-millisecond cached spatial, fleet, and historical queries with single-flight mutex deduplication.
"""

import time
import asyncio
import logging
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Callable, Awaitable, Set

logger = logging.getLogger("nexus.cache")

class EnterpriseCache:
    def __init__(self, default_ttl_seconds: float = 30.0, max_size: int = 5000):
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._tags: Dict[str, Set[str]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._default_ttl = default_ttl_seconds
        self._max_size = max_size
        self._global_lock = asyncio.Lock()
        
        # Performance & Observability Metrics
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            self.misses += 1
            return None
        
        # Check expiration
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            self.misses += 1
            return None
        
        # Move to end for true LRU behavior
        self._cache.move_to_end(key)
        self.hits += 1
        return entry["data"]

    def set(
        self,
        key: str,
        data: Any,
        ttl_seconds: Optional[float] = None,
        tags: Optional[List[str]] = None
    ) -> None:
        # Enforce bounded LRU capacity
        if len(self._cache) >= self._max_size and key not in self._cache:
            # Evict least recently used (first item)
            evicted_key, _ = self._cache.popitem(last=False)
            self.evictions += 1
            self._cleanup_tag_associations(evicted_key)

        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        now = time.time()
        
        self._cache[key] = {
            "data": data,
            "expires_at": now + ttl,
            "cached_at": now,
            "tags": tags or []
        }
        self._cache.move_to_end(key)

        # Index tags for bulk invalidation
        if tags:
            for tag in tags:
                if tag not in self._tags:
                    self._tags[tag] = set()
                self._tags[tag].add(key)

    def _cleanup_tag_associations(self, key: str) -> None:
        for tag, keys in list(self._tags.items()):
            keys.discard(key)
            if not keys:
                del self._tags[tag]

    def invalidate(self, key_prefix: str = "") -> int:
        if not key_prefix:
            count = len(self._cache)
            self._cache.clear()
            self._tags.clear()
            return count
        
        keys_to_delete = [k for k in self._cache if k.startswith(key_prefix)]
        for k in keys_to_delete:
            del self._cache[k]
            self._cleanup_tag_associations(k)
        return len(keys_to_delete)

    def invalidate_tag(self, tag: str) -> int:
        keys = self._tags.pop(tag, set())
        count = 0
        for k in keys:
            if k in self._cache:
                del self._cache[k]
                count += 1
        return count

    async def get_or_set(
        self,
        key: str,
        fetch_coro: Callable[[], Awaitable[Any]],
        ttl_seconds: Optional[float] = None,
        tags: Optional[List[str]] = None
    ) -> Any:
        """
        Single-Flight Mutex Cache Getter:
        Prevents thundering herd / dogpiling by acquiring a per-key lock during cold cache misses.
        """
        cached = self.get(key)
        if cached is not None:
            return cached

        # Acquire per-key lock to deduplicate concurrent backend fetches
        async with self._global_lock:
            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
            key_lock = self._locks[key]

        async with key_lock:
            # Double-check after lock acquisition
            cached = self.get(key)
            if cached is not None:
                return cached

            # Fetch fresh from source
            data = await fetch_coro()
            if data is not None:
                self.set(key, data, ttl_seconds=ttl_seconds, tags=tags)
            return data

    def get_metrics(self) -> Dict[str, Any]:
        total_requests = self.hits + self.misses
        hit_ratio = (self.hits / total_requests * 100.0) if total_requests > 0 else 0.0
        return {
            "cached_entries": len(self._cache),
            "max_size": self._max_size,
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "hit_ratio_pct": round(hit_ratio, 2),
            "active_tags_count": len(self._tags),
        }

# Global singleton entity cache
entity_cache = EnterpriseCache(default_ttl_seconds=30.0, max_size=5000)
