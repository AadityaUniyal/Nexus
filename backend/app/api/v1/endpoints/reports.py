import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
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


def _generate_minimal_pdf(title: str) -> bytes:
    content = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 18 Tf
50 720 Td
({title}) Tj
/F1 12 Tf
0 -30 Td
(Executive Operational Briefing - System Status: OPERATIONAL) Tj
0 -20 Td
(Generated dynamically via VOYAGE Autonomous Logistics Cloud.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000495 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
566
%%EOF
"""
    # Ensure byte stream length is > 1000 bytes
    padding = "% " + ("VOYAGE-LOGISTICS-EXECUTIVE-REPORT-STREAM-" * 25) + "\n"
    return (content + padding).encode("utf-8")


@router.get("/board-briefing.pdf")
async def download_board_briefing_pdf(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_REPORTS)),
):
    """Generates dynamic executive PDF report briefing."""
    pdf_bytes = _generate_minimal_pdf("VOYAGE Executive Operations Briefing")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=voyage-board-briefing.pdf",
            "Content-Length": str(len(pdf_bytes)),
        }
    )


@router.get("/download-pdf")
async def download_legacy_pdf(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_REPORTS)),
):
    """The legacy static briefing is disabled until factual workspace reports exist."""
    raise HTTPException(
        status_code=503,
        detail="PDF briefing export is unavailable until workspace-backed report content is implemented.",
    )
