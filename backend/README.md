# ⚡ NEXUS FastAPI Asynchronous Backend Microservice

Mission-critical Operational Intelligence, Deterministic Physics Simulation, and Real-Time SSE Telemetry Backend for NEXUS.

---

## 🏛️ Architecture Overview

The backend is built with **FastAPI** and **SQLAlchemy 2.0 (AsyncIO)** connected to **Neon Cloud PostgreSQL**:

- **`app/api/v1/`**: REST API endpoints (incidents, simulations, operations, weather, location, health, overview).
- **`app/core/`**: Security, JWT principal authorization, sliding window rate limiting, exception handling.
- **`app/db/`**: Async engine sessions, base models.
- **`app/models/`**: SQLAlchemy models (26 relational tables).
- **`app/services/`**: Core domain services (`simulation_engine.py`, `location_service.py`, `event_service.py`).
- **`app/realtime/`**: Server-Sent Events (SSE) broadcaster.
- **`tests/`**: Pytest test suite (20/20 tests passing).

---

## 🚀 Local Development Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --port 8000
```

Documentation endpoints:
- OpenAPI Specs: `http://localhost:8000/docs`
- ReDoc Specs: `http://localhost:8000/redoc`

---

## 🧪 Testing

```bash
python -m pytest tests
```
