import time
from collections import OrderedDict
from typing import Tuple
from fastapi import HTTPException, status


class BoundedSlidingWindowLimiter:
    """
    In-memory bounded sliding window rate limiter.
    Keys on verified session ID or principal ID, bounded capacity with LRU eviction.
    """

    def __init__(self, capacity: int = 10000):
        self.capacity = capacity
        # key -> list of timestamp floats
        self.windows: OrderedDict[str, list[float]] = OrderedDict()

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> Tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds

        # LRU touch or eviction
        if key in self.windows:
            timestamps = self.windows[key]
            self.windows.move_to_end(key)
        else:
            if len(self.windows) >= self.capacity:
                self.windows.popitem(last=False)  # evict oldest
            timestamps = []
            self.windows[key] = timestamps

        # Filter out timestamps older than window
        valid_timestamps = [t for t in timestamps if t > cutoff]
        self.windows[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            oldest_in_window = valid_timestamps[0]
            retry_after = max(1, int(oldest_in_window + window_seconds - now))
            return False, retry_after

        valid_timestamps.append(now)
        return True, 0


rate_limiter = BoundedSlidingWindowLimiter()


def enforce_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """Enforces rate limit or raises HTTP 429 with Retry-After header."""
    allowed, retry_after = rate_limiter.is_allowed(key, max_requests, window_seconds)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )
