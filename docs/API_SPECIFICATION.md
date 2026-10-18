# 📑 NEXUS Unified REST & Realtime API Specification
### Enterprise Architectural Contract (Stripe & Shopify Standards Compliant)

**Full Standards Guide**: See [API_DOCUMENTATION_STRIPE_SHOPIFY_STANDARDS.md](file:///c:/Users/HP/OneDrive/Desktop/Nexus/docs/API_DOCUMENTATION_STRIPE_SHOPIFY_STANDARDS.md)  
**API Version**: `2026-10-01`  
**Base Path**: `/api/v1`  
**Realtime Endpoints**:
- SSE Stream: `/api/v1/realtime/stream`
- Neon Realtime WebSocket: `wss://br-lucky-wildflower-a5249olo-neonrealtimesocket.compute.c-1.us-east-2.aws.neon.tech/`
- Neon REST API: `https://ep-odd-unit-a5udqzav.apirest.us-east-2.aws.neon.tech/neondb/rest/v1`

---

## 1. Authentication & Security Headers

Every request must provide authorization and contract versioning headers:

```http
Authorization: Bearer <clerk_or_jwt_token>
Nexus-Version: 2026-10-01
Idempotency-Key: <uuid-v4> (Required for state mutations)
Content-Type: application/json
```

---

## 2. Global Response Contracts

### 2.1 Success Item Response
```json
{
  "object": "incident",
  "id": "inc_01HXY8923",
  "code": "INC-8923",
  "title": "Severe Snowstorm on I-80 Donner Pass",
  "severity": "CRITICAL",
  "status": "DETECTED",
  "affected_entity": "Vehicle NX-104",
  "created_at": 1729252800,
  "updated_at": 1729252800
}
```

### 2.2 Success Collection Response
```json
{
  "object": "list",
  "data": [
    {
      "object": "vehicle",
      "id": "veh_01HXYZ7894",
      "code": "NX-104",
      "status": "ACTIVE"
    }
  ],
  "has_more": false,
  "total_count": 1,
  "api_version": "2026-10-01",
  "request_id": "req_01HX98877665544"
}
```

### 2.3 Stripe-Standard Error Contract
```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "resource_missing",
    "message": "No vehicle found with ID 'veh_invalid_99'.",
    "param": "vehicle_id",
    "doc_url": "https://docs.nexus-logistics.io/api/errors#resource_missing"
  }
}
```

---

## 3. Endpoints Matrix

### `GET /api/v1/overview`
Retrieves aggregated network status, high-level metrics, active incidents, and vehicle counts.

### `GET /api/v1/vehicles`
- **Query Params**: `status` (ACTIVE | MAINTENANCE | INACTIVE), `limit` (int, default 20), `starting_after` (cursor ID).
- **Response**: Paginated vehicle list contract.

### `POST /api/v1/simulations/evaluate`
Executes authoritative physics and supply-chain what-if simulations.
- **Headers**: `Idempotency-Key: idemp_...`
- **Request Body**:
  ```json
  {
    "scenario_code": "I-70-BYPASS-01",
    "vehicle_id": "veh_01HXYZ7894",
    "speed_kmh": 65,
    "temperature_c": -8,
    "elevation_gain_m": 420,
    "wind_speed_kmh": 45
  }
  ```
- **Response**:
  ```json
  {
    "object": "simulation_result",
    "id": "sim_01HXY9921",
    "scenario_code": "I-70-BYPASS-01",
    "aerodynamic_drag_work_kwh": 34.2,
    "projected_battery_drain_pct": 21.8,
    "net_time_saved_mins": 135,
    "sla_breach_risk_pct": 4.2,
    "recommended": true,
    "created_at": 1729252800
  }
  ```

### `POST /api/v1/incidents/{incident_id}/resolve`
Applies an automated or dispatcher-reviewed recovery plan.
- **Headers**: `Idempotency-Key: idemp_...`
- **Request Body**:
  ```json
  {
    "resolution_type": "AUTONOMOUS_REROUTE",
    "action_notes": "Authorized South corridor diversion avoiding mountain blizzard pass."
  }
  ```
- **Response**: Returns updated Incident object and emits `DECISION_APPLIED` event over Neon Realtime WebSocket.
