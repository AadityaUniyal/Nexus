from typing import List, Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.auth.dependencies import require_workspace, require_permission
from app.auth.principal import RequestPrincipal, PermissionEnum
from app.models.governance import Approval, ActionExecution, AuditEvent
from app.models.operations import Vehicle
from app.models.incidents import Incident, IncidentTimeline
from app.core.errors import EntityNotFoundException, NexusException
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
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.APPLY_DECISION)),
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
    ).with_for_update()
    res = await db.execute(stmt)
    appr = res.scalar_one_or_none()
    if not appr:
        raise EntityNotFoundException("Approval", approval_id)

    decision = req.decision.upper()
    if decision not in {"APPROVE", "REJECT"}:
        raise NexusException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_APPROVAL_DECISION",
            message="Decision must be APPROVE or REJECT.",
        )
    if appr.status != "PENDING":
        raise NexusException(
            status_code=status.HTTP_409_CONFLICT,
            code="APPROVAL_ALREADY_PROCESSED",
            message="This approval is no longer pending.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    if decision == "APPROVE":
        if appr.action_type != "REROUTE_VEHICLE":
            raise NexusException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                code="UNSUPPORTED_APPROVAL_ACTION",
                message=f"Action type '{appr.action_type}' cannot be executed by this endpoint.",
            )
        changes = appr.proposed_changes_json or {}
        vehicle_code = changes.get("vehicle_code")
        new_route_name = changes.get("new_route_name")
        if not vehicle_code:
            raise NexusException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                code="APPROVAL_TARGET_MISSING",
                message="The approval does not identify a vehicle.",
            )
        if not isinstance(new_route_name, str) or not new_route_name.strip():
            raise NexusException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                code="APPROVAL_ROUTE_MISSING",
                message="The approval does not specify a target route.",
            )
        v_stmt = select(Vehicle).where(
            Vehicle.workspace_id == principal.workspace_id,
            Vehicle.code == vehicle_code,
        )
        v_res = await db.execute(v_stmt)
        vehicle = v_res.scalar_one_or_none()
        if not vehicle:
            raise EntityNotFoundException("Vehicle", vehicle_code)

        incident = None
        if appr.incident_id:
            inc_stmt = select(Incident).where(
                Incident.id == appr.incident_id,
                Incident.workspace_id == principal.workspace_id,
            )
            inc_res = await db.execute(inc_stmt)
            incident = inc_res.scalar_one_or_none()
            if not incident:
                raise EntityNotFoundException("Incident", appr.incident_id)

        appr.status = "APPROVED"
        appr.approved_by = principal.display_name
        appr.approved_at = now_iso

        # Execute the operational change
        execution = ActionExecution(
            approval_id=appr.id,
            action_type=appr.action_type,
            target_entity_type="VEHICLE",
            target_entity_id=vehicle.code,
            parameters_json=appr.proposed_changes_json,
            status="SUCCESS",
            result_summary=f"Nexus dispatch record updated for {vehicle.code}: {appr.impact_summary}",
            executed_by=principal.display_name,
            executed_at=now_iso,
            workspace_id=principal.workspace_id,
        )
        db.add(execution)

        if incident:
            incident.status = "ACTION_APPLIED"
            db.add(IncidentTimeline(
                incident_id=incident.id,
                status="ACTION_APPLIED",
                note=f"Approval recorded by {principal.display_name}: {appr.impact_summary}",
                actor_name=principal.display_name,
            ))

        vehicle.current_route_name = new_route_name

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
