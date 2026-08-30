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
        # Default sample report
        return [
            {
                "id": "rep-daily-1",
                "title": "Daily Continental Logistics Briefing",
                "type": "DAILY_BRIEFING",
                "generatedAt": "2026-08-30T06:00:00Z",
                "author": "Sarah Chen",
                "summary": "Executive operational summary detailing fleet utilization, bottleneck resolutions, and 98.4% SLA compliance.",
                "kpis": {
                    "slaCompliance": 98.4,
                    "throughput": 14200,
                    "activeVehicles": 30
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
    report = Report(
        id=f"rep-{uuid.uuid4().hex[:10]}",
        workspace_id=ws_id,
        title=req.title,
        type=req.type,
        author=principal.display_name,
        summary=req.summary or "Executive briefing detailing network throughput and incident resolutions.",
        kpis={"slaCompliance": 98.6, "throughput": 15400, "activeVehicles": 32},
        generated_at=now_iso
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
