from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    me,
    onboarding,
    workspaces,
    drivers,
    jobs,
    driver_portal,
    maps,
    stream,
    recommendations,
    audit,
    analytics,
)

api_router = APIRouter()

# Health & Liveness
api_router.include_router(health.router)

# User Profile & Single-Step Onboarding
api_router.include_router(me.router)
api_router.include_router(onboarding.router)

# Tenant & Workspace Management
api_router.include_router(workspaces.router)

# Fleet Drivers & One-Time Signed Links
api_router.include_router(drivers.router)

# Job Lifecycle & Map Route Previews
api_router.include_router(jobs.router)

# Driver Mobile PWA (Redeem, GPS Ingest, Offline Actions)
api_router.include_router(driver_portal.router)

# Azure Maps Token & Global Geocoding Search
api_router.include_router(maps.router)

# Realtime Server-Sent Events Stream
api_router.include_router(stream.router)

# One-Tap Recommendations & Dispatch Fixes
api_router.include_router(recommendations.router)

# Cryptographic Audit Log & Verification
api_router.include_router(audit.router)

# Real Outcome Analytics
api_router.include_router(analytics.router)
