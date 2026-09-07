<div align="center">

# 🌐 NEXUS — Autonomous Logistics & Spatial Intelligence Command

### *Enterprise What-If Simulation Platform · Dual AI Engine · 3D Spatial GIS · Tactical Voice Copilot*

[![Build Status](https://img.shields.io/badge/build-passing-00e599.svg?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/AadityaUniyal/Nexus)
[![Backend Tests](https://img.shields.io/badge/pytest-66%2F66%20passed-success.svg?style=for-the-badge&logo=python&logoColor=white)](tests)
[![Next.js 15](https://img.shields.io/badge/next.js-v15.1%20(78%20routes)-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](frontend)
[![FastAPI](https://img.shields.io/badge/fastapi-v0.115%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](backend)
[![Database](https://img.shields.io/badge/database-Neon%20Cloud%20PostgreSQL-00e599.svg?style=for-the-badge&logo=postgresql&logoColor=white)](database)
[![Primary AI](https://img.shields.io/badge/primary%20AI-Groq%20LLaMA%203.3--70B-f55036.svg?style=for-the-badge)](backend/app/services/ai_service.py)
[![Failover AI](https://img.shields.io/badge/failover%20AI-Google%20Gemini%202.5--Flash-4285F4.svg?style=for-the-badge&logo=googlegemini&logoColor=white)](backend/app/services/ai_service.py)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

[**Live Interactive Demo**](#-quickstart--local-development) • [**System Architecture**](#-system-architecture) • [**Operational Flow**](#-end-to-end-operational-workflow) • [**Vercel Deploy**](#-vercel-deployment-guide)

</div>

---

## 📑 Table of Contents
- [🏛️ System Architecture](#-system-architecture)
- [🔄 End-to-End Operational Workflow](#-end-to-end-operational-workflow)
- [✨ Core Capabilities & Feature Deep-Dive](#-core-capabilities--feature-deep-dive)
- [🧮 Deterministic Simulation Physics Engine](#-deterministic-simulation-physics-engine)
- [🤖 Dual-Engine AI Subsystem (Groq + Gemini Failover)](#-dual-engine-ai-subsystem-groq--gemini-failover)
- [📂 Monorepo Repository Structure](#-monorepo-repository-structure)
- [🔑 Environment Setup](#-environment-setup)
- [🧪 Automated Test Verification Metrics](#-automated-test-verification-metrics)
- [🚀 Quickstart & Local Development](#-quickstart--local-development)
- [🌐 Vercel Deployment Guide](#-vercel-deployment-guide)

---

## 🏛️ System Architecture

NEXUS is engineered as a zero-downtime, sub-second 4-tier monorepo designed for high-tempo freight dispatching, hazard monitoring, and deterministic What-If simulation modeling:

```
                                ┌────────────────────────────────────────────────────────┐
                                │                   OPERATOR / DISPATCHER                │
                                │   Tactile HUD · 3D Companion Avatar · Tactical Voice   │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ (HTTPS / WSS / SSE)
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │             NEXT.JS 15 FRONTEND (APP ROUTER)           │
                                │ • 78 Compiled Production Routes                        │
                                │ • MapLibre GL 3D Vector GIS & Open-Meteo Radar Layers  │
                                │ • Health-Aware Resilient Data Provider (`lib/`)        │
                                │ • Real-Time SSE Stream Watchdog & Auto-Reconnect       │
                                │ • 4-Channel Procedural 3D Companion Avatar             │
                                │ • Tactical Push-to-Talk Voice Controller               │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ (REST / WebSockets / SSE)
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │             FASTAPI ASYNCHRONOUS BACKEND               │
                                │ • Dual-Engine AI (Groq LLaMA-3.3 + Gemini 2.5 Failover)│
                                │ • Geoapify Multi-Tier Geocoding & Routing Cache        │
                                │ • Open-Meteo Road Weather & Blizzard Hazard Engine     │
                                │ • Aerodynamic Physics & SLA Probability Engine         │
                                │ • Pipecat AI Voice Pipeline & Function Calling Router │
                                └───────────────────────────┬────────────────────────────┘
                                                            │
                        ┌───────────────────────────────────┴───────────────────────────────────┐
                        ▼                                                                       ▼
 ┌──────────────────────────────────────────────┐              ┌──────────────────────────────────────────────┐
 │       NEON CLOUD POSTGRESQL & ALEMBIC        │              │     MICROSOFT FABRIC & IOT INGESTION         │
 │ • 26 Fully Connected Relational Tables (FKs) │              │ • High-Throughput Vehicle Telemetry Ingest   │
 │ • Optimistic Concurrency Control (version)   │              │ • Delta Lake Historical Analytics            │
 │ • Multi-Tenant Workspace Partitions          │              │ • Real-time Stream Processing                │
 └──────────────────────────────────────────────┘              └──────────────────────────────────────────────┘
```

### 🔁 Real-Time State Mutation & Event Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Operator / Dispatcher
    participant UI as Next.js 15 App Shell
    participant DP as Data Provider (lib/data-provider.ts)
    participant API as FastAPI Gateway
    participant AI as Dual AI Engine (Groq / Gemini)
    participant DB as Neon Cloud PostgreSQL
    participant SSE as Realtime SSE Broadcaster
    participant Avatar as 3D Companion Avatar

    Operator->>UI: Triggers Spoken Voice Command / UI Simulation Click
    UI->>AI: Parse Intent & Tool Call ("Simulate I-70 Detour on NX-104")
    AI-->>UI: Executed Tool Calling JSON Payload
    UI->>DP: POST /api/v1/simulations/run
    DP->>API: Validates JWT Bearer & RBAC Clearance
    API->>API: Executes Deterministic Physics & SLA CDF Math
    API->>DB: Mutates Entity with Optimistic Concurrency Check (version=version+1)
    DB-->>API: Transaction Committed
    API->>SSE: Broadcasts Operational Event to Event Stream
    SSE-->>UI: SSE Event Received (Sub-50ms)
    UI->>Avatar: Shift Mood State (SIMULATING -> SUCCESS)
    UI-->>Operator: Render Dynamic 3D Spline, Pareto Score & Spoken Audio Feedback
```

---

## 🔄 End-to-End Operational Workflow

NEXUS operates as a continuous closed-loop operational intelligence cycle:

```mermaid
flowchart TD
    A["1. Dynamic Operator Onboarding"] -->|"Selects Hub Coordinates & Freight Modality"| B["2. Dynamic 3D Spatial GIS Initialized"]
    B -->|"Ingests Real-Time GPS & Battery SOC Splines"| C["3. Continuous Hazard & Anomaly Monitoring"]
    C -->|"Open-Meteo Flags Blizzard / High Crosswinds"| D["4. Incident Created & 3D Avatar Shifts to CRITICAL"]
    D -->|"Operator Spoken Command: 'Simulate Detour for Vehicle NX-104'"| E["5. Pipecat AI & Dual Engine Tool Calling"]
    E -->|"Runs Mathematical Physics & SLA Breach CDF Model"| F["6. Multi-Objective Pareto Trade-Off Optimization"]
    F -->|"Time Saved: +135m · Cost: +$45 · SLA Breach Risk: 4.2%"| G["7. Automated Root Cause Analysis (RCA)"]
    G -->|"Operator Approves Spoken / Button Decision"| H["8. Atomic Decision Lock & Audit Ledger Entry"]
    H -->|"Broadcasts Real-Time State Mutation via SSE"| B
```

---

## ✨ Core Capabilities & Feature Deep-Dive

<details>
<summary><b>1. 🗺️ Dynamic 3D GIS & Meteorological Hazard Layers</b> (Click to Expand)</summary>

<br/>

- **MapLibre GL Vector Graphics**: Renders high-frame-rate 3D vector maps with smooth camera swoop transitions.
- **Open-Meteo Meteorological Radar**: Projects real-time blizzard hazard polygons, road icing warnings, and high-crosswind hazard corridors over active freight routes.
- **Debounced Geoapify Place Search**: Autocomplete geocoding with multi-tier Redis/in-memory TTL caching for instant spatial positioning.

</details>

<details>
<summary><b>2. 🤖 4-Channel Continuous Procedural 3D Companion Avatar</b> (Click to Expand)</summary>

<br/>

The 3D Companion Avatar ([Avatar3D.tsx](file:///c:/Users/HP/OneDrive/Desktop/nexus/frontend/components/avatar/Avatar3D.tsx)) operates **4 simultaneous procedural animation channels**:

1. **Harmonic Levitation & Figure-8 Wobble**: Sinusoidal floating (`y = Math.sin(t * 1.8) * 0.09`) paired with figure-8 pitch & roll rotation.
2. **Rhythmic Breathing & Beacon Pulse**: Mesh expansion (`1.0 + Math.sin(t * 2.2) * 0.025`) and glowing emissive beacon pulses.
3. **Dual Counter-Rotating Orbital Rings & Particle Swarm**: Inner ring rotates clockwise, outer ring counter-clockwise with 36 orbiting spatial energy particles.
4. **Organic Eye-Blink & Cursor Gaze**: Eyes and head damp smoothly toward mouse movement with organic eye-blinks.
5. **Interactive 3D Gestures**: 360° click spin jump with tactile Web Audio sound synthesis, plus pointer-drag manual 360° spin rotation.

</details>

<details>
<summary><b>3. ⚡ Dual-Engine AI Subsystem (Groq + Gemini Failover)</b> (Click to Expand)</summary>

<br/>

- **Primary Engine**: **Groq AI** (`llama-3.3-70b-versatile`) delivering sub-400ms operational briefings, Root Cause Analysis (RCA), and voice tool-calling intent execution.
- **Secondary Failover Engine**: **Google Gemini AI** (`gemini-2.5-flash`) REST API failover automatically engaged if Groq hits rate limits (429), timeouts, or service interruptions.
- **Zero-Downtime Guarantee**: Tertiary deterministic analytical engine ensures full platform functionality even if cloud APIs are offline.

</details>

<details>
<summary><b>4. 🎙️ Hands-Free Tactical Voice Copilot (Pipecat AI)</b> (Click to Expand)</summary>

<br/>

- Natural language voice commands to control 3D camera viewports, triage severe incidents, run What-If simulations, and inspect fleet telemetry hands-free.
- Integrated Web Audio waveform visualizer and tactile sound synthesizer.

</details>

<details>
<summary><b>5. 🐘 Neon Cloud PostgreSQL Database & 26 Relational Tables</b> (Click to Expand)</summary>

<br/>

- 26 interconnected tables with foreign key constraints, cascade rules, and optimistic concurrency version locks (`version: int`).
- Alembic migration pipeline (`alembic upgrade head`) and transaction outbox pattern for event reliability.

</details>

---

## 🧮 Deterministic Simulation Physics Engine

NEXUS calculates What-If route diversions and energy consumption using exact physical equations:

### 1. Aerodynamic Drag Force
$$F_{\text{aero}} = \frac{1}{2} \rho C_d A v^2$$

### 2. Rolling Resistance Force
$$F_{\text{roll}} = C_r m g$$

### 3. Total Required Mechanical Power
$$P = (F_{\text{aero}} + F_{\text{roll}}) \cdot v$$

### 4. SLA Breach Probability (Normal Cumulative Distribution)
$$P(\text{Breach}) = 1 - \Phi\left(\frac{T_{\text{deadline}} - T_{\text{estimated}}}{\sigma}\right)$$

### 5. Multi-Objective Pareto Decision Score
$$\text{Score} = \alpha \cdot \Delta T_{\text{saved}} + \beta \cdot \Delta E_{\text{cost}} + \gamma \cdot (1 - P(\text{Breach}))$$

---

## 🤖 Dual-Engine AI Subsystem (Groq + Gemini Failover)

```mermaid
flowchart LR
    Request["Incoming Operational Prompt / Voice Tool Call"] --> Primary{"1. Primary Provider: Groq LLaMA-3.3-70B"}
    Primary -->|200-400ms Success| Result["Return AI Briefing / RCA / Tool Call JSON"]
    Primary -->|Rate Limit 429 / Timeout / Quota Error| Failover{"2. Secondary Provider: Google Gemini 2.5-Flash"}
    Failover -->|300-600ms Success| Result
    Failover -->|API Outage| RuleEngine["3. Tertiary Provider: Deterministic Analytical Rule Engine"]
    RuleEngine --> Result
```

---

## 📂 Monorepo Repository Structure

```
nexus/
├── backend/                             # Python 3.13 FastAPI Backend Service
│   ├── alembic/                         # Alembic Versioned Migrations (Aad5e71dd967 Schema)
│   ├── app/
│   │   ├── api/v1/                      # REST & SSE Endpoint Routers (Auth, Incidents, Sims, Ops, Admin)
│   │   ├── core/                        # Neon Database Config, Security, JWT, Error Handlers
│   │   ├── db/                          # AsyncPG Database Session & Base Engine
│   │   ├── integrations/                # Location (Geoapify) & Weather (Open-Meteo) Service Providers
│   │   ├── models/                      # SQLAlchemy ORM Models (26 Interconnected Tables)
│   │   ├── schemas/                     # Pydantic DTO Schemas & Data Validation
│   │   ├── services/                    # Dual AI Subsystem (Groq+Gemini), Physics Simulation Engine
│   │   ├── voice/                       # Pipecat AI Framework Voice Agent & Frame Processors
│   │   └── workers/                     # Background Outbox Queue Worker
│   ├── scripts/                         # Database Seeding & Reset Scripts (seed_demo.py)
│   ├── requirements.txt                 # Backend Python Dependencies
│   └── pyproject.toml                   # Pytest Tooling Configuration
│
├── frontend/                            # Next.js 15 App Router Frontend Application
│   ├── app/
│   │   ├── (auth)/                      # Split-Screen 3D Login, Signup, Password Recovery
│   │   ├── (onboarding)/                # Guided 5-Step Operational Onboarding
│   │   ├── (app)/                       # Core Workspace Pages (Overview, Live World, Operations, Sims, Admin)
│   │   ├── features/                    # Interactive Feature Sub-Pages
│   │   ├── contact/                     # Enterprise Support Page
│   │   └── feedback/                    # Feedback Submission Modal
│   ├── components/
│   │   ├── avatar/                      # 3D Companion Avatar (4 Animation Channels + Gestures)
│   │   ├── layout/                      # AppShell, Navbar with ThemeToggle, Sidebar, Breadcrumbs
│   │   ├── map/                         # MapLibre 3D Vector Map & Open-Meteo Hazard Polygons
│   │   ├── voice/                       # Tactical Voice HUD & Audio Waveform Visualizer
│   │   └── ui/                          # NexusPulse, Glassmorphic Cards, StateViews, Modals
│   ├── lib/                             # Resilient Data Provider, SSE Client, State Management
│   ├── vercel.json                      # Vercel Frontend Configuration
│   ├── next.config.ts                   # Next.js Optimization Config
│   └── tailwind.config.ts               # Custom Color Tokens & Presets
│
├── database/                            # Database Layer
│   └── prisma/
│       └── schema.prisma                # Prisma ORM Database Schema
│
├── tests/                               # Comprehensive Test Suites (66 Tests)
│   └── backend/                         # Pytest Suites (Auth, RBAC, Dual AI, Voice, Physics, DB)
│
├── docs/                                # Reference & System Specifications
│   ├── ARCHITECTURE.md                  # Comprehensive Architecture Specification
│   ├── DATABASE.md                      # Neon Schema Specifications & Relational ERD
│   └── DESIGN_SYSTEM.md                 # Industrial Design Tokens & Canvas Specs
│
├── vercel.json                          # Monorepo Root Vercel Configuration
├── .env.example                         # Environment Variables Template
├── CONTRIBUTING.md                      # Contribution Guidelines & Code Standards
├── LICENSE                              # Open Source MIT License
├── package.json                         # Monorepo Workspace Scripts
├── run.py                               # Concurrent Monorepo Orchestrator
└── README.md                            # Master System Documentation
```

---

## 🔑 Environment Setup

Create a `.env` file in the root directory (and copy to `backend/.env` and `frontend/.env.local`):

```ini
# --- Neon Cloud PostgreSQL Database ---
DATABASE_URL=postgresql+asyncpg://username:password@ep-your-database.neon.tech/neondb?sslmode=require

# --- Dual AI Providers ---
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here

# --- Location & Spatial Services ---
GEOAPIFY_API_KEY=your_geoapify_key_here

# --- Security & JWT ---
SECRET_KEY=your_production_secret_key_32_chars_min
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# --- Frontend API Connectivity ---
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Automated Test Verification Metrics

| Layer | Verification Command | Result / Status | Details |
| :--- | :--- | :---: | :--- |
| **Backend Test Suite** | `python run.py --test` | ✅ **66/66 Passed** | Auth, RBAC, Dual Groq+Gemini AI, Pipecat Voice, Open-Meteo Weather & Physics Engine |
| **Frontend Type Check** | `cd frontend && npx tsc --noEmit` | ✅ **0 Errors** | Strict TypeScript compilation across all 78 routes |
| **Production Build** | `python run.py --compile` | ✅ **78/78 Compiled** | Next.js App Router bundle generation & static optimization |

---

## 🚀 Quickstart & Local Development

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/AadityaUniyal/Nexus.git
cd Nexus

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Apply Database Migrations
```bash
cd backend
alembic upgrade head
cd ..
```

### 3. Launch Development Monorepo
```bash
# Launch backend and frontend concurrently
python run.py
```
- **Frontend HUD Console**: `http://localhost:3000`
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`

---

## 🌐 Vercel Deployment Guide

Deploying NEXUS on Vercel takes less than 2 minutes:

1. Push your repository branch to GitHub.
2. Import the project in your Vercel Dashboard.
3. Keep root configuration or set **Root Directory** to `frontend`.
4. Configure Environment Variables in Vercel settings:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed FastAPI backend (e.g. `https://nexus-api.onrender.com`).
5. Click **Deploy**! Vercel automatically builds all 78 App Router pages.

---

## 📄 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
