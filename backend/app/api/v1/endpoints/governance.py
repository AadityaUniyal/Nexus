from typing import List, Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.auth.dependencies import require_authenticated, require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.models.governance import Approval, ActionExecution, AuditEvent
from app.models.operations import Vehicle
from app.models.incidents import Incident, IncidentTimeline
from app.core.errors import EntityNotFoundException, ForbiddenException
from app.realtime.sse import broadcaster

router = APIRouter(prefix="/governance", tags=["Governance, Human-in-the-Loop & Audit"])

class ApprovalActionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = Field(default="Approved by Operations Command")

class ApprovalRead(BaseModel):
    id: str
    title: str
    description: str
    action_type: str
    impact_summary: str
    cost_delta_usd: float
    time_saved_mins: int
    status: str
    requested_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    incident_id: Optional[str] = None
    simulation_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AuditEventRead(BaseModel):
    id: str
    actor_name: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    reason: str
    ai_involvement: Optional[str] = None
    created_at: Any = None

    model_config = ConfigDict(from_attributes=True)

@router.get("/approvals", response_model=List[ApprovalRead])
async def list_approvals(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    status_filter: Optional[str] = None,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """List pending and resolved operational approvals for tenant workspace."""
    stmt = select(Approval).where(Approval.workspace_id == principal.workspace_id)
    if status_filter:
        stmt = stmt.where(Approval.status == status_filter.upper())
    stmt = stmt.order_by(desc(Approval.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/approvals/{approval_id}/action", response_model=ApprovalRead)
async def process_approval_action(
    approval_id: str,
    req: ApprovalActionRequest,
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """
    Human-in-the-Loop approval gate:
    Authorizes or rejects an AI-recommended operational action.
    Executing an approval mutates operational state under an atomic transaction and produces an audit record.
    """
    stmt = select(Approval).where(
        Approval.id == approval_id,
        Approval.workspace_id == principal.workspace_id
    )
    res = await db.execute(stmt)
    appr = res.scalar_one_or_none()
    if not appr:
        raise EntityNotFoundException("Approval", approval_id)

    now_iso = datetime.now(timezone.utc).isoformat()

    if req.decision.upper() == "APPROVE":
        appr.status = "APPROVED"
        appr.approved_by = principal.display_name
        appr.approved_at = now_iso

        # Execute the operational change
        execution = ActionExecution(
            approval_id=appr.id,
            action_type=appr.action_type,
            target_entity_type="VEHICLE",
            target_entity_id=appr.proposed_changes_json.get("vehicle_code", "NX-104"),
            parameters_json=appr.proposed_changes_json,
            status="SUCCESS",
            result_summary=f"Successfully executed {appr.action_type}: {appr.impact_summary}",
            executed_by=principal.display_name,
            executed_at=now_iso,
            workspace_id=principal.workspace_id,
        )
        db.add(execution)

        # Update Incident if linked
        if appr.incident_id:
            inc_stmt = select(Incident).where(Incident.id == appr.incident_id)
            inc_res = await db.execute(inc_stmt)
            inc = inc_res.scalar_one_or_none()
            if inc:
                inc.status = "ACTION_APPLIED"
                tl = IncidentTimeline(
                    incident_id=inc.id,
                    status="ACTION_APPLIED",
                    note=f"Approved action executed by {principal.display_name}: {appr.impact_summary}",
                    actor_name=principal.display_name,
                )
                db.add(tl)

        # Update Vehicle route if vehicle specified
        v_code = appr.proposed_changes_json.get("vehicle_code")
        if v_code:
            v_stmt = select(Vehicle).where(
                Vehicle.workspace_id == principal.workspace_id,
                Vehicle.code == v_code
            )
            v_res = await db.execute(v_stmt)
            veh = v_res.scalar_one_or_none()
            if veh:
                veh.current_route_name = appr.proposed_changes_json.get("new_route_name", "Detour Route")

        # Append-Only Audit Event
        audit = AuditEvent(
            workspace_id=principal.workspace_id,
            actor_id=principal.nexus_user_id,
            actor_name=principal.display_name,
            actor_role=principal.role.value,
            action=f"APPROVAL_EXECUTED_{appr.action_type}",
            entity_type="APPROVAL",
            entity_id=appr.id,
            reason=req.notes or appr.impact_summary,
            ai_involvement="Nexus Copilot Recommendation",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(appr)

        # Real-time notification
        await broadcaster.broadcast("APPROVAL_EXECUTED", {
            "approval_id": appr.id,
            "status": "APPROVED",
            "action_type": appr.action_type,
            "approved_by": principal.display_name,
            "workspace_id": principal.workspace_id,
        })

    else:
        appr.status = "REJECTED"
        appr.rejection_reason = req.notes or "Rejected by operations manager"
        appr.approved_by = principal.display_name
        appr.approved_at = now_iso

        audit = AuditEvent(
            workspace_id=principal.workspace_id,
            actor_id=principal.nexus_user_id,
            actor_name=principal.display_name,
            actor_role=principal.role.value,
            action="APPROVAL_REJECTED",
            entity_type="APPROVAL",
            entity_id=appr.id,
            reason=appr.rejection_reason,
            ai_involvement="Nexus Copilot Recommendation",
        )
        db.add(audit)
        await db.commit()
        await db.refresh(appr)

    return appr

@router.get("/audit", response_model=List[AuditEventRead])
async def list_audit_events(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve immutable audit log history for tenant organization/workspace."""
    stmt = select(AuditEvent).where(
        AuditEvent.workspace_id == principal.workspace_id
    ).order_by(desc(AuditEvent.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
