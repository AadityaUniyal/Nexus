web: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
worker: cd backend && python -m app.workers.worker
