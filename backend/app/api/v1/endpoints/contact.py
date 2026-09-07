from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()

class ContactSubmission(BaseModel):
    name: str
    email: str
    company: Optional[str] = None
    message: str

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactSubmission, db: AsyncSession = Depends(get_db)):
    # Simple placeholder logic
    return {"status": "success", "message": "Contact received"}
