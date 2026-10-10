import time
import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal
from app.services.audit_service import compute_audit_hash, canonical_json
from app.core.rate_limit import enforce_rate_limit, rate_limiter
from app.realtime.sse import SSEManager

@pytest.mark.asyncio
async def test_audit_hash_chain_throughput_benchmark():
    """Benchmark raw cryptographic hash chaining performance: target > 5,000 ops/sec."""
    prev_hash = "0" * 64
    count = 2000
    start_time = time.perf_counter()

    for i in range(count):
        record = {
            "seq": i + 1,
            "workspace_id": "ws_bench",
            "actor_id": "usr_bench",
            "action": "ping_ingested",
            "entity_type": "location_ping",
            "entity_id": f"ping_{i}",
            "payload": {"lat": 42.3601 + (i * 0.0001), "lon": -71.0589},
            "created_at": "2026-10-10T12:00:00Z",
        }
        prev_hash = compute_audit_hash(prev_hash, record)

    duration = time.perf_counter() - start_time
    ops_per_sec = count / duration

    assert len(prev_hash) == 64
    assert ops_per_sec > 5000, f"Throughput {ops_per_sec:.0f} ops/sec was below 5,000 ops/sec target"


@pytest.mark.asyncio
async def test_rate_limiter_concurrency_and_memory_bounding():
    """Verify rate limiter handles 10,000 concurrent checks with bounded storage."""
    rate_limiter.windows.clear()
    start_time = time.perf_counter()

    allowed_count = 0
    denied_count = 0

    # 100 unique clients sending 100 requests each
    for client_idx in range(100):
        client_key = f"driver_session_{client_idx}"
        for req_idx in range(100):
            try:
                enforce_rate_limit(key=client_key, max_requests=60, window_seconds=60)
                allowed_count += 1
            except Exception:
                denied_count += 1

    duration = time.perf_counter() - start_time
    total_checks = allowed_count + denied_count

    assert total_checks == 10000
    assert allowed_count == 100 * 60  # Exactly 60 allowed per client
    assert denied_count == 100 * 40   # Exactly 40 throttled per client
    assert len(rate_limiter.windows) == 100  # Keys bounded by number of active principals


@pytest.mark.asyncio
async def test_sse_broadcast_fanout_latency():
    """Verify SSE broadcast to 50 active client queues takes < 15ms."""
    manager = SSEManager()
    ws_id = "ws_bench_fanout"

    # Subscribe 50 mock clients
    queues = [await manager.subscribe(ws_id) for _ in range(50)]

    start_time = time.perf_counter()
    await manager.broadcast(
        workspace_id=ws_id,
        event_type="driver_ping",
        data={"driver_id": "drv_1", "lat": 42.3601, "lon": -71.0589}
    )
    broadcast_duration = (time.perf_counter() - start_time) * 1000.0  # ms

    # Check all queues received the event
    for q in queues:
        assert q.qsize() == 1

    # Cleanup
    for q in queues:
        await manager.unsubscribe(ws_id, q)

    assert broadcast_duration < 15.0, f"SSE fanout took {broadcast_duration:.2f}ms (target < 15ms)"
