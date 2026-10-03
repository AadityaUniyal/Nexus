"""In-process rolling request metrics (per App Service instance).

Application Insights holds the durable, cross-instance history; this
collector gives the admin dashboard instant numbers without querying
Log Analytics (which would need extra credentials and cost).
"""
import threading
import time
from collections import Counter, deque
from typing import Any, Deque, Dict, Tuple

WINDOW_SECONDS = 24 * 3600
MAX_SAMPLES = 50_000


class PlatformMetrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._samples: Deque[Tuple[float, float, int, str]] = deque(maxlen=MAX_SAMPLES)
        self.started_at = time.time()

    def record(self, path: str, status_code: int, duration_ms: float) -> None:
        # Collapse ids so routes aggregate: /incidents/abc123 -> /incidents/:id
        parts = [p if not any(c.isdigit() for c in p) or len(p) < 6 else ":id" for p in path.split("/")]
        with self._lock:
            self._samples.append((time.time(), duration_ms, status_code, "/".join(parts)[:120]))

    def snapshot(self) -> Dict[str, Any]:
        cutoff = time.time() - WINDOW_SECONDS
        with self._lock:
            rows = [s for s in self._samples if s[0] >= cutoff]
        total = len(rows)
        durations = sorted(r[1] for r in rows)

        def pct(p: float) -> float:
            if not durations:
                return 0.0
            return round(durations[min(len(durations) - 1, int(p * len(durations)))], 1)

        errors = sum(1 for r in rows if r[2] >= 500)
        client_errors = sum(1 for r in rows if 400 <= r[2] < 500)
        routes = Counter(r[3] for r in rows).most_common(8)
        hourly: Counter = Counter(int(r[0] // 3600) for r in rows)
        now_h = int(time.time() // 3600)
        series = [
            {"hour": time.strftime("%H:00", time.gmtime((now_h - i) * 3600)), "requests": hourly.get(now_h - i, 0)}
            for i in range(23, -1, -1)
        ]
        return {
            "windowHours": 24,
            "uptimeSeconds": int(time.time() - self.started_at),
            "requests": total,
            "errorRatePct": round(errors / total * 100, 2) if total else 0.0,
            "clientErrorRatePct": round(client_errors / total * 100, 2) if total else 0.0,
            "latencyMs": {"p50": pct(0.5), "p95": pct(0.95), "p99": pct(0.99)},
            "topRoutes": [{"route": r, "count": c} for r, c in routes],
            "hourly": series,
        }


platform_metrics = PlatformMetrics()
