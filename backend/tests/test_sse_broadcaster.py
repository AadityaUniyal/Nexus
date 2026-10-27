import pytest
import asyncio
from app.realtime.sse import EventBroadcaster

@pytest.mark.asyncio
async def test_sse_broadcaster_in_memory_delivery():
    broadcaster = EventBroadcaster()
    received = []

    async def client_listener():
        gen = broadcaster.subscribe("ws-test-123")
        first_event = await anext(gen)
        assert "CONNECTION_ESTABLISHED" in first_event

        data_event = await anext(gen)
        received.append(data_event)

    listener_task = asyncio.create_task(client_listener())
    await asyncio.sleep(0.05)

    # Broadcast test event
    await broadcaster.broadcast(
        event_type="DISPATCH_OPTIMIZED",
        payload={"trip_id": "TRIP-999", "deadhead_reduction_pct": 38.6},
        workspace_id="ws-test-123"
    )

    await asyncio.wait_for(listener_task, timeout=2.0)
    assert len(received) == 1
    assert "DISPATCH_OPTIMIZED" in received[0]
    assert "TRIP-999" in received[0]

@pytest.mark.asyncio
async def test_sse_broadcaster_workspace_isolation():
    broadcaster = EventBroadcaster()
    received_tenant_a = []
    received_tenant_b = []

    async def tenant_a_listener():
        gen = broadcaster.subscribe("tenant-A")
        await anext(gen)  # connection heartbeat
        msg = await anext(gen)
        received_tenant_a.append(msg)

    async def tenant_b_listener():
        gen = broadcaster.subscribe("tenant-B")
        await anext(gen)  # connection heartbeat
        try:
            # Should NOT receive tenant-A's event within timeout
            await asyncio.wait_for(anext(gen), timeout=0.2)
            received_tenant_b.append("leak")
        except (asyncio.TimeoutError, TimeoutError, StopAsyncIteration, Exception):
            pass

    task_a = asyncio.create_task(tenant_a_listener())
    task_b = asyncio.create_task(tenant_b_listener())
    await asyncio.sleep(0.05)

    # Send event strictly to tenant-A
    await broadcaster.broadcast(
        event_type="CONFIDENTIAL_CARGO_ALERT",
        payload={"secret": "alpha-omega"},
        workspace_id="tenant-A"
    )

    await asyncio.wait_for(task_a, timeout=1.0)
    await task_b

    assert len(received_tenant_a) == 1
    assert "CONFIDENTIAL_CARGO_ALERT" in received_tenant_a[0]
    assert len(received_tenant_b) == 0
