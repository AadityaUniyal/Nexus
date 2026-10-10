# NEXUS System Architecture

## 1. Overview & Core Mission
NEXUS is a real-data operational intelligence platform built specifically for dispatchers and fleet managers at small and mid-size logistics providers and 3PLs. Its core mission is to close a single deterministic loop:

```
Create Job -> Assign Driver -> GPS Telemetry Stream -> Live Traffic ETA & Risk Engine
     ^                                                                |
     |------------------ One-Tap Approval <----- Suggest Fix <--------|
     v
Actual Arrival Recorded -> Empirical Accuracy Measured -> Cryptographic Audit Ledger
```

## 2. Surfaces
1. **Dispatcher Cockpit** (Web, Desktop-First):
   - MapLibre GL rendering Azure Maps Gen2 raster tiles via short-lived Microsoft Entra ID tokens (zero keys in the browser).
   - Real-time Server-Sent Events (SSE) telemetry stream (`/api/v1/stream`) with connection state tracking (`live`, `reconnecting`, `offline`).
   - Stop time windows entered in local stop IANA timezone and persisted as UTC with DST gap/overlap verification.
   - Live risk badges (`on_time`, `at_risk`, `late`, `unknown`) with labeled uncertainty margins and plain-language root causes.
   - Recommended actions (driver reassignments, stop reordering) evaluated via Azure Maps route matrices with one-tap approval.

2. **Driver Phone PWA** (Mobile Browser):
   - Instant activation via dispatcher-generated one-time signed links (`/driver#token=...`). Zero driver sign-up or app store downloads.
   - Geolocation watch stream with Screen Wake Lock API (`navigator.wakeLock.request('screen')`).
   - IndexedDB offline queue for offline resiliency and burst flushing (`POST /api/v1/driver/pings`).
   - One-tap progress buttons: **Start En Route**, **I Have Arrived**, and **Delivered / Complete**.

## 3. Technology Stack & Azure Infrastructure
- **Cloud Backbone**: Microsoft Azure for Students ($100 budget capped).
  - **Azure Maps Gen2** (`G2`, global location): Live traffic routing, route matrix, address search, tile serving.
  - **Azure Blob Storage** (`Standard_LRS`): Cold storage for daily Apache Parquet telemetry lakehouse partitions.
  - **Azure Key Vault** (Standard): Centralized secret storage with RBAC.
  - **Azure Log Analytics & Application Insights**: OpenTelemetry observability and latency metrics.
  - **User-Assigned Managed Identity**: Passwordless Entra ID authorization.
- **Backend API**: Python 3.11+ / FastAPI with asynchronous SQLAlchemy and Uvicorn.
- **Database**: PostgreSQL (Neon serverless, auto-suspend to zero compute cost) with Alembic baseline migrations.
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, TanStack Query, MapLibre GL JS, Clerk Auth.

## 4. Multi-Tenant Security & Isolation
- **Tenant Scope Enforcement**: Every database query on workspace-scoped entities (`drivers`, `jobs`, `job_stops`, `predictions`, `audit_log`) filters explicitly by verified `workspace_id`.
- **Role-Based Access Control**:
  - `owner`: Full workspace management, member invitations, preferences, and dispatch mutations.
  - `dispatcher`: Create jobs, assign drivers, approve recommendations.
  - `viewer`: Read-only access to cockpit, roster, and analytics.
- **Driver Session Isolation**: Driver PWA tokens are stored as SHA-256 hashes in `driver_sessions`. Sessions can be revoked instantly by dispatchers.

## 5. Cryptographic Audit Ledger
- State transitions (job creation, driver assignment, recommendation approval, stop arrival, manual overrides) append an immutable record to `audit_log`.
- Hash chaining algorithm:
  $$\text{hash}_n = \text{SHA-256}(\text{hash}_{n-1} \parallel \text{canonical\_json}(\text{record}_n))$$
- Tampering with any historical record invalidates subsequent hashes and is flagged immediately by `GET /api/v1/audit/verify`.
