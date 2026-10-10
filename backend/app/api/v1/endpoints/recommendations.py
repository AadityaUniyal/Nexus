from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.auth.dependencies import require_dispatcher
from app.auth.principal import RequestPrincipal
from app.models.job import Recommendation
from app.services.recommendation_service import apply_recommendation
from app.realtime.sse import sse_manager

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/{rec_id}/approve")
async def approve_recommendation(
    rec_id: str,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    One-tap approval of a proposed mitigation option (AC-71, AC-72).
    Applies atomically in a single transaction with hash-chained audit logging.
    """
    stmt = (
        select(Recommendation)
        .where(
            and_(
                Recommendation.id == rec_id,
                Recommendation.workspace_id == principal.workspace_id
            )
        )
        .with_for_update()
    )
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    try:
        result = await apply_recommendation(db, rec, principal.user_id)
        await db.commit()

        await sse_manager.broadcast(
            workspace_id=principal.workspace_id,
            event_type="recommendation_approved",
            data={
                "recommendation_id": rec.id,
                "job_id": rec.job_id,
                "action_type": rec.action_type,
                "status": "approved",
            }
        )

        return result
    except ValueError as ve:
        err_msg = str(ve)
        if "RECOMMENDATION_STALE" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="RECOMMENDATION_STALE: Underlying job has changed since this option was computed."
            )
        raise HTTPException(status_code=400, detail=err_msg)
