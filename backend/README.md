# ⚡ NEXUS FastAPI Asynchronous Backend Microservice

Mission-critical Operational Intelligence, Deterministic Physics Simulation, Industry-Grade Machine Learning, and Real-Time Telemetry Backend for NEXUS.

---

## 🏛️ Architecture Overview

The backend is built with **FastAPI** and **SQLAlchemy 2.0 (AsyncIO)** connected to **PostgreSQL (Neon / Azure Flexible Server)**:

- **`app/api/v1/`**: 28+ REST API endpoint modules (Vehicles, Warehouses, Orders, Incidents, Simulations, Search, SLA, Support, Analytics, Weather, Driver, Voice, Webhooks).
- **`app/core/`**: Security, JWT principal authorization, sliding window rate limiting, Passkey / WebAuthn helpers, exception handling.
- **`app/db/`**: Async engine sessions, connection pooling, base models.
- **`app/models/`**: Relational SQLAlchemy models with multi-tenant row-level isolation.
- **`app/ml/`**: Physics-Informed Neural Networks (PINN), Spatiotemporal delay regressions, and TreeSHAP risk attribution.
- **`app/services/`**: Core domain services (`simulation_engine.py`, `location_service.py`, `event_service.py`, `ml_engine.py`).
- **`app/realtime/`**: Server-Sent Events (SSE) and WebSocket broadcaster for real-time fleet telemetry.
- **`tests/`**: Comprehensive pytest test suite (79 test cases passing).

---

## 🚀 Local Development Setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --port 8000
```

Interactive documentation endpoints:
- OpenAPI / Swagger UI: `http://localhost:8000/docs`
- ReDoc Specs: `http://localhost:8000/redoc`
- Real-time SLA Health: `http://localhost:8000/api/v1/health/sla`

---

## 🧪 Testing

```bash
# Run the complete test suite
pytest tests
```
All 79 test cases verify adversarial attack resilience, ML inference, SLA reporting, and role authorization.

