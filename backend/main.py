"""
Production entrypoint shim for Azure App Service.
Delegates cleanly to app.main:app.
"""
from app.main import app

__all__ = ["app"]
