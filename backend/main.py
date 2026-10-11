"""
NEXUS Production Entrypoint for Azure App Service & Container Runtimes.
Ensures sys.path and current directory resolve both the workspace root
and the app directory cleanly across all container/Oryx virtualenvs.
"""
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Ensure app package is also directly reachable if needed
APP_DIR = os.path.join(CURRENT_DIR, "app")
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", os.environ.get("WEBSITES_PORT", 8000)))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=1)
