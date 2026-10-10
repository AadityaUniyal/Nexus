# NEXUS API Reference (v1)

## Authentication
- **Dispatcher / Operator / Cockpit APIs**: Authenticated via Clerk session bearer tokens (`Authorization: Bearer <clerk_jwt>`). Tokens are validated using Clerk JWKS RS256 public keys. Every request resolves an active `RequestPrincipal` with an explicit `workspace_id`.
- **Driver PWA APIs**: Authenticated via SHA-256 hashed driver session bearer tokens (`Authorization: Bearer <driver_session_token>`).

---

## 1. Workspaces & Onboarding
- `POST /api/v1/onboarding`
  - Body: `{ "name": string, "country": string (ISO-2), "timezone": string (IANA), "locale": string, "distance_unit": "km" | "mi" }`
  - Returns: `{ "status": "created", "workspace_id": string }`
- `GET /api/v1/workspaces/current`
  - Returns current workspace preferences and distance units.
- `PATCH /api/v1/workspaces/current`
  - Body: `{ "name"?: string, "country"?: string, "timezone"?: string, "locale"?: string, "distance_unit"?: "km" | "mi" }`
- `GET /api/v1/workspaces/members`
  - Returns list of team members and their assigned roles (`owner`, `dispatcher`, `viewer`).
- `POST /api/v1/workspaces/invites`
  - Body: `{ "role": "dispatcher" | "viewer" | "owner", "expires_in_hours": number }`
  - Returns: `{ "invite_code": string, "expires_at": string }`

---

## 2. Drivers & Roster
- `GET /api/v1/drivers`
  - Returns array of active drivers in the workspace with last known lat/lon, heading, and ping timestamps.
- `POST /api/v1/drivers`
  - Body: `{ "name": string, "phone"?: string }`
  - Returns: `Driver` record.
- `POST /api/v1/drivers/{driver_id}/link`
  - Issues a single-use signed link token for driver phone browser access.
  - Returns: `{ "driver_id": string, "link_token": string, "expires_at": string }`
- `POST /api/v1/drivers/{driver_id}/revoke-session`
  - Immediately revokes all active PWA sessions for the driver.

---

## 3. Jobs & Routing
- `GET /api/v1/jobs`
  - Returns active jobs in the workspace with stops and latest live predictions.
- `POST /api/v1/jobs`
  - Body:
    ```json
    {
      "title": "Medical Batch Delivery #982",
      "driver_id": "driver-uuid-or-null",
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
    ```
- `POST /api/v1/jobs/preview-route`
  - Computes route geometry and travel time between coordinates via Azure Maps directions.

---

## 4. Driver PWA Portal
- `POST /api/v1/driver/redeem`
  - Body: `{ "link_token": string, "device_info"?: string }`
  - Returns: `{ "session_token": string, "driver": Driver }`
- `POST /api/v1/driver/duty`
  - Body: `{ "status": "on_duty" | "off_duty" }`
- `POST /api/v1/driver/pings`
  - Ingests batch of GPS telemetry points with accuracy verification and rate limiting.
  - Body:
    ```json
    {
      "pings": [
        {
          "client_ping_id": "c_ping_1",
          "lat": 42.3601,
          "lon": -71.0589,
          "heading": 90.0,
          "speed_mps": 12.5,
          "accuracy_m": 5.0,
          "recorded_at": "2026-10-15T10:00:00Z"
        }
      ]
    }
    ```
- `GET /api/v1/driver/active-job`
  - Returns currently assigned job and stop checklist.
- `POST /api/v1/driver/actions/stop`
  - Executes one-tap status mutation: `action` = `start` | `arrived` | `delivered`.

---

## 5. Live Streams & Maps
- `GET /api/v1/stream` (Server-Sent Events)
  - Stream events: `driver_ping`, `driver_status`, `prediction_updated`, `recommendation_created`, `heartbeat`.
- `GET /api/v1/maps/token`
  - Returns short-lived Azure Maps Entra ID token and client ID for MapLibre GL.
- `GET /api/v1/geo/search?query=...`
  - Global address search and autocomplete via Azure Maps search API.

---

## 6. Recommendations, Audit & Analytics
- `POST /api/v1/recommendations/{id}/approve`
  - One-tap approval applying suggested driver reassignment or stop reordering.
- `GET /api/v1/analytics`
  - Returns verified on-time rates, median absolute ETA error, prediction bias, precision, and recall from completed jobs.
- `GET /api/v1/audit`
  - Paginated append-only cryptographic audit records.
- `GET /api/v1/audit/verify`
  - Verifies cryptographic SHA-256 hash chaining across the workspace ledger.
