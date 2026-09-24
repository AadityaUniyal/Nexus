# 📜 NEXUS Changelog

All notable changes to the NEXUS Spatial Intelligence & Operational BI platform will be documented in this file.

---

## [2.1.0] - 2026-09-24

### 🚀 Added & Enhanced
- **Real Groq AI Subsystem (`ai_service.py`)**: Connected `GROQ_API_KEY` with model `llama-3.3-70b-versatile` to power Copilot reasoning (`/api/v1/copilot/chat`) and Executive Briefing summaries (`/api/v1/briefing/explain`).
- **Real SQL Analytics Engine (`analytics_service.py`)**: Replaced all hardcoded KPI mock literals with live PostgreSQL SQL aggregations on orders, vehicles, warehouses, and incidents.
- **Dynamic Timeframe & CSV Export (`/analytics/export`)**: Added timeframe options (`24h`, `7d`, `30d`, `90d`) and downloadable `.csv` operational analytics reports.
- **API Pagination**: Implemented standard `skip` and `limit` pagination parameters across list endpoints in `admin.py`, `incidents.py`, `governance.py`, `decisions.py`, `notifications.py`, and `intelligence.py`.
- **Database Seeding (`bootstrap_service.py`)**: Added automatic initial operational entity seeding (Warehouses, Vehicles, Routes, Orders, Incidents) on workspace bootstrap.
- **Prisma Schema Synchronization**: Aligned `database/prisma/schema.prisma` with SQLAlchemy models (`Report`, `Feedback`, `AIInsight`, `EventOutbox`).
- **Rate Limiting Hardening (`rate_limit.py`)**: Implemented sliding window rate limiting with 2-minute garbage collection of expired keys.
- **Frontend Live Data Provider Wiring (`data-provider.ts`)**: Connected frontend events, contact form, feedback, profile, and settings calls to live FastAPI endpoints.
- **WCAG Accessibility Improvements**: Added `role="region"`, `role="radiogroup"`, `aria-label`, and keyboard focus rings to components (`MetricTile.tsx`, `AnalyticsPage.tsx`).

---

## [2.0.0] - 2026-08-30

### 🎉 Initial Platform Architecture
- Next.js 15 App Router frontend with Three.js 3D Digital Twin map and Recharts dashboards.
- FastAPI async backend with SQLAlchemy models for Workspaces, Users, Vehicles, Warehouses, Routes, Orders, Incidents, and Simulations.
- Deterministic and Monte Carlo stochastic physics simulation engine for route detour evaluations.
- Clerk JWT authentication and role-based permissions.
