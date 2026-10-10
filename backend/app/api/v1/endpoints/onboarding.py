import uuid
import zoneinfo
from typing import Dict, Any, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import get_current_user_claims
from app.models.workspace import Workspace, WorkspaceMember
from app.services.audit_service import append_audit_entry

router = APIRouter(tags=["Onboarding"])


class OnboardingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    country: str = Field(..., min_length=2, max_length=2)
    timezone: str = Field(...)
    locale: str = Field(default="en-US", max_length=16)
    distance_unit: Literal["km", "mi"] = "km"

    @field_validator("timezone")
    @classmethod
    def validate_iana_timezone(cls, v: str) -> str:
        try:
            zoneinfo.ZoneInfo(v)
            return v
        except Exception:
            raise ValueError(f"'{v}' is not a valid IANA timezone identifier")

    @field_validator("country")
    @classmethod
    def validate_country_code(cls, v: str) -> str:
        upper = v.strip().upper()
        if len(upper) != 2 or not upper.isalpha():
            raise ValueError("Country must be a valid 2-letter ISO country code")
        return upper


@router.post("/onboarding")
async def complete_onboarding(
    payload: OnboardingRequest,
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Creates a new workspace during single-step onboarding and assigns the user as owner.
    Fails with 422 if timezone is not a valid IANA id or country is invalid.
    """
    sub = claims.get("sub", "")
    email = claims.get("email") or f"{sub}@nexus.user"
    display_name = claims.get("name") or "Operator"

    # Check if user already owns a workspace
    stmt = (
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == sub)
    )
    res = await db.execute(stmt)
    existing = res.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already belongs to a workspace"
        )

    workspace = Workspace(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        country=payload.country,
        timezone=payload.timezone,
        locale=payload.locale,
        distance_unit=payload.distance_unit,
    )
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(
        id=str(uuid.uuid4()),
        workspace_id=workspace.id,
        user_id=sub,
        email=email,
        name=display_name,
        role="owner",
    )
    db.add(member)
    await db.flush()

    await append_audit_entry(
        db=db,
        workspace_id=workspace.id,
        actor_id=sub,
        action="create_workspace",
        entity_type="workspace",
        entity_id=workspace.id,
        payload={
            "workspace_name": workspace.name,
            "country": workspace.country,
            "timezone": workspace.timezone,
            "locale": workspace.locale,
            "distance_unit": workspace.distance_unit,
        }
    )
    await db.commit()

    return {
        "status": "success",
        "workspace": {
            "id": workspace.id,
            "name": workspace.name,
            "country": workspace.country,
            "timezone": workspace.timezone,
            "locale": workspace.locale,
            "distance_unit": workspace.distance_unit,
        },
        "role": "owner",
    }
