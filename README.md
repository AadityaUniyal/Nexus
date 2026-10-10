# 🌐 NEXUS: Real-Time Fleet Risk Preemption

> **Predictive ETA & Risk Preemption Engine for Modern Fleets**  
> *Non-commercial student rebuild running exclusively on real driver GPS and Azure Maps live traffic telemetry.*

---

## 🎯 Job to be Done

Dispatchers and ops managers at small and mid-size fleets and 3PLs usually learn a delivery is late only after it is late. **NEXUS tells them which jobs will miss their time window before it happens**, using real driver GPS and live traffic. It computes actionable fixes, enables one-tap dispatch approvals, and empirically verifies prediction accuracy once jobs complete.

### The Closed Decision Loop
```
create job ──> assign driver ──> GPS stream (PWA) ──> live traffic ETA ──> risk flagged
      │                                                                           │
      └── empirical accuracy <── actual arrival recorded <── 1-tap fix approval <───┘
```

---

## 🏗️ Architecture & Surfaces

NEXUS is purposefully stripped of demo bloat and mock data. It consists of two dedicated surfaces:

1. **Dispatcher Cockpit (Web / Desktop-First)**:
   - Global interactive MapLibre GL map powered by Azure Maps Gen2 raster tiles via short-lived Entra ID bearer tokens (zero client account keys).
   - Real-time Server-Sent Events (SSE) stream for live driver positions, heading, and stale state fading.
   - Job creation modal with global address autocomplete and live route geometry preview.
   - 1-tap risk resolution (reassign to nearest driver / reorder stops) powered by Azure Maps Route Matrix.
   - Cryptographic SHA-256 hash-chained audit verification log.
   - Sample-size guarded empirical prediction accuracy dashboard ($N \ge 5$).

2. **Driver PWA (Mobile Phone Browser / Zero Hardware)**:
   - Secure no-signup one-time magic link access.
   - Screen Wake Lock API to prevent GPS suspension while foregrounded.
   - Background IndexedDB offline queue for network drop tolerance (`idb`).
   - One-tap operational status changes: *Duty Toggle*, *Start Route*, *Arrived at Stop*, *Delivered*.

---

## 🛡️ Non-Negotiables & Guarantees

- **Zero Mock / Fake Data**: No mock fixtures, no silent fallbacks, no `Math.random` telemetry in product code. If data is absent, the system renders an honest empty or error state.
- **Strict Multi-Tenancy**: Every database query is strictly scoped by verified `workspace_id`. Cross-tenant data leakage is cryptographically and logically prohibited.
- **Deterministic ETA & Risk Engine**:
  - `on_time`: $\text{ETA} + \text{Margin} \le \text{Window End}$
  - `at_risk`: $\text{ETA} - \text{Margin} \le \text{Window End} < \text{ETA} + \text{Margin}$
  - `late`: $\text{ETA} - \text{Margin} > \text{Window End}$
  - `unknown`: No driver GPS ping within 300 seconds, or provider usage cap reached.
- **Azure for Students Cost Control**: Built strictly within the $100 student credit budget utilizing consumption-based Gen2 Azure Maps, Key Vault, Log Analytics, Blob Storage, and automated budget alert thresholds at $50 and $80.

---

## 📦 Project Structure

```
.
├── backend/                  # FastAPI 0.115+ async Python backend
│   ├── app/
│   │   ├── api/v1/           # Modular REST API endpoints
│   │   ├── auth/             # Clerk JWKS RS256 + Driver token hashing
│   │   ├── core/             # Config, time utils (DST fold), rate limiting
│   │   ├── db/               # Async SQLAlchemy + Alembic migrations
│   │   ├── integrations/     # Azure Maps Gen2 Entra ID client
│   │   ├── models/           # Workspaces, Drivers, Jobs, Audit, DailyUsage
│   │   ├── services/         # ETA engine, Recommendations, Audit, Analytics
│   │   └── main.py           # Sole backend entrypoint with OWASP headers
│   └── tests/                # 13 comprehensive pytest test suites
├── frontend/                 # Next.js 14 App Router TypeScript frontend
│   ├── app/
│   │   ├── (app)/            # Dispatcher cockpit, Drivers, Analytics, Settings
│   │   ├── (onboarding)/     # Intl-based workspace setup
│   │   └── driver/           # Mobile Driver PWA with Wake Lock
│   ├── components/map/       # MapLibre GL + Azure Maps tile layer
│   └── lib/                  # Typed API client, driver IndexedDB store
├── infra/                    # Declarative Azure Bicep infrastructure
│   ├── main.bicep            # Resource Group & Module orchestration
│   └── modules/resources.bicep # Azure Maps, Key Vault, Storage, App Insights
└── docs/                     # Full technical documentation
    ├── ARCHITECTURE.md       # Multi-tenant and security architecture
    ├── API.md                # OpenAPI / REST endpoint specifications
    ├── DEPLOYMENT.md         # Deployment runbook (Azure, GHCR, Vercel)
    ├── ANALYTICS.md          # Prediction accuracy and Parquet schema
    └── ADR/                  # Architectural Decision Records (ADX evaluation)
```

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run tests
pytest backend/tests -v

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Verify type safety and linting
npm run typecheck
npm run lint

# Start Next.js development server
npm run dev
```

---

## 📜 License
Non-commercial educational project built on Azure for Students. Released under the MIT License.
