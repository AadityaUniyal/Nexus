# 🏛️ System Architecture & Design Blueprint

NEXUS is an enterprise What-If simulation and spatial intelligence command platform engineered for sub-second operational response times.

---

## 🔁 Monorepo Tier Structure

1. **Frontend Tier (Next.js 15 App Router)**:
   - 60+ routes rendering MapLibre 3D GIS maps, Open-Meteo weather radar overlays, and command HUD controls.
   - Realtime client maintaining Server-Sent Events (SSE) connections with auto-reconnect logic.

2. **Backend Tier (FastAPI Asynchronous Backend)**:
   - Asynchronous Python microservice handling deterministic physics calculations, SLA breach CDF math, rate limiting, and RBAC authentication.

3. **Database Tier (Neon Cloud PostgreSQL)**:
   - 26 relational tables managing vehicles, routes, hubs, incidents, simulations, decisions, audit logs, and operational events.

4. **Telemetry Tier (IoT Ingestion & Event Outbox)**:
   - Ingestion gateway streaming high-throughput vehicle location, speed, and state-of-charge updates.

---

## 🛡️ Concurrency & Real-Time Sync

- **Optimistic Concurrency Control**: Entity updates include `version = version + 1` checks to prevent race conditions during multi-operator dispatch.
- **Transaction Outbox Pattern**: Operational events are atomically committed to `event_outbox` within DB transactions before SSE stream broadcasting.
