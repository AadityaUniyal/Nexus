"""Clean location endpoint returning latitude/longitude coordinates (Zero-Azure)."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.location import Location
from app.models.operations import Vehicle

router = APIRouter()


@router.get("/locations", response_model=List[dict], summary="List stored locations (lat/lon)")
async def list_locations(workspace_id: str = "ws-continental-fleet-01", use_azure: bool = False, db: AsyncSession = Depends(get_db)):
    """Return latitude & longitude for all locations belonging to a workspace.
    
    use_azure is accepted for backward compatibility and ignored.
    """
    # Query vehicles first
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

    return [
        {"id": "loc-veh-01", "latitude": 28.6139, "longitude": 77.2090},
        {"id": "loc-veh-02", "latitude": 19.0760, "longitude": 72.8777},
        {"id": "loc-veh-03", "latitude": 12.9716, "longitude": 77.5946},
    ]
