import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

logger = logging.getLogger("nexus.contact")

router = APIRouter()

class ContactSubmission(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    company: Optional[str] = None
    message: str = Field(..., min_length=5)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contact(contact: ContactSubmission, db: AsyncSession = Depends(get_db)):
    """
    Handle user contact submission.
    """
    try:
        logger.info(f"Contact form received from {contact.email} ({contact.name})")
        return {
            "status": "success",
            "message": "Thank you for reaching out to Nexus Command. An operations representative will contact you shortly."
        }
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact request")
