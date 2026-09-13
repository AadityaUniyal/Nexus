# 📑 NEXUS REST API Specification

All API endpoints are prefixed with `/api/v1` and return standardized JSON responses.

---

## 📌 Health & System Endpoints

### `GET /health/live`
Returns liveness status.
```json
{
  "status": "LIVE",
  "timestamp": 1726248900.0
}
```

### `GET /health/ready`
Returns readiness status of database and external integrations.
```json
{
  "status": "READY",
  "database": "CONNECTED",
  "redis": "CONFIGURED",
  "timestamp": 1726248900.0
}
```

---

## 🗺️ Operational & Simulation Endpoints

### `GET /api/v1/overview`
Retrieves aggregated network telemetry and active incidents.

### `POST /api/v1/simulations/evaluate`
Authoritative backend physics evaluation endpoint.
- **Request Body**: `SimulationEvaluateRequest`
- **Response**: `SimulatedMetricsOutput` (aerodynamic drag work, SLA breach risk %, Pareto recommendation score).

---

## 🔒 Authentication & Rate Limiting

- **Bearer Token**: `Authorization: Bearer <clerk_jwt_token>`
- **Rate Limits**:
  - `standard`: 120 req / minute
  - `simulation`: 40 req / minute
  - `telemetry`: 300 req / minute
