from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models.simulations import Decision
from app.schemas.simulations import SimulationRead, SimulationApplyDecision
from app.api.v1.endpoints.simulations import apply_simulation_decision
from app.core.errors import EntityNotFoundException
from app.auth.dependencies import require_permission
from app.auth.principal import PermissionEnum, RequestPrincipal

router = APIRouter(prefix="/decisions", tags=["Decisions"])

class DecisionRead(BaseModel):
    id: str
    simulation_id: str
    incident_id: Optional[str] = None
    workspace_id: str
    applied_by: str
    applied_at: str
    impact_summary: str
    changes_json: Dict[str, Any] = {}

    model_config = {"from_attributes": True}

@router.get("", response_model=List[DecisionRead])
async def list_decisions(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all recorded decision history directly from PostgreSQL."""
    ws = workspace_id or "ws-continental-fleet-01"
    stmt = select(Decision).where(Decision.workspace_id == ws).order_by(Decision.created_at.desc())
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        DecisionRead(
            id=d.id,
            simulation_id=d.simulation_id,
            incident_id=d.incident_id,
            workspace_id=d.workspace_id,
            applied_by=d.applied_by,
            applied_at=d.applied_at,
            impact_summary=d.impact_summary,
            changes_json=d.changes_json or {},
        ) for d in rows
    ]

@router.get("/{decision_id}", response_model=DecisionRead)
async def get_decision(decision_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve specific decision audit record from PostgreSQL."""
    stmt = select(Decision).where(or_(Decision.id == decision_id, Decision.simulation_id == decision_id))
    result = await db.execute(stmt)
    d = result.scalars().first()
    if not d:
        raise EntityNotFoundException("Decision", decision_id)
    return DecisionRead(
        id=d.id,
        simulation_id=d.simulation_id,
        incident_id=d.incident_id,
        workspace_id=d.workspace_id,
        applied_by=d.applied_by,
        applied_at=d.applied_at,
        impact_summary=d.impact_summary,
        changes_json=d.changes_json or {},
    )

@router.post("/{decision_id}/apply", response_model=SimulationRead)
async def apply_decision(
    decision_id: str,
    req: SimulationApplyDecision,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.APPLY_DECISION)),
):
    """Apply an evaluated decision scenario directly by decision ID."""
    return await apply_simulation_decision(sim_id=decision_id, req=req, db=db, principal=principal)
