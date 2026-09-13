<div align="center">

# 🌐 NEXUS — Autonomous Logistics & Spatial Intelligence Command

### *Enterprise What-If Simulation Platform · 3D Spatial Vector GIS · Real-Time Telemetry Stream Watchdog*

[![Build Status](https://img.shields.io/badge/build-passing-00e599.svg?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/AadityaUniyal/Nexus)
[![Backend Tests](https://img.shields.io/badge/pytest-20%2F20%20passed-success.svg?style=for-the-badge&logo=python&logoColor=white)](backend/tests)
[![Next.js 15](https://img.shields.io/badge/next.js-v15.1%20(60%2B%20routes)-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](frontend)
[![FastAPI](https://img.shields.io/badge/fastapi-v0.115%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](backend)
[![Database](https://img.shields.io/badge/database-Neon%20Cloud%20PostgreSQL-00e599.svg?style=for-the-badge&logo=postgresql&logoColor=white)](database)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

[**Architecture Blueprint**](docs/ARCHITECTURE.md) • [**API Reference**](docs/API_SPECIFICATION.md) • [**Deployment Guide**](docs/DEPLOYMENT.md) • [**Quickstart**](#-quickstart--local-development)

</div>

---

## 📑 Table of Contents
- [🏛️ System Architecture](#-system-architecture)
- [✨ Core Capabilities & Feature Highlights](#-core-capabilities--feature-highlights)
- [🧮 Deterministic Simulation Physics Engine](#-deterministic-simulation-physics-engine)
- [📂 Repository Structure](#-repository-structure)
- [🔑 Environment Setup](#-environment-setup)
- [🚀 Quickstart & Local Development](#-quickstart--local-development)
- [🐳 Docker Container Orchestration](#-docker-container-orchestration)
- [🌐 Vercel & Production Deployment](#-vercel--production-deployment)
- [🛡️ Security & Governance](#-security--governance)

---

## 🏛️ System Architecture

NEXUS is engineered as a zero-downtime, sub-second 4-tier monorepo designed for high-tempo freight dispatching, hazard monitoring, and deterministic What-If simulation modeling:

```
                                ┌────────────────────────────────────────────────────────┐
                                │                   OPERATOR / DISPATCHER                │
                                │            Tactile Command HUD · 3D Spatial GIS        │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ (HTTPS / WSS / SSE)
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │             NEXT.JS 15 FRONTEND (APP ROUTER)           │
                                │ • 60+ Production App Routes                            │
                                │ • MapLibre GL 3D Vector GIS & Meteorological Overlays  │
                                │ • Resilient Data Provider (`lib/data-provider.ts`)     │
                                │ • Real-Time SSE Stream Watchdog & Auto-Reconnect       │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ (REST / WebSockets / SSE)
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │             FASTAPI ASYNCHRONOUS BACKEND               │
                                │ • Geoapify Multi-Tier Geocoding & Routing Cache        │
                                │ • Open-Meteo Road Weather & Blizzard Hazard Engine     │
                                │ • Aerodynamic Physics & SLA Probability Engine         │
                                │ • Sliding Window Rate Limiting & JWT Authorization     │
                                └───────────────────────────┬────────────────────────────┘
                                                            │
                                ┌───────────────────────────┴────────────────────────────┐
                                ▼                                                        ▼
  ┌──────────────────────────────────────────────┐              ┌──────────────────────────────────────────────┐
  │       NEON CLOUD POSTGRESQL & ALEMBIC        │              │     MICROSOFT FABRIC & IOT INGESTION         │
  │ • 26 Connected Relational Tables (FKs)       │              │ • High-Throughput Vehicle Telemetry Ingest   │
  │ • Optimistic Concurrency Control (version)   │              │ • Delta Lake Historical Analytics            │
  └──────────────────────────────────────────────┘              └──────────────────────────────────────────────┘
```

---

## ✨ Core Capabilities & Feature Highlights

1. **🗺️ Dynamic 3D GIS & Meteorological Hazard Layers**:
   - **MapLibre GL Vector Graphics**: High-frame-rate 3D vector maps with smooth camera swoops.
   - **Open-Meteo Meteorological Radar**: Real-time blizzard hazard corridors, icing warnings, and high crosswind hazard polygons.
   - **Geoapify Geocoding**: Debounced place search with multi-tier TTL caching.

2. **🧮 Deterministic Simulation Physics Engine**:
   - Mathematical calculations of aerodynamic drag force, rolling resistance power, cumulative SLA breach distribution, and Pareto decision scoring.

3. **📡 Real-Time SSE Event Stream Watchdog**:
   - Sub-50ms operational event broadcasts with exponential backoff auto-reconnection and browser-wide event bus dispatch.

4. **🐘 Neon Cloud PostgreSQL Database**:
   - 26 relational tables with foreign keys, index optimization, and optimistic concurrency version locking (`version: int`).

---

## 🧮 Deterministic Simulation Physics Engine

### 1. Aerodynamic Drag Force
$$F_{\text{aero}} = \frac{1}{2} \rho C_d A v^2$$

### 2. Rolling Resistance Force
$$F_{\text{roll}} = C_r m g$$

### 3. Total Mechanical Power
$$P = (F_{\text{aero}} + F_{\text{roll}}) \cdot v$$

---

## 📂 Repository Structure

```
nexus/
├── .github/                  # GitHub Actions CI workflows, issue templates, SECURITY.md
│   ├── workflows/ci.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                     # System architecture & deployment documentation
│   ├── ARCHITECTURE.md
│   ├── API_SPECIFICATION.md
│   └── DEPLOYMENT.md
├── backend/                  # Asynchronous FastAPI backend microservice
│   ├── app/                  # Application core, models, schemas, endpoints
│   ├── tests/                # Pytest unit & integration test suite (20/20 passed)
│   └── requirements.txt      # Python dependencies
├── database/                 # Neon PostgreSQL schema and Prisma migrations
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/                 # Next.js 15 App Router web application
│   ├── app/                  # 60+ App Router pages
│   ├── components/           # 3D vector map, layout, UI primitives
│   └── lib/                  # Data provider, SSE realtime client, stores
├── docker-compose.yml        # Zero-setup local container orchestration
├── package.json              # Monorepo scripts
├── pyproject.toml            # Python tool configurations
└── vercel.json               # Vercel deployment routing configuration
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: v20+
- **Python**: v3.13+
- **Docker** (Optional for container setup)

### 2. Monorepo Setup
```bash
# Clone the repository
git clone https://github.com/AadityaUniyal/Nexus.git
cd Nexus

# Install frontend dependencies
npm install --prefix frontend

# Set up backend virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r backend/requirements.txt
```

### 3. Running Services
```bash
# Terminal 1: Start Backend (FastAPI on port 8000)
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend (Next.js on port 3000)
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to launch the NEXUS Command HUD.

---

## 🐳 Docker Container Orchestration

Run the entire NEXUS platform locally with single-command container orchestration:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`

---

## 🧪 Automated Verification & Testing

```bash
# Run Backend Test Suite (Pytest)
python -m pytest backend/tests

# Run Frontend Type Safety Verification
cd frontend && npx tsc --noEmit

# Run Production Frontend Build
cd frontend && npm run build
```

---

## 🛡️ Security & Governance

NEXUS enforces strict OWASP security standards:
- **Rate Limiting**: Sliding window throttling per route tier (`app/core/rate_limit.py`).
- **Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- **JWT RBAC**: Token verification and role-based permissions (`ADMINISTRATOR`, `OPERATIONS_MANAGER`, `OPERATOR`, `VIEWER`).

See [.github/SECURITY.md](.github/SECURITY.md) for vulnerability reporting procedures.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
