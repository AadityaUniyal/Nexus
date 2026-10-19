"""Clean location endpoint returning latitude/longitude coordinates (Zero-Azure)."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.location import Location
from app.models.operations import Vehicle
from app.auth.dependencies import require_workspace
from app.auth.principal import RequestPrincipal

router = APIRouter()


@router.get("/locations", response_model=List[dict], summary="List stored locations (lat/lon)")
async def list_locations(principal: RequestPrincipal = Depends(require_workspace), use_azure: bool = False, db: AsyncSession = Depends(get_db)):
    """Return latitude & longitude for all locations belonging to a workspace.
    
    use_azure is accepted for backward compatibility and ignored.
    """
    # Query vehicles first
    workspace_id = principal.workspace_id
    v_stmt = select(Vehicle.id, Vehicle.current_lat, Vehicle.current_lng, Vehicle.name).where(Vehicle.workspace_id == workspace_id)
    v_res = await db.execute(v_stmt)
    v_rows = v_res.all()
    if v_rows:
        return [{"id": row.id, "latitude": row.current_lat, "longitude": row.current_lng, "name": row.name} for row in v_rows]

    # Fallback to locations table
    stmt = select(Location.id, Location.latitude, Location.longitude).where(Location.workspace_id == workspace_id)
    result = await db.execute(stmt)
    rows = result.all()
    if rows:
        return [{"id": row.id, "latitude": row.latitude, "longitude": row.longitude} for row in rows]

    return []
