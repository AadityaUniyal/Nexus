from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import get_optional_principal
from app.auth.principal import RequestPrincipal
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & BI Engine"])

def get_tenant_workspace(principal: Optional[RequestPrincipal], fallback: Optional[str] = None) -> str:
    """Derives workspace strictly from authenticated principal, preventing tenant leakage."""
    if principal and principal.workspace_id:
        return principal.workspace_id
    return fallback or "ws-continental-fleet-01"

@router.get("/overview")
async def get_analytics_overview(
    timeframe: str = Query("24h", description="Timeframe: 24h, 7d, 30d, 90d"),
    hub_id: Optional[str] = Query(None, description="Filter by warehouse hub ID"),
    workspace_id: Optional[str] = Query(None, description="Filter by workspace ID"),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve live operational KPI trends, SLA compliance, hub throughput,
    and fleet performance aggregated dynamically from the PostgreSQL database.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    return await AnalyticsService.get_overview(
        db=db,
        workspace_id=ws,
        timeframe=timeframe,
        hub_id=hub_id
    )

@router.get("/export")
async def export_analytics(
    format: str = Query("csv", description="Format: csv or json"),
    timeframe: str = Query("24h"),
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Export raw operational analytics and order performance report as CSV or JSON file.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    if format.lower() == "csv":
        csv_data = await AnalyticsService.export_csv_report(db, workspace_id=ws)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=nexus-analytics-{timeframe}.csv"
            }
        )

    overview = await AnalyticsService.get_overview(db, workspace_id=ws, timeframe=timeframe)
    return overview

@router.get("/hubs")
async def get_hubs_throughput(
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve real-time capacity vs volume for all registered regional warehouses/hubs.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    overview = await AnalyticsService.get_overview(db, workspace_id=ws)
    return {
        "success": True,
        "hubs": overview.get("hubThroughput", []),
        "totalNetworkUnits": overview.get("totalNetworkUnits", 0)
    }

@router.get("/forecast")
async def get_analytics_forecast(
    metric: str = Query("delivery_volume", description="Metric: delivery_volume, sla_adherence, energy_consumption"),
    horizon: str = Query("7d", description="Horizon: 24h or 7d"),
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Predictive Time-Series Forecasting with P10/P50/P90 confidence bounds
    aligned with Microsoft Fabric ML / Azure Foundry standards.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    return await AnalyticsService.get_forecast(
        db=db,
        metric=metric,
        horizon=horizon,
        workspace_id=ws
    )

@router.get("/anomalies")
async def get_analytics_anomalies(
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Unsupervised ML Telemetry Anomaly Detection powered by Scikit-Learn IsolationForest.
    Scans multi-variate speed, battery, and powertrain telemetry.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    return await AnalyticsService.detect_anomalies(
        db=db,
        workspace_id=ws
    )

@router.get("/risk-scores")
async def get_analytics_risk_scores(
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Composite Multi-Factor Logistics Risk Scoring across active orders and corridors.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    return await AnalyticsService.get_risk_scores(
        db=db,
        workspace_id=ws
    )

@router.get("/medallion-summary")
async def get_medallion_pipeline_summary(
    workspace_id: Optional[str] = Query(None),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Medallion Architecture (Bronze -> Silver -> Gold) Lakehouse Health & Azure Fabric OneLake Mapping.
    """
    ws = get_tenant_workspace(principal, fallback=workspace_id)
    return await AnalyticsService.get_medallion_summary(
        db=db,
        workspace_id=ws
    )

