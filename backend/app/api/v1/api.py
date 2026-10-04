from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    ai_chat,
    analytics,
    events,
    auth,
    briefing,
    contact,
    copilot,
    decisions,
    feedback,
    governance,
    health,
    import_data,
    incidents,
    intelligence,
    location,
    me,
    notifications,
    onboarding,
    operations,
    organizations,
    overview,
    profile,
    realtime,
    reports,
    search,
    settings,
    simulations,
    telemetry,
    voice,
    weather,
    webhooks,
    world,
)

api_router = APIRouter()

# System & Multi-Tenant Identity
api_router.include_router(overview.router)
api_router.include_router(auth.router)
api_router.include_router(organizations.router)
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(profile.router, prefix="/me/profile", tags=["me"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(settings.router, prefix="/me/settings", tags=["me"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(health.router)
api_router.include_router(realtime.router)
api_router.include_router(webhooks.router)

# Real Data Ingestion & Telematics
api_router.include_router(import_data.router)
api_router.include_router(telemetry.router)

# Operations & Spatial Fleet Intelligence
api_router.include_router(location.router, prefix="/location", tags=["location"])
api_router.include_router(voice.router)
api_router.include_router(weather.router)
api_router.include_router(operations.router)
api_router.include_router(incidents.router)
api_router.include_router(simulations.router)
api_router.include_router(decisions.router)
api_router.include_router(world.router, prefix="/world", tags=["world"])

# AI Copilot & Human-in-the-Loop Governance
api_router.include_router(copilot.router)
api_router.include_router(governance.router)

# Analytics, Intelligence & Administration
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(briefing.router, prefix="/briefing", tags=["briefing"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(admin.router)
api_router.include_router(ai_chat.router)
api_router.include_router(events.router)
