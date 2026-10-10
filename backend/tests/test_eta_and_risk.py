import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal
from app.services.eta_service import compute_job_eta, _ROUTE_CACHE
from app.models.driver import Driver, LocationPing
from app.models.job import Job, JobStop, Prediction

@pytest.mark.asyncio
async def test_eta_risk_classification():
    """Verify on_time, at_risk, and late classification logic with live traffic factors."""
    ws_id = "ws_tenant_a"

    async with AsyncSessionLocal() as session:
        # Create Driver
        driver = Driver(
            workspace_id=ws_id,
            name="Driver Fast",
            status="on_duty",
            current_lat=42.3601,
            current_lon=-71.0589,
            last_ping_at=datetime.now(timezone.utc)
        )
        session.add(driver)
        await session.flush()

        ping = LocationPing(
            workspace_id=ws_id,
            driver_id=driver.id,
            client_ping_id="ping_test_1",
            lat=42.3601,
            lon=-71.0589,
            heading=90.0,
            speed_mps=12.0,
            accuracy_m=5.0,
            recorded_at=datetime.now(timezone.utc)
        )
        session.add(ping)
        await session.flush()

        # Create Job with a stop
        now = datetime.now(timezone.utc)
        stop = JobStop(
            workspace_id=ws_id,
            job_id="job_temp",
            stop_type="dropoff",
            sequence=1,
            address="Destination",
            lat=42.4000,
            lon=-71.1000,
            tz="America/New_York",
            window_start=now,
            window_end=now + timedelta(minutes=30),
            status="pending"
        )
        job = Job(
            id="job_temp",
            workspace_id=ws_id,
            driver_id=driver.id,
            title="Express Risk Test",
            status="assigned"
        )
        job.stops.append(stop)
        session.add(job)
        await session.commit()

        # Case 1: Route takes 15 mins (within 30m window) -> on_time
        _ROUTE_CACHE.clear()
        with patch("app.services.eta_service.azure_maps_client.calculate_route", new_callable=AsyncMock) as mock_dir:
            mock_dir.return_value = {
                "travel_time_seconds": 900,  # 15 mins
                "traffic_delay_seconds": 60,
                "distance_meters": 5000,
                "route_geometry": {"coordinates": [[-71.0589, 42.3601], [-71.1000, 42.4000]]}
            }
            pred1 = await compute_job_eta(
                db=session,
                job=job,
                driver=driver,
                latest_ping=ping
            )
            assert pred1 is not None
            assert pred1.status == "on_time"

        # Case 2: Route takes 28 mins (close to 30m window with uncertainty) -> at_risk
        _ROUTE_CACHE.clear()
        with patch("app.services.eta_service.azure_maps_client.calculate_route", new_callable=AsyncMock) as mock_dir:
            mock_dir.return_value = {
                "travel_time_seconds": 1680,  # 28 mins
                "traffic_delay_seconds": 300,
                "distance_meters": 5000,
                "route_geometry": {"coordinates": [[-71.0589, 42.3601], [-71.1000, 42.4000]]}
            }
            pred2 = await compute_job_eta(
                db=session,
                job=job,
                driver=driver,
                latest_ping=ping
            )
            assert pred2 is not None
            assert pred2.status == "at_risk"

        # Case 3: Route takes 45 mins (exceeds 30m window) -> late
        _ROUTE_CACHE.clear()
        with patch("app.services.eta_service.azure_maps_client.calculate_route", new_callable=AsyncMock) as mock_dir:
            mock_dir.return_value = {
                "travel_time_seconds": 2700,  # 45 mins
                "traffic_delay_seconds": 900,
                "distance_meters": 5000,
                "route_geometry": {"coordinates": [[-71.0589, 42.3601], [-71.1000, 42.4000]]}
            }
            pred3 = await compute_job_eta(
                db=session,
                job=job,
                driver=driver,
                latest_ping=ping
            )
            assert pred3 is not None
            assert pred3.status == "late"
