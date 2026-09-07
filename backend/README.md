# NEXUS Backend — FastAPI Microservice & AI Engine

The NEXUS backend is an asynchronous Python 3.13 FastAPI application powering real-time logistics command, dual-provider AI inference, Pipecat voice bot frame processing, and deterministic simulation physics.

---

## 🏛️ Key Components

- **`app/api/v1/endpoints/`**: Modular REST & SSE routers for authentication, incidents, simulations, fleet operations, location, search, and admin governance.
- **`app/core/`**: Configuration (`config.py`), TTL caching, JWT security, and exception handlers.
- **`app/db/`**: AsyncPG database engine and session management connected to Neon Cloud PostgreSQL.
- **`app/services/`**: Domain logic including `ai_service.py` (Groq LLaMA 3.3 primary + Gemini 2.5-Flash secondary failover) and `simulation_engine.py` (aerodynamic physics & SLA breach CDF math).
- **`app/voice/`**: Native Pipecat AI framework voice agent bot, tools, and frame processors.
- **`alembic/`**: Versioned database migration scripts (including `aad5e71dd967_add_erd_relationships.py` establishing 26 connected tables).

---

## 🧪 Quickstart & Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run Alembic migrations
alembic upgrade head

# Run backend API server locally
uvicorn app.main:app --reload --port 8000

# Run Pytest suite (66/66 tests)
pytest ../tests/backend
```

Interactive Swagger API docs available at: `http://localhost:8000/docs`
