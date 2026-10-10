import uuid
import secrets
import zoneinfo
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.auth.dependencies import (
    get_current_principal,
    get_current_user_claims,
    require_owner,
)
from app.auth.principal import RequestPrincipal
from app.auth.driver_auth import hash_token
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceInvite
from app.services.audit_service import append_audit_entry

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


class WorkspaceUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=128)
    timezone: Optional[str] = None
    locale: Optional[str] = None
    distance_unit: Optional[Literal["km", "mi"]] = None

    @field_validator("timezone")
    @classmethod
    def validate_iana_tz(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            try:
                zoneinfo.ZoneInfo(v)
            except Exception:
                raise ValueError("Invalid IANA timezone identifier")
        return v


class InviteCreateRequest(BaseModel):
    role: Literal["dispatcher", "viewer"] = "dispatcher"
    expires_in_hours: int = Field(default=48, ge=1, le=168)


class InviteRedeemRequest(BaseModel):
    invite_token: str = Field(..., min_length=10)


@router.get("/current")
async def get_current_workspace(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Workspace).where(Workspace.id == principal.workspace_id)
    res = await db.execute(stmt)
    ws = res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return {
        "id": ws.id,
        "name": ws.name,
        "country": ws.country,
        "timezone": ws.timezone,
        "locale": ws.locale,
        "distance_unit": ws.distance_unit,
        "role": principal.role.value,
    }


@router.patch("/current")
async def update_current_workspace(
    payload: WorkspaceUpdateRequest,
    principal: RequestPrincipal = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Workspace).where(Workspace.id == principal.workspace_id).with_for_update()
    res = await db.execute(stmt)
    ws = res.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    updates = {}
    if payload.name is not None:
        ws.name = payload.name.strip()
        updates["name"] = ws.name
    if payload.timezone is not None:
        ws.timezone = payload.timezone
        updates["timezone"] = ws.timezone
    if payload.locale is not None:
        ws.locale = payload.locale
        updates["locale"] = ws.locale
    if payload.distance_unit is not None:
        ws.distance_unit = payload.distance_unit
        updates["distance_unit"] = ws.distance_unit

    await append_audit_entry(
        db=db,
        workspace_id=ws.id,
        actor_id=principal.user_id,
        action="update_workspace",
        entity_type="workspace",
        entity_id=ws.id,
        payload=updates,
    )
    await db.commit()

    return {
        "id": ws.id,
        "name": ws.name,
        "country": ws.country,
        "timezone": ws.timezone,
        "locale": ws.locale,
        "distance_unit": ws.distance_unit,
    }


@router.get("/members")
async def list_workspace_members(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    stmt = (
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == principal.workspace_id)
        .order_by(WorkspaceMember.created_at)
    )
    res = await db.execute(stmt)
    members = res.scalars().all()
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "email": m.email,
            "name": m.name,
            "role": m.role,
            "created_at": m.created_at.isoformat(),
        }
        for m in members
    ]


@router.post("/invites")
async def create_workspace_invite(
    payload: InviteCreateRequest,
    principal: RequestPrincipal = Depends(require_owner),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    raw_token = secrets.token_urlsafe(32)
    token_h = hash_token(raw_token)
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(hours=payload.expires_in_hours)

    invite = WorkspaceInvite(
        id=str(uuid.uuid4()),
        workspace_id=principal.workspace_id,
        token_hash=token_h,
        role=payload.role,
        created_by_user_id=principal.user_id,
        expires_at=expires_at,
        created_at=now_utc,
    )
    db.add(invite)

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="create_invite",
        entity_type="workspace_invite",
        entity_id=invite.id,
        payload={"role": payload.role, "expires_at": expires_at.isoformat()}
    )
    await db.commit()

    return {
        "invite_token": raw_token,
        "role": payload.role,
        "expires_at": expires_at.isoformat(),
    }


@router.post("/invites/redeem")
async def redeem_workspace_invite(
    payload: InviteRedeemRequest,
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    sub = claims.get("sub", "")
    email = claims.get("email") or f"{sub}@nexus.user"
    display_name = claims.get("name") or "Team Member"

    token_h = hash_token(payload.invite_token)
    stmt = (
        select(WorkspaceInvite)
        .where(WorkspaceInvite.token_hash == token_h)
        .with_for_update()
    )
    res = await db.execute(stmt)
    invite = res.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation link")

    now_utc = datetime.now(timezone.utc)
    if invite.used_at is not None:
        raise HTTPException(status_code=410, detail="Invitation link has already been used")

    if invite.expires_at < now_utc:
        raise HTTPException(status_code=410, detail="Invitation link has expired")

    # Check if already a member
    mem_stmt = select(WorkspaceMember).where(
        and_(WorkspaceMember.workspace_id == invite.workspace_id, WorkspaceMember.user_id == sub)
    )
    mem_res = await db.execute(mem_stmt)
    if mem_res.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a member of this workspace")

    member = WorkspaceMember(
        id=str(uuid.uuid4()),
        workspace_id=invite.workspace_id,
        user_id=sub,
        email=email,
        name=display_name,
        role=invite.role,
    )
    db.add(member)
    invite.used_at = now_utc

    await append_audit_entry(
        db=db,
        workspace_id=invite.workspace_id,
        actor_id=sub,
        action="redeem_invite",
        entity_type="workspace_member",
        entity_id=member.id,
        payload={"role": invite.role, "invite_id": invite.id}
    )
    await db.commit()

    return {
        "status": "success",
        "workspace_id": invite.workspace_id,
        "role": invite.role,
    }
