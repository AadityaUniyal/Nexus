import uuid
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.models.system import Feedback
from pydantic import BaseModel

router = APIRouter()

class FeedbackCreate(BaseModel):
    category: str = "GENERAL"
    rating: int = 5
    comment: str

@router.post("")
async def submit_feedback(
    req: FeedbackCreate,
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
):
    fb = Feedback(
        id=f"fbk-{uuid.uuid4().hex[:10]}",
        workspace_id=principal.workspace_id if principal else None,
        user_id=principal.nexus_user_id if principal else None,
        category=req.category,
        rating=req.rating,
        comment=req.comment
    )
    db.add(fb)
    await db.commit()
    return {"success": True, "feedbackId": fb.id, "status": "LOGGED"}
