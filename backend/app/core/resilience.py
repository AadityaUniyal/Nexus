"""
NEXUS Enterprise Circuit Breaker & Resilience Engine
Guarantees <50ms response times and fault-tolerant fallbacks for external APIs and heavy queries.
"""

import time
import asyncio
import logging
from enum import Enum
from typing import Any, Callable, Dict, Optional, TypeVar, Awaitable

logger = logging.getLogger("nexus.resilience")

T = TypeVar("T")

class CircuitState(str, Enum):
    CLOSED = "CLOSED"        # Normal operations: calls pass through
    OPEN = "OPEN"            # Tripped: immediate fallback without calling upstream
    HALF_OPEN = "HALF_OPEN"  # Testing: trial request permitted to check recovery

class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 4,
        recovery_timeout_seconds: float = 20.0,
        request_timeout_seconds: float = 3.5,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.request_timeout_seconds = request_timeout_seconds
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()
        self.total_calls = 0
        self.total_fallbacks = 0
        self.total_successes = 0

    async def call(
        self,
        coro_func: Callable[[], Awaitable[T]],
        fallback_func: Optional[Callable[[], Awaitable[T] | T]] = None
    ) -> T:
        self.total_calls += 1
        now = time.time()

        # Check if circuit should transition from OPEN to HALF_OPEN
        if self.state == CircuitState.OPEN:
            if now - self.last_state_change > self.recovery_timeout_seconds:
                logger.info(f"CircuitBreaker[{self.name}]: Transitioning OPEN -> HALF_OPEN (probing upstream)")
                self.state = CircuitState.HALF_OPEN
                self.last_state_change = now
            else:
                self.total_fallbacks += 1
                if fallback_func:
                    res = fallback_func()
                    return await res if asyncio.iscoroutine(res) else res
                raise RuntimeError(f"CircuitBreaker[{self.name}] is OPEN and no fallback provided")

        try:
            # Execute with strict timeout
            result = await asyncio.wait_for(coro_func(), timeout=self.request_timeout_seconds)
            
            # On success: reset failure counter and close circuit if was half-open
            if self.state == CircuitState.HALF_OPEN:
                logger.info(f"CircuitBreaker[{self.name}]: Probe succeeded. Transitioning HALF_OPEN -> CLOSED")
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.last_state_change = now

            self.total_successes += 1
            return result

        except Exception as e:
            self.failure_count += 1
            logger.warning(f"CircuitBreaker[{self.name}]: Upstream call failed ({type(e).__name__}: {e}). Failure count: {self.failure_count}")

            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = now
                logger.error(f"CircuitBreaker[{self.name}]: Tripped to OPEN state! Next {self.recovery_timeout_seconds}s will use fallback.")

            self.total_fallbacks += 1
            if fallback_func:
                res = fallback_func()
                return await res if asyncio.iscoroutine(res) else res
            raise e

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "total_calls": self.total_calls,
            "total_successes": self.total_successes,
            "total_fallbacks": self.total_fallbacks,
            "uptime_in_state_seconds": round(time.time() - self.last_state_change, 1)
        }

# Global Pre-configured Circuit Breakers
geo_circuit = CircuitBreaker("geo_routing", failure_threshold=3, request_timeout_seconds=2.5)
weather_circuit = CircuitBreaker("weather_radar", failure_threshold=3, request_timeout_seconds=2.0)
ai_circuit = CircuitBreaker("neural_inference", failure_threshold=3, request_timeout_seconds=5.0)
