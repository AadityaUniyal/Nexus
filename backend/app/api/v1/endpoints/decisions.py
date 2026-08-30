from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.simulations import SimulationRead, SimulationApplyDecision
from app.api.v1.endpoints.simulations import apply_simulation_decision

router = APIRouter(prefix="/decisions", tags=["Decisions"])

@router.post("/{decision_id}/apply", response_model=SimulationRead)
async def apply_decision(
    decision_id: str,
    req: SimulationApplyDecision,
    db: AsyncSession = Depends(get_db)
):
    """Apply an evaluated decision scenario directly by decision ID."""
    return await apply_simulation_decision(sim_id=decision_id, req=req, db=db)
