"""
NEXUS Historical Services & Time-Travel Fleet API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.services.history_service import HistoryService
from app.core.cache import entity_cache

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/services")
async def get_historical_services(
    days: int = Query(30, ge=1, le=365, description="Historical lookback window in days"),
    sector: Optional[str] = Query(None, description="Filter by operational sector"),
    status: Optional[str] = Query(None, description="Filter by status (COMPLETED, COMPLETED_WITH_EXCEPTION)"),
    limit: int = Query(50, ge=1, le=200, description="Max historical service records"),
    city: str = Query("Dehradun", description="Operational hub base city")
):
    """
    Retrieve past fulfilled services, delivery accuracy, time recovered, and cost savings.
    """
    try:
        return await HistoryService.get_past_services(
            time_range_days=days,
            sector=sector,
            status=status,
            limit=limit,
            city=city
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical services: {str(e)}"
        )

@router.get("/fleet-snapshot")
async def get_time_travel_fleet_snapshot(
    timestamp: Optional[float] = Query(None, description="Target epoch timestamp for historical replay"),
    city: str = Query("Dehradun", description="Operational base city")
):
    """
    Reconstruct the exact spatial, telemetry, and battery/cargo status of the fleet at any historical timestamp.
    """
    try:
        return await HistoryService.get_fleet_time_travel_snapshot(
            timestamp_epoch=timestamp,
            city=city
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate historical fleet snapshot: {str(e)}"
        )

@router.get("/trends")
async def get_historical_trends(
    months: int = Query(6, ge=1, le=24, description="Lookback window in months")
):
    """
    Retrieve monthly and quarterly aggregate efficiency trends, carbon offsets, and SLA improvements.
    """
    try:
        return await HistoryService.get_service_sla_trends(months_count=months)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate trend analytics: {str(e)}"
        )

@router.get("/cache-metrics")
async def get_cache_performance_metrics():
    """
    Retrieve real-time cache hit ratios, LRU eviction stats, and latency metrics.
    """
    return entity_cache.get_metrics()
