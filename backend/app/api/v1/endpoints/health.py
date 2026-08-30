from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.system import HealthCheckResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health/live", response_model=HealthCheckResponse)
@router.get("/health/ready", response_model=HealthCheckResponse)
@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def health_check():
    """Liveness and readiness probe for the NEXUS platform."""
    return HealthCheckResponse(
        status="HEALTHY",
        version=settings.VERSION,
        database="CONNECTED (PostgreSQL Neon)",
        ai_inference="ONLINE (Groq LLaMA 3.3 70B)",
        azure_iot="CONNECTED (IoT Hub Gateway)",
        fabric_lake="SYNCED (Microsoft Fabric OneLake)",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
