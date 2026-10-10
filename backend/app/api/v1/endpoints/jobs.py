import uuid
import zoneinfo
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.auth.dependencies import (
    get_current_principal,
    require_dispatcher,
)
from app.auth.principal import RequestPrincipal
from app.models.driver import Driver
from app.models.job import Job, JobStop, JobEvent, Prediction, Recommendation
from app.services.audit_service import append_audit_entry
from app.core.time_utils import parse_and_validate_local_time
from app.integrations.azure_maps import azure_maps_client, AzureMapsException

router = APIRouter(prefix="/jobs", tags=["Jobs"])

VALID_TRANSITIONS = {
    "unassigned": ["assigned", "cancelled"],
    "assigned": ["in_progress", "unassigned", "cancelled"],
    "in_progress": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}


class StopInput(BaseModel):
    sequence: int = Field(..., ge=1)
    stop_type: Literal["pickup", "dropoff"]
    address: str = Field(..., min_length=3, max_length=512)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    tz: str = Field(...)
    # Supports either direct UTC or local time with fold disambiguation
    window_start: Optional[datetime] = None
    window_end: Optional[datetime] = None
    window_start_local: Optional[str] = None
    window_end_local: Optional[str] = None
    fold: Optional[int] = Field(None, ge=0, le=1)

    @field_validator("tz")
    @classmethod
    def validate_tz(cls, v: str) -> str:
        try:
            zoneinfo.ZoneInfo(v)
            return v
        except Exception:
            raise ValueError(f"Invalid IANA timezone identifier: {v}")


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    driver_id: Optional[str] = None
    stops: List[StopInput] = Field(..., min_length=2)


class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    driver_id: Optional[str] = None
    status: Optional[str] = None


class RoutePreviewRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float


@router.get("")
async def list_jobs(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    stmt = (
        select(Job)
        .options(
            selectinload(Job.stops),
            selectinload(Job.predictions),
            selectinload(Job.recommendations)
        )
        .where(Job.workspace_id == principal.workspace_id)
        .order_by(desc(Job.created_at))
    )
    res = await db.execute(stmt)
    jobs = res.scalars().all()

    output = []
    for j in jobs:
        sorted_stops = sorted(j.stops, key=lambda s: s.sequence)
        latest_pred = j.predictions[-1] if j.predictions else None
        active_recs = [r for r in j.recommendations if r.status == "proposed"]

        output.append({
            "id": j.id,
            "workspace_id": j.workspace_id,
            "driver_id": j.driver_id,
            "title": j.title,
            "status": j.status,
            "version": j.version,
            "created_at": j.created_at.isoformat(),
            "stops": [
                {
                    "id": s.id,
                    "sequence": s.sequence,
                    "stop_type": s.stop_type,
                    "address": s.address,
                    "lat": s.lat,
                    "lon": s.lon,
                    "tz": s.tz,
                    "window_start": s.window_start.isoformat(),
                    "window_end": s.window_end.isoformat(),
                    "status": s.status,
                    "actual_arrival_at": s.actual_arrival_at.isoformat() if s.actual_arrival_at else None,
                }
                for s in sorted_stops
            ],
            "latest_prediction": {
                "id": latest_pred.id,
                "status": latest_pred.status,
                "eta_at": latest_pred.eta_at.isoformat() if latest_pred.eta_at else None,
                "uncertainty_margin_seconds": latest_pred.uncertainty_margin_seconds,
                "reason": latest_pred.reason,
            } if latest_pred else None,
            "active_recommendations": [
                {
                    "id": r.id,
                    "action_type": r.action_type,
                    "payload": r.payload,
                    "projected_eta_at": r.projected_eta_at.isoformat(),
                    "status": r.status,
                }
                for r in active_recs
            ]
        })
    return output


@router.post("")
async def create_job(
    payload: JobCreateRequest,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    # Check driver assignment if specified
    if payload.driver_id:
        d_stmt = select(Driver).where(
            and_(Driver.id == payload.driver_id, Driver.workspace_id == principal.workspace_id)
        )
        d_res = await db.execute(d_stmt)
        driver = d_res.scalar_one_or_none()
        if not driver:
            raise HTTPException(status_code=404, detail="Assigned driver not found in workspace")

    # Validate and resolve stop windows
    resolved_stops = []
    has_pickup = False
    has_dropoff = False

    for stop in sorted(payload.stops, key=lambda s: s.sequence):
        if stop.stop_type == "pickup":
            has_pickup = True
        elif stop.stop_type == "dropoff":
            has_dropoff = True

        w_start: datetime
        w_end: datetime

        if stop.window_start_local and stop.window_end_local:
            try:
                w_start = parse_and_validate_local_time(stop.window_start_local, stop.tz, stop.fold)
                w_end = parse_and_validate_local_time(stop.window_end_local, stop.tz, stop.fold)
            except ValueError as ve:
                err_msg = str(ve)
                if "LOCAL_TIME_NONEXISTENT" in err_msg:
                    raise HTTPException(status_code=422, detail="LOCAL_TIME_NONEXISTENT")
                elif "LOCAL_TIME_AMBIGUOUS" in err_msg:
                    raise HTTPException(status_code=422, detail="LOCAL_TIME_AMBIGUOUS")
                raise HTTPException(status_code=422, detail=err_msg)
        elif stop.window_start and stop.window_end:
            w_start = stop.window_start
            w_end = stop.window_end
        else:
            raise HTTPException(status_code=422, detail="Stop window start and end times are required")

        if w_end <= w_start:
            raise HTTPException(status_code=422, detail="Stop window end must be after window start")

        resolved_stops.append((stop, w_start, w_end))

    if not has_pickup or not has_dropoff:
        raise HTTPException(status_code=422, detail="Job requires at least one pickup and one dropoff stop")

    now_utc = datetime.now(timezone.utc)
    initial_status = "assigned" if payload.driver_id else "unassigned"

    job = Job(
        id=str(uuid.uuid4()),
        workspace_id=principal.workspace_id,
        driver_id=payload.driver_id,
        title=payload.title.strip(),
        status=initial_status,
        version=1,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(job)
    await db.flush()

    for idx, (stop, w_start, w_end) in enumerate(resolved_stops, start=1):
        j_stop = JobStop(
            id=str(uuid.uuid4()),
            job_id=job.id,
            workspace_id=principal.workspace_id,
            sequence=idx,
            stop_type=stop.stop_type,
            address=stop.address.strip(),
            lat=stop.lat,
            lon=stop.lon,
            tz=stop.tz,
            window_start=w_start,
            window_end=w_end,
            status="pending",
            created_at=now_utc,
        )
        db.add(j_stop)

    event = JobEvent(
        job_id=job.id,
        workspace_id=principal.workspace_id,
        actor_type="dispatcher",
        actor_id=principal.user_id,
        event_type="created",
        payload={"title": job.title, "driver_id": job.driver_id, "stops_count": len(resolved_stops)},
        created_at=now_utc,
    )
    db.add(event)

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="create_job",
        entity_type="job",
        entity_id=job.id,
        payload={"title": job.title, "stops_count": len(resolved_stops)}
    )
    await db.commit()

    return {"status": "created", "job_id": job.id}


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = (
        select(Job)
        .options(selectinload(Job.stops), selectinload(Job.predictions))
        .where(and_(Job.id == job_id, Job.workspace_id == principal.workspace_id))
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    sorted_stops = sorted(job.stops, key=lambda s: s.sequence)
    latest_pred = job.predictions[-1] if job.predictions else None

    return {
        "id": job.id,
        "workspace_id": job.workspace_id,
        "driver_id": job.driver_id,
        "title": job.title,
        "status": job.status,
        "version": job.version,
        "created_at": job.created_at.isoformat(),
        "stops": [
            {
                "id": s.id,
                "sequence": s.sequence,
                "stop_type": s.stop_type,
                "address": s.address,
                "lat": s.lat,
                "lon": s.lon,
                "tz": s.tz,
                "window_start": s.window_start.isoformat(),
                "window_end": s.window_end.isoformat(),
                "status": s.status,
                "actual_arrival_at": s.actual_arrival_at.isoformat() if s.actual_arrival_at else None,
            }
            for s in sorted_stops
        ],
        "latest_prediction": {
            "id": latest_pred.id,
            "status": latest_pred.status,
            "eta_at": latest_pred.eta_at.isoformat() if latest_pred.eta_at else None,
            "uncertainty_margin_seconds": latest_pred.uncertainty_margin_seconds,
            "reason": latest_pred.reason,
        } if latest_pred else None,
    }


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    payload: JobUpdateRequest,
    principal: RequestPrincipal = Depends(require_dispatcher),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Job).where(
        and_(Job.id == job_id, Job.workspace_id == principal.workspace_id)
    ).with_for_update()
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    updates = {}
    now_utc = datetime.now(timezone.utc)

    # State transition check
    if payload.status is not None and payload.status != job.status:
        allowed = VALID_TRANSITIONS.get(job.status, [])
        if payload.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"INVALID_TRANSITION: Cannot transition from '{job.status}' to '{payload.status}'"
            )
        job.status = payload.status
        updates["status"] = job.status
        job.version += 1

    # Driver assignment check
    if payload.driver_id is not None:
        if payload.driver_id == "":
            job.driver_id = None
            if job.status == "assigned":
                job.status = "unassigned"
            updates["driver_id"] = None
        else:
            d_stmt = select(Driver).where(
                and_(Driver.id == payload.driver_id, Driver.workspace_id == principal.workspace_id)
            )
            d_res = await db.execute(d_stmt)
            driver = d_res.scalar_one_or_none()
            if not driver:
                raise HTTPException(status_code=404, detail="Driver not found in workspace")
            job.driver_id = driver.id
            if job.status == "unassigned":
                job.status = "assigned"
            updates["driver_id"] = driver.id
        job.version += 1

    if payload.title is not None:
        job.title = payload.title.strip()
        updates["title"] = job.title

    await append_audit_entry(
        db=db,
        workspace_id=principal.workspace_id,
        actor_id=principal.user_id,
        action="update_job",
        entity_type="job",
        entity_id=job.id,
        payload=updates,
    )
    await db.commit()

    return {"status": "updated", "job_id": job.id, "version": job.version}


@router.post("/preview-route")
async def preview_route(
    payload: RoutePreviewRequest,
    principal: RequestPrincipal = Depends(get_current_principal),
) -> Dict[str, Any]:
    """Calculates route preview from Azure Maps with traffic."""
    try:
        route = await azure_maps_client.calculate_route(
            origin_lat=payload.origin_lat,
            origin_lon=payload.origin_lon,
            dest_lat=payload.dest_lat,
            dest_lon=payload.dest_lon,
        )
        return {
            "status": "ok",
            "travel_time_seconds": route.get("travel_time_seconds", 0),
            "distance_meters": route.get("distance_meters", 0),
            "coordinates": route.get("coordinates", []),
        }
    except AzureMapsException as exc:
        raise HTTPException(status_code=503, detail="Route preview unavailable")
