import time
from datetime import timedelta
import pytest
from httpx import AsyncClient
from app.core.rate_limit import rate_limiter

# ---------------------------------------------------------------------------
# Tier 2 - Category 1: Empty & Malformed Request Bodies (422)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_body_rejected_on_login(async_client: AsyncClient):
    """POST /api/v1/auth/login with empty JSON body must return 422."""
    response = await async_client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data

@pytest.mark.asyncio
async def test_empty_body_rejected_on_signup(async_client: AsyncClient):
    """POST /api/v1/auth/signup with empty JSON body must return 422."""
    response = await async_client.post("/api/v1/auth/signup", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_empty_body_rejected_on_create_incident(auth_client: AsyncClient):
    """POST /api/v1/incidents with empty JSON body must return 422."""
    response = await auth_client.post("/api/v1/incidents", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_empty_body_rejected_on_create_warehouse(auth_client: AsyncClient):
    """POST /api/v1/operations/warehouses with empty body must return 422."""
    response = await auth_client.post("/api/v1/operations/warehouses", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_empty_body_rejected_on_simulation_evaluate(async_client: AsyncClient):
    """POST /api/v1/simulations/evaluate with empty body must return 422."""
    response = await async_client.post("/api/v1/simulations/evaluate", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_empty_body_rejected_on_telemetry_ingest(auth_client: AsyncClient):
    """POST /api/v1/telemetry with empty body must return 422."""
    response = await auth_client.post("/api/v1/telemetry", json={})
    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_missing_required_fields_on_incident_create(auth_client: AsyncClient):
    """POST /api/v1/incidents missing summary, severity, and affected entity must return 422."""
    payload = {"title": "Only Title Provided"}
    response = await auth_client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    missing_fields = [e["loc"][-1] for e in errors]
    assert "summary" in missing_fields or "severity" in missing_fields


# ---------------------------------------------------------------------------
# Tier 2 - Category 2: Invalid / Expired / Tampered Tokens (401)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(async_client: AsyncClient):
    """Accessing protected telematics endpoint with no Authorization header must return 401."""
    response = await async_client.get("/api/v1/telemetry/live")
    assert response.status_code == 401
    assert "Unauthenticated" in str(response.json()) or "Bearer token required" in str(response.json())

@pytest.mark.asyncio
async def test_malformed_token_header_rejected(async_client: AsyncClient):
    """Accessing protected endpoint with malformed JWT string must return 401."""
    headers = {"Authorization": "Bearer not.a.valid.jwt.string"}
    response = await async_client.get("/api/v1/telemetry/live", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_token_missing_bearer_prefix_rejected(async_client: AsyncClient, admin_token: str):
    """Authorization header without Bearer prefix must return 401."""
    headers = {"Authorization": f"Token {admin_token}"}
    response = await async_client.get("/api/v1/telemetry/live", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_expired_token_rejected(async_client: AsyncClient, token_factory):
    """Token with expiration timestamp in the past must return 401."""
    expired_jwt = token_factory(expires_delta=timedelta(seconds=-30))
    headers = {"Authorization": f"Bearer {expired_jwt}"}
    response = await async_client.get("/api/v1/telemetry/live", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_tampered_token_signature_rejected(async_client: AsyncClient, admin_token: str):
    """JWT with modified payload or corrupted signature must be rejected with 401."""
    tampered_jwt = admin_token[:-6] + "xxxxxx"
    headers = {"Authorization": f"Bearer {tampered_jwt}"}
    response = await async_client.get("/api/v1/telemetry/live", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_token_with_empty_bearer_rejected(async_client: AsyncClient):
    """Authorization header 'Bearer ' with empty token must return 401."""
    headers = {"Authorization": "Bearer "}
    response = await async_client.get("/api/v1/telemetry/live", headers=headers)
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Tier 2 - Category 3: Boundary Query Parameters & Constraints (422)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_query_param_negative_offset_rejected(auth_client: AsyncClient):
    """GET /api/v1/incidents?offset=-1 must fail boundary validation with 422."""
    response = await auth_client.get("/api/v1/incidents?offset=-1")
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_query_param_limit_zero_rejected(auth_client: AsyncClient):
    """GET /api/v1/operations/warehouses?limit=0 must fail boundary validation with 422."""
    response = await auth_client.get("/api/v1/operations/warehouses?limit=0")
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_query_param_warehouses_limit_exceeding_max(auth_client: AsyncClient):
    """GET /api/v1/operations/warehouses?limit=201 (max 200) must return 422."""
    response = await auth_client.get("/api/v1/operations/warehouses?limit=201")
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_query_param_incidents_limit_exceeding_max(auth_client: AsyncClient):
    """GET /api/v1/incidents?limit=501 (max 500) must return 422."""
    response = await auth_client.get("/api/v1/incidents?limit=501")
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_query_param_stochastic_iterations_below_min(async_client: AsyncClient):
    """POST /api/v1/simulations/evaluate-stochastic?iterations=40 (min 50) must return 422."""
    payload = {
        "base_metrics": {
            "totalDistanceKm": 1000.0,
            "avgDurationMins": 600,
            "currentDelayMins": 30,
            "ordersCount": 5,
            "totalOrderValue": 10000.0,
            "baseCostUsd": 800.0
        },
        "variables": {"vehicleId": "v-104"}
    }
    response = await async_client.post("/api/v1/simulations/evaluate-stochastic?iterations=40", json=payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_query_param_stochastic_iterations_above_max(async_client: AsyncClient):
    """POST /api/v1/simulations/evaluate-stochastic?iterations=2001 (max 2000) must return 422."""
    payload = {
        "base_metrics": {
            "totalDistanceKm": 1000.0,
            "avgDurationMins": 600,
            "currentDelayMins": 30,
            "ordersCount": 5,
            "totalOrderValue": 10000.0,
            "baseCostUsd": 800.0
        },
        "variables": {"vehicleId": "v-104"}
    }
    response = await async_client.post("/api/v1/simulations/evaluate-stochastic?iterations=2001", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Tier 2 - Category 4: Edge Payloads & Entity Not Found Handling (404 / 400)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_nonexistent_warehouse_returns_404(auth_client: AsyncClient):
    """GET /api/v1/operations/warehouses/wh-nonexistent-404 must return 404."""
    response = await auth_client.get("/api/v1/operations/warehouses/wh-nonexistent-404")
    assert response.status_code == 404
    assert "Warehouse" in str(response.json())

@pytest.mark.asyncio
async def test_nonexistent_vehicle_returns_404(auth_client: AsyncClient):
    """GET /api/v1/operations/vehicles/v-nonexistent-404 must return 404."""
    response = await auth_client.get("/api/v1/operations/vehicles/v-nonexistent-404")
    assert response.status_code == 404
    assert "Vehicle" in str(response.json())

@pytest.mark.asyncio
async def test_nonexistent_route_returns_404(auth_client: AsyncClient):
    """GET /api/v1/operations/routes/rt-nonexistent-404 must return 404."""
    response = await auth_client.get("/api/v1/operations/routes/rt-nonexistent-404")
    assert response.status_code == 404
    assert "Route" in str(response.json())

@pytest.mark.asyncio
async def test_nonexistent_incident_returns_404(auth_client: AsyncClient):
    """GET /api/v1/incidents/inc-nonexistent-404 must return 404."""
    response = await auth_client.get("/api/v1/incidents/inc-nonexistent-404")
    assert response.status_code == 404
    assert "Incident" in str(response.json())

@pytest.mark.asyncio
async def test_nonexistent_simulation_run_returns_404(auth_client: AsyncClient):
    """POST /api/v1/simulations/sim-nonexistent-404/run must return 404."""
    response = await auth_client.post("/api/v1/simulations/sim-nonexistent-404/run")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_invalid_incident_state_transition_returns_400(auth_client: AsyncClient):
    """Transitioning incident with illegal state jump (e.g. DETECTED directly to RESOLVED) returns 400."""
    # Create incident in DETECTED state
    create_payload = {
        "title": "State Machine Boundary Test",
        "summary": "Testing boundary transitions on incident state engine.",
        "severity": "LOW",
        "affected_entity_type": "VEHICLE",
        "affected_entity_id": "v-104",
        "affected_entity_name": "Freightliner eCascadia #104",
    }
    create_res = await auth_client.post("/api/v1/incidents", json=create_payload)
    inc_id = create_res.json()["id"]

    # Attempt illegal transition: DETECTED -> ACTION_APPLIED (cannot apply action directly from DETECTED)
    transition_payload = {
        "status": "ACTION_APPLIED",
        "note": "Illegal jump from DETECTED to ACTION_APPLIED."
    }
    res = await auth_client.post(f"/api/v1/incidents/{inc_id}/transition", json=transition_payload)
    assert res.status_code in [400, 409, 422]

@pytest.mark.asyncio
async def test_telemetry_latitude_boundary_rejected(auth_client: AsyncClient):
    """POST /api/v1/telemetry with latitude=95.0 (> 90.0) must fail validation with 422."""
    packet = {
        "vehicle_identifier": "NX-104",
        "latitude": 95.0,
        "longitude": -95.9345,
        "speed_kmh": 60.0
    }
    response = await auth_client.post("/api/v1/telemetry", json=packet)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_telemetry_longitude_boundary_rejected(auth_client: AsyncClient):
    """POST /api/v1/telemetry with longitude=-195.0 (< -180.0) must fail validation with 422."""
    packet = {
        "vehicle_identifier": "NX-104",
        "latitude": 41.2565,
        "longitude": -195.0,
        "speed_kmh": 60.0
    }
    response = await auth_client.post("/api/v1/telemetry", json=packet)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Tier 2 - Category 5: Rate Limiting Boundary Enforcement
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rate_limit_headers_injected_on_standard_requests(async_client: AsyncClient):
    """Non-health requests receive rate limit tracking headers."""
    response = await async_client.get("/")
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers

@pytest.mark.asyncio
async def test_rate_limit_throttle_exhaustion_returns_429(async_client: AsyncClient):
    """Exhausting sliding window limiter quota triggers 429 Too Many Requests."""
    client_id = "ip:127.0.0.1"
    now = time.time()
    # Pre-fill standard limit history (120 requests in 60s)
    rate_limiter.history[f"standard:{client_id}"] = [now - 1.0] * 125

    response = await async_client.get("/")
    assert response.status_code == 429
    data = response.json()
    assert data["code"] == "RATE_LIMIT_EXCEEDED"
    assert "retryAfterSec" in data
    assert "Retry-After" in response.headers
    assert response.headers["X-RateLimit-Remaining"] == "0"
