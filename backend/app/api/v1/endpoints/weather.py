from fastapi import APIRouter, Query
from app.integrations.weather import open_meteo_provider

router = APIRouter(prefix="/weather", tags=["Road Weather & Hazard Intelligence"])

@router.get("/point")
async def get_point_weather(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
):
    """Fetch real-time road meteorological data and hazard status via Open-Meteo (100% Free)."""
    return await open_meteo_provider.get_point_weather(latitude, longitude)

@router.get("/corridor-hazards")
async def get_corridor_hazards():
    """Get active meteorological hazards along major freight arteries."""
    cheyenne = await open_meteo_provider.get_point_weather(41.1399, -104.8202)
    rockies = await open_meteo_provider.get_point_weather(39.7392, -104.9903)
    chicago = await open_meteo_provider.get_point_weather(41.8781, -87.6298)

    return {
        "active_hazards": [
            {
                "corridor": "I-80 Wyoming / Nebraska Pass",
                "location": "Cheyenne Summit",
                "data": cheyenne,
            },
            {
                "corridor": "I-70 Colorado Rockies Arterial",
                "location": "Denver Metro",
                "data": rockies,
            },
            {
                "corridor": "I-90 / I-94 Midwest Superhub",
                "location": "Chicago Central",
                "data": chicago,
            },
        ],
        "provider": "open-meteo",
    }
