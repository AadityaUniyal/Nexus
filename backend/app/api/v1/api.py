from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    me,
    onboarding,
    operations,
    incidents,
    simulations,
    decisions,
    world,
    notifications,
    analytics,
    intelligence,
    reports,
    search,
    briefing,
    feedback,
    admin,
    ai,
    health,
    realtime,
    location,
    voice,
    weather,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(
    onboarding.router,
    prefix="/onboarding",
    tags=["onboarding"],
)
api_router.include_router(
    location.router,
    prefix="/location",
    tags=["location"],
)
api_router.include_router(voice.router)
api_router.include_router(weather.router)
api_router.include_router(operations.router)
api_router.include_router(incidents.router)
api_router.include_router(simulations.router)
api_router.include_router(decisions.router)
api_router.include_router(world.router, prefix="/world", tags=["world"])
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(
    intelligence.router,
    prefix="/intelligence",
    tags=["intelligence"],
)
api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"],
)
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(
    briefing.router,
    prefix="/briefing",
    tags=["briefing"],
)
api_router.include_router(
    feedback.router,
    prefix="/feedback",
    tags=["feedback"],
)
api_router.include_router(admin.router)
api_router.include_router(ai.router)
api_router.include_router(health.router)
api_router.include_router(realtime.router)
