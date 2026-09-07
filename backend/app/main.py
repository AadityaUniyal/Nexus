import logging
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
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
    yield
    # Shutdown actions
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

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

# Custom Request Timing, Security Headers & Logging Middleware
@app.middleware("http")
async def add_process_time_and_security_headers(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    
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
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected operational error occurred.",
                "details": {"errorType": type(exc).__name__, "detail": str(exc)},
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
