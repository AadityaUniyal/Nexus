# Project: Nexus Logistics Platform — Apple HIG & Operational Sync

## Architecture
- **Frontend Stack**: Next.js 15.5.24 (App Router), React 18.3.1, Motion 12.4.7 (continuous spring physics, `layoutId`), Tailwind CSS 3.4.17, Zustand 5.0.3, Leaflet 1.9.4 / MapLibre GL 4.7.1, Lucide React.
- **Backend Stack**: FastAPI, Python 3.13, SQLAlchemy 2.0 AsyncIO with asyncpg, Neon Serverless PostgreSQL (58 migrated tables), SSE EventBroadcaster (`/api/v1/realtime/stream`), in-memory task queue & outbox worker.
- **Real-Time Data Flow**: Client mutations (HTTP POST/PUT/PATCH/DELETE) -> PostgreSQL transaction commit -> `broadcaster.broadcast(event, payload, workspace_id)` -> SSE EventSource stream -> `realtime-client.ts` -> `eventBus.publish()` -> Reactive component subscribers (`Overview`, `LiveMap`, `Fleet`, `DetentionRadar`).
- **Shared Interfaces**:
  - `NexusPulseItem` & `EventBus` topics for UI reactivity.
  - REST API contracts under `/api/v1/*` with tenant headers (`X-Workspace-ID`).
  - Leaflet `onEntitySelect` / `flyTo` camera and Cupertino slide-over `Drawer` synchronization.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Primary Navigation Architecture | Add "Live Map" (`/live-world`) and "Dock Detention Intelligence" (`/intelligence`) to desktop `Sidebar.tsx`. | M1 | Survey (Explorer 1) |
| 2 | Dedicated Intelligence Tab | Replace redirect stub in `/intelligence/page.tsx` with dedicated view mounting `TransporterIntelligenceCard` & dock radar. | M1 | Survey (Explorer 1) |
| 3 | ML Analytics Tab Navigation | Fix duplicate `"overview"` IDs in `/analytics/page.tsx` to expose Forecast, Anomalies, and Medallion views. | M1 | Survey (Explorer 1) |
| 4 | Apple HIG Typography Token Cascade | Configure authentic Apple SF Pro system font stack across layout and Tailwind with tabular figures. | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Hairline Borders & Glassmorphism | Enforce hairline borders (`border-black/[0.08]` / `border-white/[0.12]`), `backdrop-blur-3xl`, and Apple squircles (`rounded-[24px]`/`[28px]`). | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Continuous Spring Physics & Morphing | Apply Apple spring physics (`stiffness: ~260, damping: ~28`), `layoutId="activeNavIndicator"` pill morphing, and zero-shift page transitions. | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Micro-Interactions & Skeletons | Enhance tactile clicks, specular sweep skeleton loading, and smooth state updates without resets. | M1 | ORIGINAL_REQUEST §R1 |
| 8 | Multi-Tenant Scoped SSE Broadcasting | Update all backend `broadcast()` calls (`operations`, `trips`, `incidents`, `simulations`) with explicit `workspace_id`. | M2 | Survey (Explorer 2) |
| 9 | Proactive Dock Detention Pipeline | Integrate warehouse geofence checking into `telemetry_service.py` emitting `DOCK_ARRIVAL_DETECTED`, `DOCK_DWELL_WARNING`, `DETENTION_ACCRUING`. | M2 | Survey (Explorer 2) |
| 10 | Background Outbox Worker Activation | Start `run_worker_loop()` in `backend/app/main.py:lifespan` to process `EventOutbox` into notifications. | M2 | Survey (Explorer 2) |
| 11 | Frontend Realtime Client Expansion | Map all operational SSE events (`VEHICLE_TELEMETRY_UPDATED`, `TRIP_DISPATCHED`, `ORDER_UPDATED`, dwell alerts) to pulse items and `eventBus`. | M2 | Survey (Explorer 2) |
| 12 | Reactive UI Component Subscriptions | Subscribe `Overview`, `LiveMap`, `Fleet`, and `DetentionRadar` to `eventBus` topics to update state without page reload. | M2 | ORIGINAL_REQUEST §R2 |
| 13 | Live Map Selection & Inspector Sheet Sync | Add `onEntitySelect` to `LeafletWorldMap`, wire camera `flyTo`, and synchronize drilldown with Cupertino spring slide-over `Drawer`. | M2 | ORIGINAL_REQUEST §R2 |
| 14 | Simulation Live Decision Application | Allow applying simulation decisions to live dispatch routes/vehicles with `DECISION_APPLIED` event emission. | M2 | Survey (Explorer 2) |
| 15 | Zero-Mock Mutation Verification | Ensure all create/update/patch routes persist to PostgreSQL without mock fallbacks. | M3 | ORIGINAL_REQUEST §R3 |
| 16 | External Service Circuit Breakers | Wire `geo_circuit`, `weather_circuit`, and `ai_circuit` into API integration callers. | M3 | Survey (Explorer 3) |
| 17 | Client-Side Offline Mutation Buffer | Implement non-blocking retry queue in `frontend/lib/data-provider.ts` for network resilience and 429 recovery. | M3 | ORIGINAL_REQUEST §R3 |
| 18 | Status Tooling Alignment | Fix dictionary parsing format in `backend/check_status.py`. | M3 | Survey (Explorer 3) |
| 19 | Opaque-Box E2E Test Suite (Tiers 1-4) | Comprehensive requirement-driven test suite with >=11*N tests and published `TEST_READY.md`. | M4 | Project Pattern |
| 20 | Adversarial Hardening (Tier 5) | White-box adversarial testing and forensic audit integrity verification. | M4 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Apple HIG & Fluid Motion Ecosystem | Navigation tabs, dedicated `/intelligence` view, `/analytics` tab fix, SF Pro typography, hairline borders, `backdrop-blur-3xl`, squircles (`rounded-[24px]`/`[28px]`), continuous spring physics (`stiffness: ~260, damping: ~28`), `layoutId` pill morphing, tactile states. | None | DONE |
| M2 | Bidirectional Inter-Feature Wiring & Real-Time Sync | Scoped SSE broadcasting, proactive dock detention events, outbox worker, frontend `realtime-client` event expansion, component `eventBus` reactive subscriptions, Leaflet `onEntitySelect`, camera `flyTo`, synchronized Cupertino slide-over `Drawer`. | M1 | DONE |
| M3 | Cloud Persistence, Resilience & Verification Gates | Zero-mock mutation persistence verification, circuit breaker wiring, client offline retry queue, `check_status.py` fix, validation against both verification gates. | M2 | DONE |
| M4 | Comprehensive E2E Verification & Hardening | Dual-track E2E test suite (Tiers 1-4), adversarial stress tests (Tier 5), forensic integrity audit, final gate verification. | M3 | DONE |

## Interface Contracts
### LeafletWorldMap ↔ Dashboard & Inspector Sheet
```typescript
interface LeafletWorldMapProps {
  centerLocation?: { lat: number; lng: number };
  vehicles: Vehicle[];
  warehouses: Warehouse[];
  incidents: Incident[];
  selectedEntity?: { type: "VEHICLE" | "WAREHOUSE" | "INCIDENT"; id: string } | null;
  onEntitySelect?: (entity: { type: "VEHICLE" | "WAREHOUSE" | "INCIDENT"; id: string; data: any } | null) => void;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  className?: string;
  isSimulationMode?: boolean;
}
```

### EventBroadcaster ↔ Realtime Client ↔ EventBus
```typescript
// SSE Event Format:
// data: {"type": "VEHICLE_TELEMETRY_UPDATED", "payload": {...}, "workspace_id": "ws-123"}
type NexusEventType =
  | "VEHICLE_TELEMETRY_UPDATED"
  | "VEHICLE_UPDATED"
  | "TRIP_CREATED"
  | "TRIP_DISPATCHED"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_DELETED"
  | "DOCK_ARRIVAL_DETECTED"
  | "DOCK_DWELL_WARNING"
  | "DETENTION_ACCRUING"
  | "PROOF_OF_DELIVERY_SUBMITTED"
  | "INCIDENT_CREATED"
  | "INCIDENT_STATUS_CHANGED"
  | "SIMULATION_EVALUATED"
  | "DECISION_APPLIED";
```

## Code Layout
- `frontend/app/(app)/`:
  - `overview/page.tsx` — Command Overview
  - `live-world/page.tsx` — Live Map & Spatial Tracking
  - `operations/` — Operations & Fleet (vehicles, hubs, routes, orders)
  - `intelligence/page.tsx` — Dedicated Dock Detention Intelligence
  - `analytics/page.tsx` — ML Analytics (Forecasting, Anomalies, Medallion)
  - `settings/page.tsx` — System Settings
- `frontend/components/`:
  - `layout/Sidebar.tsx`, `Navbar.tsx`, `AppShell.tsx` — Navigation & Apple HIG Shell
  - `map/LeafletWorldMap.tsx` — Interactive Leaflet tracking map
  - `intelligence/TransporterIntelligenceCard.tsx` — Dock Detention Radar
  - `ui/drawer.tsx`, `dialog.tsx`, `tabs.tsx` — Cupertino spring sheets & modals
- `frontend/lib/`:
  - `realtime-client.ts` — SSE receiver & pulse manager
  - `event-bus.ts` — In-memory reactive event loop
  - `data-provider.ts` — REST API data layer with zero mock fallbacks & offline queue
- `backend/app/`:
  - `main.py` — Lifespan and server configuration
  - `api/v1/endpoints/` — REST & SSE endpoints (`realtime.py`, `operations.py`, `trips.py`, etc.)
  - `realtime/sse.py` — Multi-tenant `EventBroadcaster`
  - `services/telemetry_service.py` & `detention_service.py` — Ingestion & detention pipeline
  - `core/resilience.py` — Circuit breakers
  - `workers/worker.py` — Transactional outbox processor
