import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_cross_tenant_driver_isolation(client_a: AsyncClient, client_b: AsyncClient):
    """Tenant A's drivers must never be accessible or mutable by Tenant B."""
    # 1. Tenant A creates a driver
    res_a = await client_a.post("/api/v1/drivers", json={"name": "Alice Driver", "phone": "+1234567890"})
    assert res_a.status_code == 200
    driver_a = res_a.json()
    driver_id = driver_a["id"]

    # 2. Tenant B lists drivers - must be empty for Tenant B
    res_b_list = await client_b.get("/api/v1/drivers")
    assert res_b_list.status_code == 200
    assert len(res_b_list.json()) == 0

    # 3. Tenant B attempts to read Tenant A's driver -> 404
    res_b_get = await client_b.get(f"/api/v1/drivers/{driver_id}")
    assert res_b_get.status_code == 404

    # 4. Tenant B attempts to mutate Tenant A's driver -> 404
    res_b_patch = await client_b.patch(f"/api/v1/drivers/{driver_id}", json={"name": "Hacked Driver"})
    assert res_b_patch.status_code == 404

    # 5. Tenant B attempts to generate a link for Tenant A's driver -> 404
    res_b_link = await client_b.post(f"/api/v1/drivers/{driver_id}/link")
    assert res_b_link.status_code == 404

@pytest.mark.asyncio
async def test_cross_tenant_job_isolation(client_a: AsyncClient, client_b: AsyncClient):
    """Tenant A's jobs and stops must never be accessible or mutable by Tenant B."""
    # 1. Tenant A creates a job
    job_payload = {
        "title": "Confidential Cargo 101",
        "stops": [
            {
                "stop_type": "pickup",
                "sequence": 1,
                "address": "100 Main St, Boston, MA",
                "lat": 42.3601,
                "lon": -71.0589,
                "tz": "America/New_York",
                "window_start": "2026-10-15T09:00:00Z",
                "window_end": "2026-10-15T10:00:00Z"
            },
            {
                "stop_type": "dropoff",
                "sequence": 2,
                "address": "200 State St, Boston, MA",
                "lat": 42.3589,
                "lon": -71.0538,
                "tz": "America/New_York",
                "window_start": "2026-10-15T11:00:00Z",
                "window_end": "2026-10-15T12:00:00Z"
            }
        ]
    }
    res_create = await client_a.post("/api/v1/jobs", json=job_payload)
    assert res_create.status_code == 200
    job_id = res_create.json()["job_id"]

    # 2. Tenant B lists jobs - must be empty
    res_b_list = await client_b.get("/api/v1/jobs")
    assert res_b_list.status_code == 200
    assert len(res_b_list.json()) == 0

    # 3. Tenant B attempts to get Tenant A's job -> 404
    res_b_get = await client_b.get(f"/api/v1/jobs/{job_id}")
    assert res_b_get.status_code == 404

    # 4. Tenant B attempts to patch Tenant A's job -> 404
    res_b_patch = await client_b.patch(f"/api/v1/jobs/{job_id}", json={"title": "Hacked Title"})
    assert res_b_patch.status_code == 404
