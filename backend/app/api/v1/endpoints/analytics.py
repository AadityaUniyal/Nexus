from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & BI Engine"])

@router.get("/overview")
async def get_analytics_overview(
    timeframe: str = Query("24h", description="Timeframe: 24h, 7d, 30d, 90d"),
    hub_id: Optional[str] = Query(None, description="Filter by warehouse hub ID"),
    workspace_id: Optional[str] = Query(None, description="Filter by workspace ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve live operational KPI trends, SLA compliance, hub throughput,
    and fleet performance aggregated dynamically from the PostgreSQL database.
    """
    return await AnalyticsService.get_overview(
        db=db,
        workspace_id=workspace_id,
        timeframe=timeframe,
        hub_id=hub_id
    )

@router.get("/export")
async def export_analytics(
    format: str = Query("csv", description="Format: csv or json"),
    timeframe: str = Query("24h"),
    workspace_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Export raw operational analytics and order performance report as CSV or JSON file.
    """
    if format.lower() == "csv":
        csv_data = await AnalyticsService.export_csv_report(db, workspace_id=workspace_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=nexus-analytics-{timeframe}.csv"
            }
        )

    overview = await AnalyticsService.get_overview(db, workspace_id=workspace_id, timeframe=timeframe)
    return overview

@router.get("/hubs")
async def get_hubs_throughput(
    workspace_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve real-time capacity vs volume for all registered regional warehouses/hubs.
    """
    overview = await AnalyticsService.get_overview(db, workspace_id=workspace_id)
    return {
        "success": True,
        "hubs": overview.get("hubThroughput", []),
        "totalNetworkUnits": overview.get("totalNetworkUnits", 0)
    }
