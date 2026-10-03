'''Simple location endpoint returning latitude/longitude pairs.
Provides a lightweight read‑only view of stored locations for a given workspace.
All configuration (including DB engine choice) is resolved via the dual_engine helper.'''

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.dual_engine import get_engine
from app.models.location import Location
from typing import List

router = APIRouter()

@router.get("/locations", response_model=List[dict], summary="List stored locations (lat/lon)")
async def list_locations(workspace_id: str, use_azure: bool = False, db: AsyncSession = Depends(get_db)):
    """Return latitude & longitude for all locations belonging to a workspace.

    Parameters
    ----------
    workspace_id: str
        Identifier of the workspace whose locations are requested.
    use_azure: bool = False
        When ``True`` the Azure PostgreSQL engine is used; otherwise Neon.
    db: AsyncSession
        Session injected by FastAPI (unused – kept for consistency).
    """
    # Ensure the appropriate engine is initialized (no‑op if already bound).
    engine = get_engine(use_azure)
    # Query locations for the workspace.
    stmt = select(Location.id, Location.latitude, Location.longitude).where(Location.workspace_id == workspace_id)
    result = await db.execute(stmt)
    rows = result.all()
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No locations found for workspace")
    return [{"id": row.id, "latitude": row.latitude, "longitude": row.longitude} for row in rows]
