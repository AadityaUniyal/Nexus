# 🏛️ NEXUS API Standards & Contracts Specification
### Modeled on Stripe & Shopify Gold Standard Architecture

**Version**: `2026-10-01`  
**Base URL**: `https://api.nexus-logistics.io/v1` (Production) / `http://localhost:8000/api/v1` (Local)  
**Protocols**: REST (JSON over HTTP/2 & HTTP/3) & WebSockets / Neon Realtime  

---

## 1. Architectural Philosophy & Foundations

The NEXUS API is designed around the core tenets established by **Stripe** and **Shopify**:
- **Resource-Oriented URLs**: Predictable nouns instead of actions (e.g., `/v1/vehicles`, `/v1/simulations`, `/v1/incidents`).
- **Idempotent Mutations**: All mutating operations (`POST`, `PUT`) support standard idempotency keys to ensure safe retries across unstable networks.
- **Predictable Error Contracts**: No opaque 500 errors; deterministic error objects with programmatic codes, specific field pointers (`param`), and deep-links to documentation (`doc_url`).
- **Date-Based API Versioning**: Breaking schema changes are isolated behind explicit version headers (`Nexus-Version: YYYY-MM-DD`).
- **Cursor-Based Pagination**: Stable, performant cursor pagination (`starting_after`, `ending_before`) avoiding offset drift.
- **Cryptographic Webhook Signatures**: Tamper-proof notifications verified via HMAC-SHA256 signatures (`Nexus-Signature`).

---

## 2. Request & Response Envelopes

### 2.1 Single Resource Contract (Stripe Object Pattern)
Every single resource returned by NEXUS includes an `object` descriptor, unique ID, and creation timestamp:

```json
{
  "object": "vehicle",
  "id": "veh_01HXYZ7894JQKAB",
  "code": "NX-104",
  "type": "EV_SEMI",
  "make_model": "Freightliner eCascadia",
  "status": "ACTIVE",
  "telemetry": {
    "speed_kmh": 68.4,
    "battery_soc_pct": 74.2,
    "odometer_km": 142890.5,
    "coordinates": {
      "latitude": 39.7392,
      "longitude": -104.9903
    },
    "heading_deg": 274.5,
    "recorded_at": 1729252800
  },
  "assigned_route_id": "rte_01HXY9021",
  "metadata": {
    "carrier_code": "NEXUS_EXPRESS",
    "region": "US_CENTRAL"
  },
  "created_at": 1729200000,
  "updated_at": 1729252800
}
```

### 2.2 List / Collection Contract
Collections return a structured list object with pagination metadata:

```json
{
  "object": "list",
  "data": [
    {
      "object": "vehicle",
      "id": "veh_01HXYZ7894JQKAB",
      "code": "NX-104",
      "status": "ACTIVE"
    }
  ],
  "has_more": true,
  "total_count": 184,
  "page_info": {
    "start_cursor": "veh_01HXYZ7894JQKAB",
    "end_cursor": "veh_01HXYZ7894JQKZZ",
    "has_next_page": true,
    "has_previous_page": false
  },
  "api_version": "2026-10-01",
  "request_id": "req_01HX98877665544"
}
```

---

## 3. Standardized Error Contracts (Stripe & Shopify Standards)

When an error occurs, NEXUS returns a standardized HTTP error code along with a deterministic JSON error object.

### 3.1 Stripe-Style Error Hierarchy

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_out_of_range",
    "message": "The battery state of charge (SoC) must be between 0.0 and 100.0 percent.",
    "param": "telemetry.battery_soc_pct",
    "doc_url": "https://docs.nexus-logistics.io/api/errors#parameter_out_of_range",
    "request_id": "req_01HXY77382910"
  }
}
```

### 3.2 Error Types

| Error Type | HTTP Status | Description |
| :--- | :--- | :--- |
| `api_error` | 500, 502, 503 | An unexpected error occurred within the NEXUS compute cluster. |
| `authentication_error` | 401 | Failure to authenticate (invalid or expired JWT / API key). |
| `authorization_error` | 403 | Authenticated user lacks permission to access the resource. |
| `invalid_request_error` | 400 | The request parameters or body are invalid, missing, or malformed. |
| `idempotency_error` | 409 | A conflicting operation with the same `Idempotency-Key` is currently executing. |
| `rate_limit_error` | 429 | Request quota has been exceeded. Check `Retry-After` header. |
| `resource_missing_error` | 404 | The requested entity ID does not exist in the tenant's workspace. |

### 3.3 Shopify GraphQL `userErrors` Parity
For batch or simulation validation endpoints, NEXUS also provides field-level `userErrors`:

```json
{
  "success": false,
  "user_errors": [
    {
      "field": ["simulation", "parameters", "speed_kmh"],
      "message": "Speed exceeds vehicle physical governor limits (105 km/h)."
    },
    {
      "field": ["simulation", "route", "waypoints", "0"],
      "message": "Waypoint 0 latitude must be within bounds [-90, 90]."
    }
  ]
}
```

---

## 4. Idempotency Standards

For safe execution of critical physical and financial mutations (e.g. dispatching a reroute, executing a Monte Carlo simulation), pass the `Idempotency-Key` header:

```http
POST /v1/simulations/evaluate HTTP/1.1
Host: api.nexus-logistics.io
Authorization: Bearer <token>
Idempotency-Key: idemp_9f823a-bc81-4b72-a19c-00918231
Content-Type: application/json

{
  "scenario_code": "I-70-BYPASS-01",
  "target_vehicle_id": "veh_01HXYZ7894JQKAB",
  "weather_severity": "SEVERE_BLIZZARD"
}
```

### Behavior:
1. If the key has not been seen in the last 24 hours, the server computes the simulation, caches the result, and returns HTTP `201 Created`.
2. If the identical key is re-sent while the first request is still running, the server returns HTTP `409 Conflict` with `idempotency_error` (`keys_in_flight`).
3. If the request completes and is re-sent within 24 hours, NEXUS replays the cached response with the `Idempotent-Replay: true` header.

---

## 5. API Versioning Contract

NEXUS enforces date-based API versioning:

```http
Nexus-Version: 2026-10-01
```

- If omitted, the request defaults to the organization's pinned account version.
- Backwards-incompatible changes introduce a new date-based version.
- Deprecated endpoints include RFC 8594 standard headers:
  ```http
  Deprecation: true
  Sunset: Sun, 01 Nov 2026 00:00:00 GMT
  Link: <https://docs.nexus-logistics.io/v1/changelog>; rel="deprecation"
  ```

---

## 6. Rate Limiting Headers (Shopify & Stripe Standards)

NEXUS provides explicit rate-limit status on every API response:

```http
X-Nexus-RateLimit-Limit: 120
X-Nexus-RateLimit-Remaining: 114
X-Nexus-RateLimit-Reset: 1729252860
Retry-After: 0
```

When 429 occurs:
```json
{
  "error": {
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "message": "Too many requests. You have reached your limit of 120 requests per minute.",
    "doc_url": "https://docs.nexus-logistics.io/api/rate-limits"
  }
}
```

---

## 7. Webhook Signatures (Shopify & Stripe HMAC Standard)

Every event sent to your webhook URL is signed using HMAC-SHA256 with your endpoint secret.

### Header:
```http
Nexus-Signature: t=1729252800,v1=5257a863e5e349fd2ddc3c76e384c3c3f9e6c7292761ebd86129ac839f8014f
```

### Verification Algorithm:
1. Extract timestamp `t` and signature `v1`.
2. Prepare the signed payload string: `${t}.${raw_request_body}`.
3. Compute `HMAC-SHA256(signed_payload, webhook_secret)`.
4. Compare computed hash against `v1` using timing-safe comparison (`crypto.timingSafeEqual`).
5. Ensure `Math.abs(Date.now() / 1000 - t) < 300` (reject requests older than 5 minutes to prevent replay attacks).

---

## 8. Neon Realtime & WebSocket Integration

### Connection:
```http
GET / HTTP/1.1
Host: br-lucky-wildflower-a5249olo-neonrealtimesocket.compute.c-1.us-east-2.aws.neon.tech
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Protocol: neon-realtime, auth-nrt_live_1CAkLPdW1svFrHe1twL5IOU15hF7bue1tXwAjR3LpPSY
```

### Subscription Frame:
```json
{
  "type": "subscribe",
  "topic": "fleets:us-central:telemetry",
  "filter": {
    "vehicle_id": "veh_01HXYZ7894JQKAB"
  }
}
```

### Event Stream Frame:
```json
{
  "object": "event",
  "topic": "fleets:us-central:telemetry",
  "event": "VEHICLE_UPDATED",
  "payload": {
    "vehicle_id": "veh_01HXYZ7894JQKAB",
    "speed_kmh": 72.1,
    "battery_soc_pct": 73.9,
    "status": "ACTIVE"
  },
  "timestamp": 1729252805
}
```
