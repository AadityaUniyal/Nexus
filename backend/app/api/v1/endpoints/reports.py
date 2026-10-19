import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.auth.dependencies import require_onboarded, require_permission
from app.auth.principal import PermissionEnum, RequestPrincipal
from app.models.system import Report
from app.services.analytics_service import AnalyticsService
from pydantic import BaseModel

router = APIRouter()

class ReportCreate(BaseModel):
    title: str
    type: str = "DAILY_BRIEFING"
    summary: Optional[str] = None

@router.get("")
async def get_reports(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_REPORTS)),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    stmt = select(Report).where(Report.workspace_id == ws_id).order_by(desc(Report.created_at))
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "type": r.type,
            "generatedAt": r.generated_at,
            "author": r.author,
            "summary": r.summary,
            "kpis": r.kpis
        }
        for r in reports
    ]

@router.post("")
async def create_report(
    req: ReportCreate,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_REPORTS)),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Calculate live KPIs for report payload
    overview = await AnalyticsService.get_overview(db, workspace_id=ws_id)
    kpis = {
        "slaCompliance": overview["slaComplianceRate"],
        "throughput": overview["totalNetworkUnits"],
        "activeVehicles": overview["fleetSummary"]["activeVehicles"],
        "activeIncidents": overview["incidentsSummary"]["activeIncidents"],
    }

    report = Report(
        id=f"rep-{uuid.uuid4().hex[:10]}",
        workspace_id=ws_id,
        title=req.title,
        type=req.type,
        author=principal.display_name,
        summary=req.summary or f"Recorded workspace snapshot: {overview['fleetSummary']['totalVehicles']} vehicles, {overview['ordersSummary']['total']} orders, and {overview['incidentsSummary']['activeIncidents']} active incidents.",
        kpis=kpis,
        generated_at=now_iso
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("/board-briefing.pdf")
@router.get("/download-pdf")
async def download_board_briefing_pdf(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_REPORTS)),
):
    """The legacy static briefing is disabled until factual workspace reports exist."""
    raise HTTPException(
        status_code=503,
        detail="PDF briefing export is unavailable until workspace-backed report content is implemented.",
    )
