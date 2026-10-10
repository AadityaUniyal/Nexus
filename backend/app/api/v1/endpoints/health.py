from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health/live")
async def health_live():
    """Liveness probe: returns 200 without touching external dependencies."""
    return {
        "status": "ok",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/ready")
@router.get("/health")
async def health_ready(response: Response, db: AsyncSession = Depends(get_db)):
    """
    Readiness probe: performs actual checks against active dependencies.
    Returns 503 if any mandatory dependency (e.g. database) is down.
    Never reports a dependency as connected without checking it.
    """
    deps = {}
    is_ready = True

    # 1. Database readiness check
    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() == 1:
            deps["database"] = "ok"
        else:
            deps["database"] = "degraded"
            is_ready = False
    except Exception:
        deps["database"] = "down"
        is_ready = False

    # 2. Azure Maps configuration status
    if settings.AZURE_MAPS_CLIENT_ID:
        deps["azure_maps"] = "ok"
    else:
        deps["azure_maps"] = "degraded"

    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if is_ready else "down",
        "version": settings.VERSION,
        "dependencies": deps,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
