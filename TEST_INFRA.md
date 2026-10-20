# NEXUS Platform — Test Infrastructure Specification (TEST_INFRA.md)

## 1. Overview & Architecture
The NEXUS test infrastructure provides an opaque-box, dual-track verification framework designed to validate every layer of the platform without facade mocks or fabricated test results. The suite operates across both Python backend services and TypeScript frontend reactive clients, enforcing Apple Human Interface Guidelines (HIG), bidirectional real-time synchronization, and zero-mock transactional persistence.

```
+-------------------------------------------------------------------------------+
|                             NEXUS TEST SUITE                                  |
+---------------------------------------+---------------------------------------+
|        Backend E2E Suite              |         Frontend Test Harness         |
|  `backend/tests/test_e2e_platform_    |     `frontend/lib/e2e-suite.test.ts`  |
|              suite.py`                |                                       |
|  - Framework: pytest + pytest-asyncio |  - Framework: Node.js node:test + tsx |
|  - Engine: SQLAlchemy 2.0 AsyncIO     |  - Verification: Strict assertions    |
|  - Database: In-memory SQLite         |  - Typecheck: tsc --noEmit (0 errors) |
|    (Full 58-table schema parity)      |  - Event Pipeline: Reactive EventBus  |
|  - Transport: httpx.AsyncClient       |    & Realtime SSE Pulse Ingestion     |
|  - Scope: Tiers 1-4                   |  - Scope: Client Tiers 1-4            |
+---------------------------------------+---------------------------------------+
```

---

## 2. Test Hierarchy & Tier Classification

| Tier | Name | Focus | Key Coverage Areas |
|:---:|:---|:---|:---|
| **Tier 1** | **Feature Coverage** | 20 individual features in isolation | All 20 features from `PROJECT.md` Feature Inventory (F1–F20): Navigation, Intelligence tab, ML Analytics tab keys, Apple HIG typography/squircles/glassmorphism/springs, multi-tenant SSE scoping, dock geofence pipeline, outbox worker, realtime client expansion, reactive UI subscriptions, map entity selection, simulation decision application, zero-mock DB persistence, circuit breakers, offline mutation buffer, status check tooling, E2E suite, adversarial hardening. |
| **Tier 2** | **Boundary & Corner Cases** | Extreme values, faults, and edge limits | Empty payloads, malformed JSON, latitude/longitude bounds (`[-90, 90]`, `[-180, 180]`), polar extremes, Null Island (`0,0`), 429 rate limit triggers with Retry-After headers, exponential backoff, circuit breaker trip boundaries (`CLOSED` -> `OPEN` -> `HALF_OPEN` -> `CLOSED`), rapid SSE subscriber churn, subscriber disconnection memory cleanup. |
| **Tier 3** | **Cross-Feature Interactions** | Pairwise module dynamics | Map pin selection ↔ Cupertino slide-over Drawer sync; Trip dispatch ↔ Dock dwell clock accrual; Telemetry GPS packet ingestion ↔ Live map marker updates & SSE pulse emission; Simulation decision application ↔ Incident state mutation & Route rerouting. |
| **Tier 4** | **Real-World Workloads** | Full operational trip lifecycle | Convoy dispatch (Chicago Hub to Dallas Gateway Depot) across intermediate waypoints, corridor adverse weather hazard incident, stochastic AI simulation reroute evaluation, decision application, dock geofence arrival, dwell accrual past 120m free window, demurrage calculation, digital Proof of Delivery (ePOD) touchscreen signature upload, and order/vehicle completion. |
| **Tier 5** | **Adversarial Hardening** | Forensic security & integrity | Multi-tenant event isolation (zero event leakage across workspaces), non-retriable client error fast-fail (400/401/403/404/422), and zero mock fallbacks on mutation failure. |

---

## 3. Test Environments & Frameworks

### 3.1 Backend Test Environment
- **Test Runner**: `pytest` 8.3.x with `pytest-asyncio` plugin (strict async mode).
- **HTTP Client**: `httpx.AsyncClient` with `ASGITransport` targeting FastAPI `app`.
- **Database Engine**: SQLAlchemy 2.0 AsyncIO with `sqlite+aiosqlite:///:memory:`.
  - Full relational schema initialized via `Base.metadata.create_all`.
  - Enforces foreign keys, cascade constraints, JSON column serialization, and timestamp tracking.
- **Dependency Overrides**:
  - `get_db`: Injects isolated transaction sessions per test.
  - `require_workspace`, `require_onboarded`, `require_authenticated`: Injects authorized `RequestPrincipal` with tenant scoping.

### 3.2 Frontend Test Environment
- **Test Runner**: Node.js v22 built-in `node:test` executed via `tsx` (`frontend/node_modules/.bin/tsx --test`).
- **Assertions**: `node:assert/strict`.
- **Static Analysis**: TypeScript Compiler (`tsc --noEmit`) via `npm run typecheck --prefix frontend`.
- **Scope**: Reactive event bus pub/sub, SSE pulse ingestion, offline mutation retry buffer, and Apple HIG token contracts.

---

## 4. Database Fixtures & Zero-Mock Invariant
In accordance with Project Integrity guidelines, all database operations execute against live database engines (in-memory SQLite for test isolation, Neon PostgreSQL for production/staging):
1. **Zero Mock Fallbacks**: Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) write actual relational rows to tables. If database operations fail, routes throw explicit HTTP errors rather than returning mock success payloads.
2. **Transactional Isolation**: Each test operates within an isolated session or in-memory engine, preventing cross-test data pollution.
3. **Outbox Integrity**: Every state change publishes an `EventOutbox` entry for downstream processing.

---

## 5. Verification Commands

To run all automated verification gates:

```powershell
# 1. Backend E2E Test Suite (Tiers 1-4)
python -m pytest backend/tests -q

# 2. Frontend Typecheck Verification Gate
npm run typecheck --prefix frontend

# 3. Frontend Client E2E Suite (Node.js test runner)
frontend/node_modules/.bin/tsx --test frontend/lib/e2e-suite.test.ts
```
