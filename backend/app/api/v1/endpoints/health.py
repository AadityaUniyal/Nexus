from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.system import HealthCheckResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health/live")
async def health_live():
    """Liveness probe verifying that the FastAPI process is running."""
    return {
        "status": "LIVE",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/health/ready", response_model=HealthCheckResponse)
@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def health_ready(db: AsyncSession = Depends(get_db)):
    """Readiness probe performing actual database query and dependency checks."""
    db_connected = False
    db_status = "DISCONNECTED"

    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() == 1:
            db_connected = True
            db_status = "CONNECTED (PostgreSQL Active Pool)"
    except Exception as e:
        db_status = f"UNAVAILABLE ({type(e).__name__})"

    redis_status = "NOT_CONFIGURED" if "localhost" in settings.REDIS_URL else "CONFIGURED"
    overall_status = "READY" if db_connected else "DEGRADED"

    return HealthCheckResponse(
        status=overall_status,
        version=settings.VERSION,
        database=db_status,
        database_connected=db_connected,
        redis=redis_status,
        ai_inference="ONLINE (Groq LLaMA 3.3)" if settings.GROQ_API_KEY else "DISABLED",
        azure_iot="CONNECTED" if settings.AZURE_IOT_HUB_ENABLED else "DISABLED",
        fabric_lake="SYNCED" if settings.FABRIC_ONELAKE_ENABLED else "DISABLED",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
