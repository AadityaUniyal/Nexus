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
from app.integrations.azure_monitor import configure_monitoring
configure_monitoring()


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

    try:
        from app.core.task_queue import task_queue
        await task_queue.start()
        logger.info("Enterprise AsyncTaskQueue initialized with background workers.")
    except Exception as e:
        logger.warning(f"Task queue initialization warning: {e}")

    try:
        from app.integrations.azure_iot_consumer import azure_iot_consumer
        await azure_iot_consumer.start()
        app.state.azure_iot_consumer = azure_iot_consumer
        logger.info("Azure IoT consumer status: %s", azure_iot_consumer.status)
    except Exception:
        logger.exception("Azure IoT consumer startup failed")

    logger.info("NEXUS API startup complete.")
    yield
    try:
        from app.integrations.azure_iot_consumer import azure_iot_consumer
        await azure_iot_consumer.stop()
    except Exception:
        logger.exception("Azure IoT consumer shutdown failed")
    try:
        from app.core.task_queue import task_queue
        await task_queue.stop()
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
        elif settings.ENABLE_DEMO_AUTH and (
            token in ("demo-operator-token", "demo_operator", "nexus_demo_token") or token.startswith("demo_")
        ):
            role = "OPERATIONS_MANAGER"
    # Fallback to session cookie if role not set from Authorization header
    if role is None:
        token = request.cookies.get("nexus_session_token")
        if token:
            payload = decode_token(token)
            if payload:
                role = payload.get("role")
            elif settings.ENABLE_DEMO_AUTH and (
                token in ("demo-operator-token", "demo_operator", "nexus_demo_token") or token.startswith("demo_")
            ):
                role = "OPERATIONS_MANAGER"
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

    if response.status_code >= 400:
        logger.warning(f"Request error: {request.method} {request.url.path} [{response.status_code}] (req_id={request_id})")
    
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
    from app.integrations.azure_iot_consumer import azure_iot_consumer
    from app.integrations.azure_blob_storage import azure_blob_storage_client
    from app.integrations.azure_monitor import _configured
    return {
        "status": "ok",
        "services": {
            "applicationInsights": "CONFIGURED" if _configured else "NOT_CONFIGURED",
            "blobStorage": "CONNECTED" if azure_blob_storage_client.enabled and azure_blob_storage_client.blob_service_client else "NOT_CONFIGURED",
            "iotHub": azure_iot_consumer.status,
            "fabric": "NOT_CONFIGURED",
        },
        "timestamp": time.time(),
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
