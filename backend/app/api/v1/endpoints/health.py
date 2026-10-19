from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.system import HealthCheckResponse
from app.core.config import settings
from app.services.platform_metrics import platform_metrics

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
@router.get("/health", response_model=HealthCheckResponse)
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

    redis_status = "CONFIGURED" if settings.REDIS_URL and "localhost" not in settings.REDIS_URL else "NOT_CONFIGURED"
    overall_status = "READY" if db_connected else "DEGRADED"

    return HealthCheckResponse(
        status=overall_status,
        version=settings.VERSION,
        database=db_status,
        database_connected=db_connected,
        redis=redis_status,
        ai_inference="ONLINE (Groq LLaMA 3.3)" if settings.GROQ_API_KEY else "DISABLED",
        azure_iot=__import__("app.integrations.azure_iot_consumer", fromlist=["azure_iot_consumer"]).azure_iot_consumer.status,
        fabric_lake="NOT_CONFIGURED",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

@router.get("/sla")
async def get_sla_metrics(db: AsyncSession = Depends(get_db)):
    """Return this process's rolling request sample and a point-in-time DB check."""
    db_connected = True
    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() != 1:
            db_connected = False
    except Exception:
        db_connected = False

    metrics = platform_metrics.snapshot()
    request_success_pct = round(100 - metrics["errorRatePct"], 2) if metrics["requests"] else None
    return {
        "status": "HEALTHY" if db_connected else "DEGRADED",
        "requestSuccessRatePct": request_success_pct,
        "requestCount24h": metrics["requests"],
        "errorRatePct": metrics["errorRatePct"],
        "latencyMs": metrics["latencyMs"],
        "history30Days": [],
        "subsystems": [{"name": "API process", "status": "RUNNING"}, {"name": "Database", "status": "CONNECTED" if db_connected else "DISCONNECTED"}],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

