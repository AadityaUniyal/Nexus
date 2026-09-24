import time
import logging
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings

logger = logging.getLogger("nexus.rate_limit")

class SlidingWindowRateLimiter:
    """
    Sliding Window Rate Limiter with automatic key cleanup and Redis support.
    """
    def __init__(self):
        # Maps "tier:client_id" -> list of epoch timestamps
        self.history: Dict[str, List[float]] = {}
        self.last_cleanup = time.time()
        self.tiers: Dict[str, Tuple[int, float]] = {
            "standard": (120, 60.0),     # 120 req / 60s
            "simulation": (40, 60.0),    # 40 req / 60s
            "ai_inference": (30, 60.0),  # 30 req / 60s
            "telemetry": (300, 60.0),    # 300 req / 60s
        }

    def _cleanup_expired(self):
        """Purge stale client keys older than max window to prevent memory leaks."""
        now = time.time()
        if now - self.last_cleanup < 120.0:  # Run every 2 minutes
            return
        
        self.last_cleanup = now
        expired_keys = []
        for key, timestamps in list(self.history.items()):
            # Keep timestamps from last 2 minutes
            valid = [t for t in timestamps if now - t < 120.0]
            if not valid:
                expired_keys.append(key)
            else:
                self.history[key] = valid

        for k in expired_keys:
            self.history.pop(k, None)

    def check(self, client_id: str, tier: str = "standard") -> Tuple[bool, int, int, float]:
        self._cleanup_expired()
        limit, window_sec = self.tiers.get(tier, self.tiers["standard"])
        now = time.time()
        window_start = now - window_sec
        key = f"{tier}:{client_id}"

        timestamps = self.history.get(key, [])
        timestamps = [t for t in timestamps if t > window_start]

        count = len(timestamps)
        remaining = max(0, limit - count - 1)
        oldest = timestamps[0] if timestamps else now
        reset_time = oldest + window_sec

        if count >= limit:
            self.history[key] = timestamps
            return False, limit, 0, reset_time

        timestamps.append(now)
        self.history[key] = timestamps
        return True, limit, remaining, reset_time

rate_limiter = SlidingWindowRateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Health check and docs bypass rate limiting
        if request.url.path in ["/health", "/docs", "/openapi.json", "/api/v1/health"]:
            return await call_next(request)

        # Determine client identifier
        client_ip = request.client.host if request.client else "127.0.0.1"
        auth_header = request.headers.get("Authorization", "")
        client_id = f"auth:{auth_header[-12:]}" if auth_header else f"ip:{client_ip}"

        # Assign tier based on route path
        path = request.url.path
        tier = "standard"
        if "/ai/" in path or "/copilot" in path:
            tier = "ai_inference"
        elif "/simulations" in path:
            tier = "simulation"
        elif "/telemetry" in path or "/realtime" in path:
            tier = "telemetry"

        allowed, limit, remaining, reset_time = rate_limiter.check(client_id, tier)

        if not allowed:
            retry_after = max(1, int(reset_time - time.time()))
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded for {tier} tier. Maximum {limit} requests per 60s window.",
                    "retryAfterSec": retry_after,
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(reset_time)),
                    "Retry-After": str(retry_after),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(reset_time))
        return response
