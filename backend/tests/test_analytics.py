import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from app.db.session import AsyncSessionLocal
from app.models.job import Job, JobStop, Prediction

@pytest.mark.asyncio
async def test_analytics_empty_state_and_statistical_threshold(client_a: AsyncClient):
    """Analytics must return honest empty/null states until >= 5 completed jobs exist."""
    # 1. Zero completed jobs
    res_empty = await client_a.get("/api/v1/analytics")
    assert res_empty.status_code == 200
    data = res_empty.json()
    assert data["sample_size"] == 0
    assert data["has_enough_data"] is False

    # 2. Seed 6 completed jobs in the database
    ws_id = "ws_tenant_a"
    base_time = datetime(2026, 10, 10, 12, 0, 0, tzinfo=timezone.utc)

    async with AsyncSessionLocal() as session:
        for i in range(6):
            job_id = f"job_completed_{i}"
            stop_id = f"stop_completed_{i}"
            job = Job(
                id=job_id,
                workspace_id=ws_id,
                title=f"Delivery #{i}",
                status="completed"
            )
            # Window 12:00 to 13:00
            # Driver predicted ETA at 12:45
            # Actual arrival at 12:40 (on-time, 5 min error, 30 min lead time)
            stop = JobStop(
                id=stop_id,
                workspace_id=ws_id,
                job_id=job.id,
                stop_type="dropoff",
                sequence=1,
                address="Boston Delivery Point",
                lat=42.3601,
                lon=-71.0589,
                tz="America/New_York",
                window_start=base_time,
                window_end=base_time + timedelta(hours=1),
                status="completed",
                actual_arrival_at=base_time + timedelta(minutes=40)
            )
            pred = Prediction(
                id=f"pred_completed_{i}",
                workspace_id=ws_id,
                job_id=job.id,
                stop_id=stop.id,
                origin_lat=42.3601,
                origin_lon=-71.0589,
                status="on_time",
                eta_at=base_time + timedelta(minutes=45),
                uncertainty_margin_seconds=300,
                reason="Traffic clear",
                created_at=base_time + timedelta(minutes=10)
            )
            session.add(job)
            session.add(stop)
            session.add(pred)
        await session.commit()

    # 3. Query analytics after meeting sample threshold
    res_full = await client_a.get("/api/v1/analytics")
    assert res_full.status_code == 200
    metrics = res_full.json()
    assert metrics["has_enough_data"] is True
    assert metrics["sample_size"] == 6
    assert metrics["on_time_rate"] == 1.0
    assert metrics["median_abs_error_30m"] == 5.0
