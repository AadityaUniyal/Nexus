from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.auth.dependencies import get_current_user_claims
from app.models.workspace import Workspace, WorkspaceMember

router = APIRouter(tags=["User Profile"])


@router.get("/me")
async def get_current_user_profile(
    claims: dict = Depends(get_current_user_claims),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns authenticated user profile and workspace state.
    If the user has no workspace membership, returns needs_onboarding: True.
    """
    sub = claims.get("sub", "")
    email = claims.get("email") or f"{sub}@nexus.user"
    display_name = claims.get("name") or "Operator"

    # Query all workspace memberships for this user
    stmt = (
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == sub)
    )
    res = await db.execute(stmt)
    rows = res.all()

    if not rows:
        return {
            "id": sub,
            "email": email,
            "name": display_name,
            "needs_onboarding": True,
            "workspace": None,
            "memberships": [],
        }

    first_member, first_workspace = rows[0]
    memberships_data = [
        {
            "workspace_id": ws.id,
            "workspace_name": ws.name,
            "role": m.role,
        }
        for m, ws in rows
    ]

    return {
        "id": sub,
        "email": email,
        "name": display_name,
        "needs_onboarding": False,
        "role": first_member.role,
        "workspace": {
            "id": first_workspace.id,
            "name": first_workspace.name,
            "country": first_workspace.country,
            "timezone": first_workspace.timezone,
            "locale": first_workspace.locale,
            "distance_unit": first_workspace.distance_unit,
        },
        "memberships": memberships_data,
    }
