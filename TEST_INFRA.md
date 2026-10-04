# Nexus Logistics Platform — E2E Test Infrastructure (`TEST_INFRA.md`)

## 1. Architectural Overview

The Nexus End-to-End (E2E) testing framework implements a 4-tier opaque-box test suite targeting the FastAPI ASGI application directly via `httpx.AsyncClient` and `httpx.ASGITransport`. The tests interact strictly across public HTTP interface boundaries—exercising real request parsing, Pydantic validation, authentication middleware, dependency injection, state-machine transitions, rate limiting, and database transactions without facade mocks.

```
+-----------------------------------------------------------------------------------+
|                            4-Tier E2E Test Suite                                  |
+---------------------+---------------------+-------------------+-------------------+
| Tier 1: Feature     | Tier 2: Boundary &  | Tier 3: Cross-    | Tier 4: Real-     |
| Coverage (>=5/area) | Corner Cases        | Feature Flows     | World Scenarios   |
| - Health (6)        | - Empty bodies (7)  | - Auth -> Inc ->  | - Operator        |
| - Clerk Auth (6)    | - Invalid JWTs (6)  |   Sim -> Telem (1)|   Emergency       |
| - Fleet & Ops (7)   | - Query bounds (6)  | - State audit (1) |   Reroute (1)     |
| - Incidents (6)     | - 404 & errors (8)  | - Auto-discovery  | - Webhook stream  |
| - Simulations (6)   | - Rate limiter (2)  |   telematics (1)  |   ingestion (1)   |
| - Azure Integr. (6) |                     | - Multi-tenant    | - CSV Import (1)  |
|                     |                     |   isolation (1)   | - Concurrent (1)  |
|                     |                     | - Outbox audit (1)|                   |
+---------------------+---------------------+-------------------+-------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     FastAPI ASGI Application Engine (`app.main:app`)               |
| - CORS & OWASP Headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-Request-ID`) |
| - Clerk JWT & Workspace Context (`get_current_principal`, `verify_clerk_token`)     |
| - Sliding Window Rate Limiter (`RateLimitMiddleware`)                             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       In-Memory SQLite Multi-Tenant Database                      |
| - SQLAlchemy Async Engine (`sqlite+aiosqlite:///:memory:`)                        |
| - Complete Schema Generated (`Base.metadata.create_all`)                          |
| - Seeded baseline: 2 Orgs, 2 Workspaces, Admin/Viewer Users, Hubs, Routes, Trucks  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Test Infrastructure Components

### 2.1 Directory Layout
```
tests/e2e/
├── __init__.py                    # E2E package definition
├── conftest.py                    # Test configuration, in-memory DB, token factory, clients
├── test_tier1_features.py         # Tier 1: 37 core feature coverage tests
├── test_tier2_boundaries.py       # Tier 2: 29 boundary, corner case, and rate limit tests
├── test_tier3_interactions.py     # Tier 3: 5 cross-feature workflow and isolation tests
├── test_tier4_scenarios.py        # Tier 4: 4 real-world operational scenarios
└── runner.py                      # Standalone CLI test runner
```

### 2.2 Data Layer & Database Isolation
- **Engine**: SQLite asynchronous in-memory engine via `aiosqlite`.
- **Scope**: Every test execution runs with an isolated database session and transaction (`scope="function"`), ensuring zero inter-test coupling or state pollution.
- **Seeded Baselines**:
  - Organizations: `org-nexus-demo`, `org-alt-demo`
  - Workspaces: `ws-continental-fleet-01`, `ws-alt-workspace-02`
  - Users: `usr-test-101` (Lead Administrator), `usr-test-viewer` (Viewer)
  - Logistics Hubs: `wh-chi-01` (Chicago Logistics Hub), `wh-den-01` (Denver Central Depot)
  - Active Corridor: `rt-den-chi` (I-80 Continental Corridor, 1620 km)
  - Primary Fleet Vehicle: `v-104` (Freightliner eCascadia #104, code `NX-104`)

### 2.3 Authentication & Clerk JWT Emulation
- **Factory**: `token_factory` dynamically signs authentic RS256/HS256 tokens using the backend application's `settings.SECRET_KEY` and algorithm.
- **Claims Verified**: `sub`, `email`, `role`, `workspace_id`, `organization_id`, and `exp`.
- **Validation**: Authenticated endpoints execute real token decoding and user resolution via `verify_clerk_token` and `get_current_principal`.

### 2.4 Rate Limiting & Telemetry Dampening
- **Limiter Reset**: `reset_rate_limiter` fixture clears the sliding-window request cache before each test to prevent test rate limit spillovers.
- **OpenTelemetry Guard**: Azure Monitor OpenTelemetry background metric exporters are disabled in the test harness (`os.environ["AZURE_MONITOR_ENABLED"] = "false"`), preventing `ValueError: I/O operation on closed file` stream errors on test completion.

---

## 3. Test Execution Commands

### 3.1 Using Standalone Runner
```bash
# Execute entire 4-tier E2E suite
python tests/e2e/runner.py

# Execute specific tier
python tests/e2e/runner.py --tier 1
python tests/e2e/runner.py --tier 2
python tests/e2e/runner.py --tier 3
python tests/e2e/runner.py --tier 4

# Run with verbose test-level logging
python tests/e2e/runner.py --verbose
```

### 3.2 Using Standard Pytest CLI
```bash
# Run all E2E tests
python -m pytest tests/e2e -v

# Run individual tier files
python -m pytest tests/e2e/test_tier1_features.py
python -m pytest tests/e2e/test_tier2_boundaries.py
python -m pytest tests/e2e/test_tier3_interactions.py
python -m pytest tests/e2e/test_tier4_scenarios.py
```
