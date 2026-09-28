import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.models.system import Feedback
from pydantic import BaseModel, Field

logger = logging.getLogger("nexus.feedback")

router = APIRouter()

class FeedbackCreate(BaseModel):
    category: str = Field("GENERAL", description="Category: GENERAL, BUG, FEATURE, PERFORMANCE")
    rating: int = Field(5, ge=1, le=5)
    comment: str = Field(..., min_length=2)

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    req: FeedbackCreate,
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit platform feedback and store in database.
    """
    try:
        fb = Feedback(
            id=f"fbk-{uuid.uuid4().hex[:10]}",
            workspace_id=principal.workspace_id if principal else "ws-demo-1",
            user_id=principal.nexus_user_id if principal else None,
            category=req.category.upper(),
            rating=req.rating,
            comment=req.comment
        )
        db.add(fb)
        await db.commit()
        return {"success": True, "feedbackId": fb.id, "status": "LOGGED"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error persisting feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to record feedback")
