import time
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class SlidingWindowRateLimiter:
    def __init__(self):
        # Maps "tier:client_id" -> list of epoch timestamps
        self.history: Dict[str, List[float]] = {}
        self.tiers: Dict[str, Tuple[int, float]] = {
            "standard": (120, 60.0),     # 120 req / 60s
            "simulation": (40, 60.0),    # 40 req / 60s
            "ai_inference": (20, 60.0),  # 20 req / 60s
            "telemetry": (300, 60.0),    # 300 req / 60s
        }

    def check(self, client_id: str, tier: str = "standard") -> Tuple[bool, int, int, float]:
        limit, window_sec = self.tiers.get(tier, self.tiers["standard"])
        now = time.time()
        window_start = now - window_sec
        key = f"{tier}:{client_id}"

        timestamps = self.history.get(key, [])
        # Filter older timestamps
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
        # Determine client identifier
        client_ip = request.client.host if request.client else "127.0.0.1"
        auth_header = request.headers.get("Authorization", "")
        client_id = f"auth:{auth_header[-12:]}" if auth_header else f"ip:{client_ip}"

        # Assign tier based on route path
        path = request.url.path
        tier = "standard"
        if "/ai/" in path:
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
                    "message": f"Rate limit exceeded for {tier} tier. Maximum {limit} requests per minute.",
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
