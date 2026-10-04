"""
NEXUS Operational Intelligence Platform
Vercel Python Serverless Function Entrypoint
Routes all /api/v1/* requests through the unified FastAPI ASGI application.
"""
import sys
from pathlib import Path

# Add project root and backend directory to Python sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Expose the core FastAPI instance for Vercel's ASGI serverless runtime
from app.main import app
