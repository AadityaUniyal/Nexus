import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_driver_pwa_link_redeem_and_ingest(client_a: AsyncClient, unauth_client: AsyncClient):
    """Full lifecycle: issue link -> redeem -> send pings -> execute stop actions."""
    # 1. Dispatcher creates a driver
    res_driver = await client_a.post("/api/v1/drivers", json={"name": "Carlos Gomez", "phone": "+16175551234"})
    assert res_driver.status_code == 200
    driver_id = res_driver.json()["id"]

    # 2. Dispatcher generates one-time link
    res_link = await client_a.post(f"/api/v1/drivers/{driver_id}/link")
    assert res_link.status_code == 200
    link_token = res_link.json()["link_token"]

    # 3. Driver opens link and redeems without prior login
    res_redeem = await unauth_client.post("/api/v1/driver/redeem", json={
        "link_token": link_token,
        "device_info": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    })
    assert res_redeem.status_code == 200
    session_token = res_redeem.json()["session_token"]
    assert session_token is not None

    driver_headers = {"Authorization": f"Bearer {session_token}"}

    # 4. Driver sets duty status to on_duty
    res_duty = await unauth_client.post("/api/v1/driver/duty", json={"status": "on_duty"}, headers=driver_headers)
    assert res_duty.status_code == 200
    assert res_duty.json()["status"] == "on_duty"

    # 5. Driver sends GPS batch pings
    now = datetime.now(timezone.utc)
    pings_payload = {
        "pings": [
            {
                "client_ping_id": "c_ping_1",
                "lat": 42.3601,
                "lon": -71.0589,
                "heading": 90.0,
                "speed_mps": 12.5,
                "accuracy_m": 5.0,
                "recorded_at": (now - timedelta(seconds=10)).isoformat()
            },
            {
                "client_ping_id": "c_ping_2",
                "lat": 42.3610,
                "lon": -71.0570,
                "heading": 85.0,
                "speed_mps": 14.0,
                "accuracy_m": 4.5,
                "recorded_at": now.isoformat()
            }
        ]
    }
    res_pings = await unauth_client.post("/api/v1/driver/pings", json=pings_payload, headers=driver_headers)
    assert res_pings.status_code == 200
    assert res_pings.json()["accepted_count"] == 2

    # 6. Verify driver's current position is updated
    res_driver_check = await client_a.get(f"/api/v1/drivers/{driver_id}")
    assert res_driver_check.status_code == 200
    updated_driver = res_driver_check.json()
    assert updated_driver["current_lat"] == 42.3610
    assert updated_driver["current_lon"] == -71.0570
    assert updated_driver["current_heading"] == 85.0

    # 7. Create a job assigned to this driver (minimum 2 stops: pickup + dropoff)
    job_payload = {
        "title": "Medical Batch Delivery",
        "driver_id": driver_id,
        "stops": [
            {
                "stop_type": "pickup",
                "sequence": 1,
                "address": "Hospital Hub, Boston",
                "lat": 42.3601,
                "lon": -71.0589,
                "tz": "America/New_York",
                "window_start": (now - timedelta(hours=1)).isoformat(),
                "window_end": (now + timedelta(hours=1)).isoformat()
            },
            {
                "stop_type": "dropoff",
                "sequence": 2,
                "address": "Clinic Center, Cambridge",
                "lat": 42.3736,
                "lon": -71.1097,
                "tz": "America/New_York",
                "window_start": (now - timedelta(hours=1)).isoformat(),
                "window_end": (now + timedelta(hours=2)).isoformat()
            }
        ]
    }
    res_job = await client_a.post("/api/v1/jobs", json=job_payload)
    assert res_job.status_code == 200
    job_id = res_job.json()["job_id"]

    # 8. Driver queries active job
    res_active = await unauth_client.get("/api/v1/driver/active-job", headers=driver_headers)
    assert res_active.status_code == 200
    active_job = res_active.json()["job"]
    assert active_job["id"] == job_id
    stop_id = active_job["stops"][0]["id"]

    # 9. Driver marks 'arrived' at stop
    res_action = await unauth_client.post("/api/v1/driver/actions/stop", json={
        "action": "arrived",
        "stop_id": stop_id,
        "recorded_at": now.isoformat(),
        "lat": 42.3601,
        "lon": -71.0589
    }, headers=driver_headers)
    assert res_action.status_code == 200
    assert res_action.json()["status"] == "ok"
    assert res_action.json()["stop_status"] == "arrived"
