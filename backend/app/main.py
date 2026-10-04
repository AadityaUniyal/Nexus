import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from app.core.security import decode_token
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.errors import NexusException
from app.api.v1.api import api_router
from app.api.v1.endpoints import webhooks

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("nexus")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info("API Documentation available at /docs")
    try:
        from app.db.session import engine
        from app.db.base import Base
        import app.models  # ensure models registered
        logger.info("Run 'alembic upgrade head' to apply migrations")
        logger.info("PostgreSQL database schemas verified.")
    except Exception as e:
        logger.warning(f"Warning: Database schema check error: {e}")

    # Initialize Azure Monitor / Application Insights
    try:
        from app.integrations.azure_monitor import azure_monitor_client
        if azure_monitor_client.enabled and azure_monitor_client.tracer:
            logger.info("[Azure Monitor] Application Insights telemetry ACTIVE")
        else:
            logger.info("[Azure Monitor] Running in local logging mode (no connection string)")
    except Exception as e:
        logger.warning(f"[Azure Monitor] Initialization skipped: {e}")

    # Initialize Azure Blob Storage
    try:
        from app.integrations.azure_blob_storage import azure_blob_storage_client
        if azure_blob_storage_client.blob_service_client:
            logger.info("[Azure Blob Storage] Connected to Azure Storage Account")
        else:
            logger.info("[Azure Blob Storage] Running in local fallback mode")
    except Exception as e:
        logger.warning(f"[Azure Blob Storage] Initialization skipped: {e}")

    # Initialize Azure Event Hub
    try:
        from app.integrations.azure_event_hub import azure_event_hub_client
        if azure_event_hub_client.is_healthy():
            logger.info("[Azure Event Hub] Initialized successfully")
        else:
            logger.info("[Azure Event Hub] Disabled or not configured")
    except Exception as e:
        logger.warning(f"[Azure Event Hub] Initialization skipped: {e}")

    yield
    # Shutdown actions
    try:
        from app.integrations.azure_monitor import azure_monitor_client
        azure_monitor_client.shutdown()
    except Exception:
        pass
    logger.info(f"Shutting down {settings.PROJECT_NAME}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Mission-critical Operational Intelligence and Decision Simulation Platform Backend.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from app.core.rate_limit import RateLimitMiddleware

cors_origins = settings.CORS_ORIGINS
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)

# Set CORS middleware with strict allowed methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-Workspace-ID", "Accept", "Origin"],
)
app.add_middleware(RateLimitMiddleware)

# Auto-instrument FastAPI so Application Insights gets the `requests` table
# (operation names, durations, result codes, failures) and distributed traces.
try:
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from app.integrations.azure_monitor import azure_monitor_client
    if azure_monitor_client.tracer_provider is not None:
        FastAPIInstrumentor.instrument_app(
            app,
            tracer_provider=azure_monitor_client.tracer_provider,
            excluded_urls="health/live,health/ready",
        )
except Exception as _otel_err:  # pragma: no cover
    logger.info(f"[Azure Monitor] FastAPI instrumentation skipped: {_otel_err}")

# Custom Request Timing, Security Headers & Logging Middleware
@app.middleware("http")
async def add_process_time_and_security_headers(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    # Extract role from JWT if present
    auth_header = request.headers.get("Authorization")
    role = None
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload:
            role = payload.get("role")
    request.state.role = role
    start_time = time.time()
    # Admin authorization is enforced per-route via require_permission(...)
    # in endpoints/admin.py (the old path check here never matched /api/v1/admin).
    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    try:
        from app.services.platform_metrics import platform_metrics
        platform_metrics.record(str(request.url.path), response.status_code, process_time)
    except Exception:
        pass
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"

    # Track request metrics in Azure Application Insights
    try:
        from app.integrations.azure_monitor import azure_monitor_client
        azure_monitor_client.track_metric("request_duration_ms", process_time, {
            "path": str(request.url.path),
            "method": request.method,
            "status_code": str(response.status_code),
        })
        if response.status_code >= 400:
            azure_monitor_client.track_event("request_error", {
                "path": str(request.url.path),
                "status_code": str(response.status_code),
                "request_id": request_id,
            })
    except Exception:
        pass  # Never break request processing for telemetry
    
    # OWASP Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Global Exception Handler for Nexus Exceptions
@app.exception_handler(NexusException)
async def nexus_exception_handler(request: Request, exc: NexusException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "requestId": exc.request_id or getattr(request.state, "request_id", None),
            }
        },
    )

# Global Exception Handler for Unhandled Exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(f"Unhandled exception [Request ID: {req_id}]: {exc}", exc_info=True)
    
    # Do not leak internal exception trace/type details in production environments
    details = {"errorType": type(exc).__name__, "detail": str(exc)} if settings.APP_ENV == "development" else None

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected operational error occurred.",
                "details": details,
                "requestId": req_id,
            }
        },
    )

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Include Webhooks at root and under api prefix
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])

@app.get("/health/live")
async def health_live():
    return {"status": "LIVE", "timestamp": time.time()}

@app.get("/health/ready")
async def health_ready():
    from sqlalchemy import text
    from app.db.session import engine
    db_status = "DISCONNECTED"
    is_ready = False
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT 1"))
            if res.scalar() == 1:
                db_status = "CONNECTED"
                is_ready = True
    except Exception as e:
        db_status = f"UNAVAILABLE ({type(e).__name__})"

    return {
        "status": "READY" if is_ready else "DEGRADED",
        "database": db_status,
        "redis": "NOT_CONFIGURED" if "localhost" in settings.REDIS_URL else "CONFIGURED",
        "timestamp": time.time(),
    }

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docsUrl": "/docs",
        "apiPrefix": settings.API_V1_STR,
    }

@app.get("/health/azure")
async def azure_health():
    """Reports health status of all Azure free tier integrations."""
    azure_services = {}

    # Application Insights
    try:
        from app.integrations.azure_monitor import azure_monitor_client
        azure_services["applicationInsights"] = {
            "status": "ACTIVE" if (azure_monitor_client.enabled and azure_monitor_client.tracer) else "LOCAL_FALLBACK",
            "connectionConfigured": bool(azure_monitor_client.connection_string),
            "freeTierLimit": "5 GB ingestion/month",
        }
        from app.integrations import azure_monitor as _am
        if _am.OTEL_IMPORT_ERROR:
            azure_services["applicationInsights"]["error"] = _am.OTEL_IMPORT_ERROR
    except Exception:
        azure_services["applicationInsights"] = {"status": "NOT_LOADED"}

    # Blob Storage
    try:
        from app.integrations.azure_blob_storage import azure_blob_storage_client
        azure_services["blobStorage"] = {
            "status": "CONNECTED" if azure_blob_storage_client.blob_service_client else "LOCAL_FALLBACK",
            "medallionContainers": ["telemetry-bronze", "telemetry-silver", "analytics-gold"],
            "freeTierLimit": "5 GB LRS (12-month free)",
        }
    except Exception:
        azure_services["blobStorage"] = {"status": "NOT_LOADED"}
    # Event Hub
    try:
        from app.integrations.azure_event_hub import azure_event_hub_client
        azure_services["eventHub"] = {
            "status": "CONNECTED" if azure_event_hub_client.is_healthy() else "DISABLED",
            "freeTierLimit": "1 M events/month",
        }
    except Exception:
        azure_services["eventHub"] = {"status": "NOT_LOADED"}

    # Cognitive Search
    try:
        from app.integrations.azure_cognitive_search import azure_cognitive_search_client
        azure_services["cognitiveSearch"] = {
            "status": "CONNECTED" if azure_cognitive_search_client.is_healthy() else "DISABLED",
            "freeTierLimit": "3 indexes, 10K docs each",
        }
    except Exception:
        azure_services["cognitiveSearch"] = {"status": "NOT_LOADED"}

    # Foundry
    try:
        from app.integrations.azure_foundry import azure_foundry_client
        azure_services["foundry"] = {
            "status": "CONNECTED" if azure_foundry_client.is_healthy() else "DISABLED",
            "freeTierLimit": "Limited sandbox resources",
        }
    except Exception:
        azure_services["foundry"] = {"status": "NOT_LOADED"}

    # IoT Hub
    try:
        from app.integrations.azure_iot import azure_iot_gateway
        azure_services["iotHub"] = {
            "status": "HEALTHY" if azure_iot_gateway.is_healthy() else "DISABLED",
            "connectedDevices": len(azure_iot_gateway._connected_devices),
            "freeTierLimit": "F1: 8,000 messages/day",
        }
    except Exception:
        azure_services["iotHub"] = {"status": "NOT_LOADED"}

    # Key Vault
    try:
        from app.integrations.azure_keyvault import keyvault_manager
        azure_services["keyVault"] = {
            "status": "CONFIGURED" if keyvault_manager.vault_url else "ENV_FALLBACK",
            "freeTierLimit": "~10,000 operations/month",
        }
    except Exception:
        azure_services["keyVault"] = {"status": "NOT_LOADED"}

    # Fabric / OneLake
    try:
        from app.integrations.fabric_onelake import fabric_onelake_client
        azure_services["fabricOneLake"] = {
            "status": "HEALTHY" if fabric_onelake_client.is_healthy() else "DISABLED",
            "workspaceId": fabric_onelake_client.workspace_id,
        }
    except Exception:
        azure_services["fabricOneLake"] = {"status": "NOT_LOADED"}

    # Azure Functions Tasks
    try:
        from app.integrations.azure_functions_tasks import AzureFunctionsTaskRunner
        runner = AzureFunctionsTaskRunner()
        azure_services["functions"] = {
            "status": "AVAILABLE",
            "scheduledTasks": [
                runner.schedule_daily_analytics_summary(),
                runner.schedule_telemetry_cleanup(),
                runner.schedule_anomaly_detection_sweep(),
                runner.schedule_sla_compliance_report(),
                runner.schedule_incident_digest(),
            ],
            "freeTierLimit": "1M executions/month",
        }
    except Exception:
        azure_services["functions"] = {"status": "NOT_LOADED"}

    # LLM providers (Groq / Gemini free tiers)
    try:
        from app.services.ai_service import ai_service
        st = ai_service.status()
        azure_services["aiProviders"] = {
            "status": "ACTIVE" if st["enabled"] else "DETERMINISTIC",
            "chain": st["chain"],
        }
    except Exception:
        azure_services["aiProviders"] = {"status": "NOT_LOADED"}

    all_healthy = all(
        s.get("status") not in ["NOT_LOADED"]
        for s in azure_services.values()
    )

    return {
        "status": "OPERATIONAL" if all_healthy else "PARTIAL",
        "platform": "Azure Free Tier",
        "services": azure_services,
        "monthlyCost": "$0 (within free tier limits)",
        "timestamp": time.time(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
