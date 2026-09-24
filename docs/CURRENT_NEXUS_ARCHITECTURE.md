# Current Nexus Architecture Document (Phase 0 Audit)

## 1. Repository Overview & Topology
Nexus is structured as a full-stack mono-repository featuring:
- **`backend/`**: A high-performance Python 3.13 / FastAPI application using SQLAlchemy 2.0 AsyncIO with PostgreSQL, Pydantic v2 schemas, Alembic database migrations, and an SSE/WebSocket realtime event broadcaster.
- **`frontend/`**: A Next.js 15 (App Router) / React 19 application with TypeScript, Tailwind CSS, Lucide icons, Three.js (`NexusWorld`), Leaflet (`NexusMap`), motion animations, and dark/light tactile spatial theme.
- **`database/`**: SQL schema initialization and baseline configurations.
- **`infra/`**: Infrastructure as Code templates targeting Azure (Bicep).
- **`docs/`**: Architecture diagrams, API specs, and deployment documentation.

---

## 2. Identified Hardcoded Data & Mock Fallbacks

| Category | Source File | Hardcoded / Mock Artifact | Remediation Plan |
|---|---|---|---|
| **Vehicles & Drivers** | `frontend/lib/mock-data.ts`, `backend/app/db/seed.py` | Static vehicles (`NX-104`, `NX-109`) and drivers (`Marcus Vance`, `Elena Rostova`) | Expand `Vehicle` & `Driver` tables; remove in-memory mock items. |
| **Operational Fixtures** | `backend/app/api/v1/endpoints/operations.py` | `INITIAL_WAREHOUSES`, `INITIAL_ROUTES`, `INITIAL_ORDERS` fixture arrays in API endpoint code | Enforce queries strictly against PostgreSQL scoped to user's authenticated tenant workspace. |
| **Frontend Provider** | `frontend/lib/data-provider.ts` | `MockNexusDataProvider` class with static responses | Deprecate in-memory mock fallback; route all calls through `ApiNexusDataProvider` against real backend APIs. |
| **Workspace Tenant ID** | `backend/app/api/v1/endpoints/*.py` | `ws = workspace_id or "ws-continental-fleet-01"` | Eliminate fallback query param. Derive `workspace_id` strictly from authenticated user's session. |
| **Incident Coordinates** | `frontend/app/(app)/live-world/page.tsx` | Fixed fallback coordinates `lat: 41.2565, lng: -95.9345` | Add `lat`, `lng` columns to `Incident` model. |
| **Simulated Metrics** | `frontend/lib/data-provider.ts` | Hardcoded fallback metric numbers (`1620.0 km`, `180 mins delay`, `88% risk`) | Persist metrics dynamically in `Simulation` and `Decision` records. |

---

## 3. Current Database Models Audit (`backend/app/models/`)

### Currently Implemented Models
- **`Workspace`**: Tenant workspace record (`name`, `slug`, `type`, `region`, `timezone`, `scale`, `is_demo`).
- **`User`**: User profile (`email`, `name`, `role`, `department`, `clerk_user_id`, `workspace_id`).
- **`WorkspaceMembership`**: Many-to-many relationship between users and workspaces.
- **`AvatarPreferences`**, **`Invitation`**: UI personalization and invitation tokens.
- **`Warehouse`**: Logistics nodes (`code`, `name`, `lat`, `lng`, `capacity_units`, `dock_count`).
- **`Vehicle`**: Commercial haulers (`code`, `name`, `model`, `driver_name`, `lat`, `lng`, `battery_pct`).
- **`Route`**: Logistics corridors between warehouses with distance and duration.
- **`Order`**: Cargo shipments with customer name, priority, and destination.
- **`Incident` & `IncidentTimeline`**: Disruption incidents linked to vehicles or routes.
- **`Simulation` & `Decision`**: Evaluated scenarios with baseline and simulated KPI metrics.
- **`Notification`**, **`AuditLog`**, **`PipelineHealth`**, **`OperationalEvent`**, **`EventOutbox`**, **`AIInsight`**, **`Integration`**.

### Missing Domain Models Required for Real-World SaaS
1. **Identity & Multi-Tenancy**: `Organization`, `OrganizationMembership`, `SubscriptionPlan`.
2. **Fleet Hierarchy**: `VehicleType`, `VehicleDevice` (IoT/telematics pairing), `Driver` (duty status, license, contact), `DriverVehicleAssignment`.
3. **Logistics**: `Customer` (SLA tiers), `Trip` (operational execution unit), `Stop` (ordered corridor stops), `Shipment`.
4. **Operations**: `TelemetryEvent` (time-series stream), `VehicleStatus` (latest state cache), `Alert`, `RiskAssessment`.
5. **AI Copilot & Governance**: `Conversation`, `ChatMessage`, `AgentRun`, `ToolCallRecord`, `Approval` (human-in-the-loop), `ActionExecution`.
6. **Integrations**: `IntegrationCredentialReference`, `WebhookEndpoint`, `SyncJob`.

---

## 4. Current API Endpoints & Gaps

### Implemented Endpoints
- `/api/v1/auth/*`: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`.
- `/api/v1/operations/*`: `/warehouses`, `/vehicles`, `/routes`, `/orders`.
- `/api/v1/incidents/*`: List, detail, create, transition status.
- `/api/v1/simulations/*`: List, detail, create, apply decision.
- `/api/v1/realtime/*`: SSE stream `/stream`.
- `/api/v1/admin/*`, `/api/v1/analytics/*`, `/api/v1/location/*`.

### Required New Real-World SaaS Endpoints
- `POST /api/v1/telemetry`: High-throughput telemetry ingestion.
- `POST /api/v1/webhooks/{provider}`: External telematics webhooks (Samsara, Geotab, IoT Hub).
- `POST /api/v1/import/preview` & `POST /api/v1/import/execute`: Multi-format data import (CSV/JSON/REST).
- `GET/POST /api/v1/organizations/*`: Organization onboarding, memberships, and billing.
- `POST /api/v1/copilot/chat`: Controlled AI tool execution with human-in-the-loop approvals.
- `GET/POST /api/v1/governance/approvals`: Approval request lifecycle.

---

## 5. Current Authentication & Tenant Security Audit
- **Authentication**: Supports JWT Bearer tokens decoded with local `SECRET_KEY` or verified against Clerk JWKS or Microsoft Entra ID.
- **Vulnerability**: Endpoints currently accept `workspace_id` from client queries or default to `"ws-continental-fleet-01"`. Any user can query another workspace by altering the query parameter.
- **Remediation**: The backend must strictly extract the user's active `organization_id` and `workspace_id` from the verified session claims in `get_current_principal()`.

---

## 6. Simulation & AI Reasoning Dependencies
- **Simulation Engine (`app/services/simulation_engine.py`)**: Computes detour distances, road speed delays, driver rest requirements, energy consumption, and SLA probability.
- **Current Limitation**: Simulations currently rely on pre-seeded vehicles and corridors.
- **Transformation**: Enable the simulation engine to operate on real imported trips, real weather obstacles, and real live vehicle coordinates.

---

## 7. Reusable High-Value Components
- **`NexusWorld.tsx`**: Three.js WebGL 3D globe visualization of hubs, vehicles, routes, and incidents.
- **`NexusMap.tsx`**: High-detail 2D GIS map with interactive vehicle tracking and incident pins.
- **`AppShell.tsx` & Design System**: Responsive, accessible navigation, header, quick actions, and status indicators.
- **`LocationService`**: Geocoding and route calculation adapters with Geoapify integration.
- **`EventBroadcaster`**: Low-latency Server-Sent Events architecture ready for real-time telemetry streaming.
