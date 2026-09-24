# 🛠️ Contributing to NEXUS

Thank you for your interest in contributing to **NEXUS — Autonomous Logistics & Spatial Intelligence Command**.

## 🏗️ Architecture Overview

Nexus is built as a high-performance monorepo:
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, Recharts, Three.js, MapLibre GL
- **Backend**: FastAPI (Python 3.13), SQLAlchemy (Async), PostgreSQL (Neon Cloud / Local), Groq AI SDK
- **Database**: PostgreSQL with Alembic migrations and Prisma schema sync
- **Authentication**: Clerk JWT auth integration with role-based access control (RBAC)

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Backend Test Suite
```bash
cd backend
python -m pytest -v
```

---

## 📐 Coding Conventions

- **Python (Backend)**: Follow PEP 8 guidelines. Use type hints (`typing.Optional`, `typing.List`) and async SQLAlchemy queries (`select`, `execute`).
- **TypeScript (Frontend)**: Strict TypeScript. Avoid `any` types where possible. Use Tailwind utility classes and Framer Motion for smooth micro-interactions.
- **API Standards**: All new API routes should reside under `/api/v1/endpoints/` and be registered in `api_router`. Always include docstrings and Pydantic response models.

---

## 🧪 Submitting Pull Requests

1. Fork the repository and create a feature branch (`git checkout -b feature/my-improvement`).
2. Ensure all tests pass (`python -m pytest -v`).
3. Commit your changes with clean commit messages.
4. Open a Pull Request targeting the `main` branch.
