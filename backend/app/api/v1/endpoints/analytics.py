from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.services.analytics_service import get_workspace_analytics

router = APIRouter(prefix="/analytics", tags=["Outcomes & Analytics"])


@router.get("")
async def get_analytics(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Computes and returns outcome analytics computed strictly from real completed jobs.
    Honest empty state when sample size is below threshold (AC-78, AC-79, AC-80).
    """
    metrics = await get_workspace_analytics(db, principal.workspace_id)
    return metrics
