import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.auth.dependencies import require_onboarded
from app.auth.principal import RequestPrincipal
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
    principal: RequestPrincipal = Depends(require_onboarded),
    db: AsyncSession = Depends(get_db)
):
    ws_id = principal.workspace_id
    stmt = select(Report).where(Report.workspace_id == ws_id).order_by(desc(Report.created_at))
    res = await db.execute(stmt)
    reports = res.scalars().all()
    if not reports:
        # Default report computed live
        overview = await AnalyticsService.get_overview(db, workspace_id=ws_id)
        return [
            {
                "id": "rep-daily-1",
                "title": "Daily Continental Logistics Briefing",
                "type": "DAILY_BRIEFING",
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "author": "Nexus Analytics Engine",
                "summary": f"Executive operational summary detailing fleet performance and {overview['slaComplianceRate']}% SLA compliance.",
                "kpis": {
                    "slaCompliance": overview["slaComplianceRate"],
                    "throughput": overview["totalNetworkUnits"],
                    "activeVehicles": overview["fleetSummary"]["activeVehicles"]
                }
            }
        ]
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
    principal: RequestPrincipal = Depends(require_onboarded),
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
        summary=req.summary or f"Executive briefing detailing {overview['totalNetworkUnits']} network units and {overview['slaComplianceRate']}% SLA compliance.",
        kpis=kpis,
        generated_at=now_iso
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
