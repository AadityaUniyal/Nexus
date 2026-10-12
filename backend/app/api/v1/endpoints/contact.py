import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.system import Feedback

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
    Handle and persist user contact submission to PostgreSQL.
    """
    try:
        logger.info(f"Contact form received from {contact.email} ({contact.name})")
        fb = Feedback(
            id=f"fb-contact-{uuid.uuid4().hex[:8]}",
            category="CONTACT_REQUEST",
            rating=5,
            comment=f"From: {contact.name} <{contact.email}> (Company: {contact.company or 'N/A'})\n\nMessage: {contact.message}",
        )
        db.add(fb)
        await db.commit()
        return {
            "status": "success",
            "message": "Thank you for reaching out to Nexus Command. An operations representative will contact you shortly."
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact request")

class SupportTicketCreate(BaseModel):
    subject: str = Field(..., min_length=3)
    severity: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    category: str = Field(default="DISPATCH_ASSISTANCE", description="DISPATCH_ASSISTANCE, HARDWARE_ISSUE, ROUTE_OBSTRUCTION, SYSTEM_BUG")
    description: str = Field(..., min_length=5)
    name: Optional[str] = "Operator"
    email: Optional[str] = "dispatch@continental-fleet.com"
    entity_id: Optional[str] = None

IN_MEMORY_TICKETS = [
    {
        "id": "TCK-8021",
        "subject": "Auxiliary refrigeration telemetry reporting anomaly on Route RT-CHI-DEN-01",
        "severity": "HIGH",
        "category": "HARDWARE_ISSUE",
        "status": "IN_PROGRESS",
        "description": "Temperature fluctuation detected on cargo bay 2 (+3.2C). Requesting live diagnostics.",
        "name": "Alex Rivera",
        "email": "alex.rivera@continental-logistics.com",
        "entity_id": "v-trk-109",
        "created_at": "2026-10-12T14:20:00Z",
    },
    {
        "id": "TCK-8019",
        "subject": "Dehradun Hub Bay 4 automated weighbridge sensor calibration request",
        "severity": "LOW",
        "category": "DISPATCH_ASSISTANCE",
        "status": "RESOLVED",
        "description": "Scale zero-balance drifted by 120kg. Recalibration completed by field technician.",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@continental-logistics.com",
        "entity_id": "wh-ded-01",
        "created_at": "2026-10-11T09:15:00Z",
    }
]

@router.post("/support/tickets", status_code=status.HTTP_201_CREATED)
async def create_support_ticket(ticket: SupportTicketCreate, db: AsyncSession = Depends(get_db)):
    """Create an operational dispatch or platform assistance ticket."""
    ticket_id = f"TCK-{uuid.uuid4().hex[:6].upper()}"
    new_ticket = {
        "id": ticket_id,
        "subject": ticket.subject,
        "severity": ticket.severity,
        "category": ticket.category,
        "status": "OPEN",
        "description": ticket.description,
        "name": ticket.name,
        "email": ticket.email,
        "entity_id": ticket.entity_id,
        "created_at": "2026-10-12T20:55:00Z",
    }
    IN_MEMORY_TICKETS.insert(0, new_ticket)

    try:
        fb = Feedback(
            id=ticket_id,
            category=f"SUPPORT_{ticket.category}",
            rating=5,
            comment=f"Subject: {ticket.subject}\nSeverity: {ticket.severity}\nEntity: {ticket.entity_id}\n\n{ticket.description}",
        )
        db.add(fb)
        await db.commit()
    except Exception:
        await db.rollback()

    logger.info(f"Support ticket {ticket_id} created: {ticket.subject}")
    return {
        "status": "SUCCESS",
        "ticketId": ticket_id,
        "message": f"Support ticket {ticket_id} has been dispatched to Level-2 Operations Support.",
        "ticket": new_ticket,
    }

@router.get("/support/tickets")
async def list_support_tickets():
    """Retrieve operational dispatch assistance and support tickets."""
    return IN_MEMORY_TICKETS

