import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.auth.driver_auth import (
    hash_token,
    get_current_driver_session,
)
from app.models.driver import Driver, DriverLink, DriverSession, LocationPing
from app.models.job import Job, JobStop, JobEvent
from app.core.rate_limit import enforce_rate_limit
from app.realtime.sse import sse_manager
from app.services.eta_service import compute_job_eta, haversine_distance_m
from app.services.recommendation_service import generate_recommendations

router = APIRouter(prefix="/driver", tags=["Driver PWA Portal"])


class RedeemLinkRequest(BaseModel):
    link_token: str = Field(..., min_length=10)
    device_info: Optional[str] = None
    consent_version: str = Field(default="1.0")


class PingItem(BaseModel):
    client_ping_id: str = Field(..., min_length=5, max_length=64)
    lat: float
    lon: float
    heading: Optional[float] = None
    speed_mps: Optional[float] = None
    accuracy_m: float
    recorded_at: datetime


class PingBatchRequest(BaseModel):
    pings: List[PingItem] = Field(..., min_length=1, max_length=100)


class DutyToggleRequest(BaseModel):
    status: Literal["on_duty", "off_duty"]


class DriverStopActionRequest(BaseModel):
    action: Literal["start", "arrived", "delivered"]
    stop_id: str
    recorded_at: datetime
    lat: Optional[float] = None
    lon: Optional[float] = None


@router.post("/redeem")
async def redeem_driver_link(
    payload: RedeemLinkRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Redeems a single-use driver link and creates an active session."""
    token_h = hash_token(payload.link_token)
    stmt = select(DriverLink).where(DriverLink.token_hash == token_h).with_for_update()
    res = await db.execute(stmt)
    link = res.scalar_one_or_none()

    if not link:
        raise HTTPException(status_code=404, detail="Invalid driver link")

    now_utc = datetime.now(timezone.utc)
    if link.redeemed_at is not None:
        raise HTTPException(status_code=410, detail="Driver link has already been redeemed")

    link_exp = link.expires_at if link.expires_at.tzinfo else link.expires_at.replace(tzinfo=timezone.utc)
    if link_exp < now_utc:
        raise HTTPException(status_code=410, detail="Driver link has expired")

    link.redeemed_at = now_utc

    # Generate session bearer token
    session_raw_token = secrets.token_urlsafe(32)
    session_token_h = hash_token(session_raw_token)
    expires_at = now_utc + timedelta(days=7)

    session = DriverSession(
        id=str(uuid.uuid4()),
        driver_id=link.driver_id,
        workspace_id=link.workspace_id,
        session_token_hash=session_token_h,
        device_info=payload.device_info,
        consent_version=payload.consent_version,
        consented_at=now_utc,
        expires_at=expires_at,
        created_at=now_utc,
    )
    db.add(session)

    # Set driver to on_duty
    d_stmt = select(Driver).where(Driver.id == link.driver_id).with_for_update()
    d_res = await db.execute(d_stmt)
    driver = d_res.scalar_one_or_none()
    if driver:
        driver.status = "on_duty"

    await db.commit()

    return {
        "session_token": session_raw_token,
        "driver_id": driver.id if driver else link.driver_id,
        "driver_name": driver.name if driver else "Driver",
        "workspace_id": link.workspace_id,
        "expires_at": expires_at.isoformat(),
    }


@router.post("/duty")
async def toggle_duty_status(
    payload: DutyToggleRequest,
    session: DriverSession = Depends(get_current_driver_session),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    stmt = select(Driver).where(Driver.id == session.driver_id).with_for_update()
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver.status = payload.status
    await db.commit()

    await sse_manager.broadcast(
        workspace_id=session.workspace_id,
        event_type="driver_status",
        data={"driver_id": driver.id, "status": driver.status}
    )

    return {"status": driver.status}


@router.post("/pings")
async def ingest_driver_pings(
    payload: PingBatchRequest,
    session: DriverSession = Depends(get_current_driver_session),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Ingests batch of GPS pings with validation, idempotency, rate limiting, and SSE dispatch.
    """
    # Rate limit: max 60 batches per minute per session
    enforce_rate_limit(key=f"driver_session:{session.id}", max_requests=60, window_seconds=60)

    now_utc = datetime.now(timezone.utc)
    outcomes = []
    accepted_pings = []

    stmt = select(Driver).where(Driver.id == session.driver_id).with_for_update()
    res = await db.execute(stmt)
    driver = res.scalar_one_or_none()

    for ping in payload.pings:
        # Validate coordinates bounds
        if not (-90.0 <= ping.lat <= 90.0) or not (-180.0 <= ping.lon <= 180.0):
            outcomes.append({"client_ping_id": ping.client_ping_id, "status": "rejected", "reason": "COORDINATES_OUT_OF_BOUNDS"})
            continue

        # Validate accuracy
        if ping.accuracy_m > 100.0:
            outcomes.append({"client_ping_id": ping.client_ping_id, "status": "dropped", "reason": "ACCURACY_EXCEEDS_100M"})
            continue

        # Validate timestamp [-24 hours, +60 seconds]
        if ping.recorded_at > (now_utc + timedelta(seconds=60)):
            outcomes.append({"client_ping_id": ping.client_ping_id, "status": "rejected", "reason": "TIMESTAMP_IN_FUTURE"})
            continue
        if ping.recorded_at < (now_utc - timedelta(hours=24)):
            outcomes.append({"client_ping_id": ping.client_ping_id, "status": "rejected", "reason": "TIMESTAMP_TOO_OLD"})
            continue

        # Check idempotency
        dup_stmt = select(LocationPing).where(
            and_(LocationPing.driver_id == session.driver_id, LocationPing.client_ping_id == ping.client_ping_id)
        )
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            outcomes.append({"client_ping_id": ping.client_ping_id, "status": "accepted", "idempotent": True})
            continue

        lp = LocationPing(
            id=str(uuid.uuid4()),
            driver_id=session.driver_id,
            workspace_id=session.workspace_id,
            client_ping_id=ping.client_ping_id,
            lat=ping.lat,
            lon=ping.lon,
            heading=ping.heading,
            speed_mps=ping.speed_mps,
            accuracy_m=ping.accuracy_m,
            recorded_at=ping.recorded_at,
            created_at=now_utc,
        )
        db.add(lp)
        accepted_pings.append(lp)
        outcomes.append({"client_ping_id": ping.client_ping_id, "status": "accepted"})

    # Update driver current location from newest ping
    if accepted_pings and driver:
        newest = max(accepted_pings, key=lambda p: p.recorded_at)
        driver.current_lat = newest.lat
        driver.current_lon = newest.lon
        driver.current_heading = newest.heading
        driver.last_ping_at = newest.recorded_at
        driver.status = "on_duty"

    await db.commit()

    # Broadcast position over SSE to workspace
    if accepted_pings and driver:
        newest = max(accepted_pings, key=lambda p: p.recorded_at)
        await sse_manager.broadcast(
            workspace_id=session.workspace_id,
            event_type="driver_ping",
            data={
                "driver_id": driver.id,
                "lat": newest.lat,
                "lon": newest.lon,
                "heading": newest.heading,
                "speed_mps": newest.speed_mps,
                "accuracy_m": newest.accuracy_m,
                "recorded_at": newest.recorded_at.isoformat(),
            }
        )

        # Trigger ETA & Risk computation if assigned to an active job
        job_stmt = (
            select(Job)
            .options(selectinload(Job.stops), selectinload(Job.predictions))
            .where(
                and_(
                    Job.driver_id == driver.id,
                    Job.workspace_id == session.workspace_id,
                    Job.status.in_(["assigned", "in_progress"])
                )
            )
        )
        job_res = await db.execute(job_stmt)
        active_job = job_res.scalars().first()

        if active_job:
            # Check throttle: moved >= 250m or elapsed >= 120s
            should_recompute = True
            latest_pred = active_job.predictions[-1] if active_job.predictions else None
            if latest_pred and latest_pred.eta_at:
                dist = haversine_distance_m(newest.lat, newest.lon, latest_pred.origin_lat, latest_pred.origin_lon)
                time_elapsed = (now_utc - latest_pred.created_at).total_seconds()
                if dist < 250.0 and time_elapsed < 120.0:
                    should_recompute = False

            if should_recompute:
                pred = await compute_job_eta(db, active_job, driver, newest)
                if pred:
                    await db.commit()
                    await sse_manager.broadcast(
                        workspace_id=session.workspace_id,
                        event_type="prediction_updated",
                        data={
                            "job_id": active_job.id,
                            "stop_id": pred.stop_id,
                            "status": pred.status,
                            "eta_at": pred.eta_at.isoformat() if pred.eta_at else None,
                            "uncertainty_margin_seconds": pred.uncertainty_margin_seconds,
                            "reason": pred.reason,
                        }
                    )
                    # If at risk or late, generate recommendations
                    if pred.status in ("at_risk", "late") and pred.eta_at:
                        stop = next((s for s in active_job.stops if s.id == pred.stop_id), None)
                        if stop:
                            recs = await generate_recommendations(db, active_job, stop, pred.eta_at)
                            if recs:
                                await db.commit()
                                for r in recs:
                                    await sse_manager.broadcast(
                                        workspace_id=session.workspace_id,
                                        event_type="recommendation_created",
                                        data={
                                            "id": r.id,
                                            "job_id": r.job_id,
                                            "action_type": r.action_type,
                                            "payload": r.payload,
                                            "projected_eta_at": r.projected_eta_at.isoformat(),
                                        }
                                    )

    return {"outcomes": outcomes, "accepted_count": len(accepted_pings)}


@router.get("/active-job")
async def get_driver_active_job(
    session: DriverSession = Depends(get_current_driver_session),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Returns the driver's current assigned job and stops."""
    stmt = (
        select(Job)
        .options(selectinload(Job.stops))
        .where(
            and_(
                Job.driver_id == session.driver_id,
                Job.workspace_id == session.workspace_id,
                Job.status.in_(["assigned", "in_progress"])
            )
        )
    )
    res = await db.execute(stmt)
    job = res.scalars().first()

    if not job:
        return {"job": None}

    sorted_stops = sorted(job.stops, key=lambda s: s.sequence)
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "status": job.status,
            "version": job.version,
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
            ]
        }
    }


@router.post("/actions/stop")
async def record_driver_stop_action(
    payload: DriverStopActionRequest,
    session: DriverSession = Depends(get_current_driver_session),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Records one-tap driver actions: start, arrived, delivered (AC-53)."""
    now_utc = datetime.now(timezone.utc)
    if payload.recorded_at > (now_utc + timedelta(seconds=60)):
        raise HTTPException(status_code=422, detail="Action timestamp cannot be in the future")

    stmt = select(JobStop).where(
        and_(JobStop.id == payload.stop_id, JobStop.workspace_id == session.workspace_id)
    ).with_for_update()
    res = await db.execute(stmt)
    stop = res.scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=404, detail="Job stop not found")

    job_stmt = select(Job).where(Job.id == stop.job_id).with_for_update()
    job_res = await db.execute(job_stmt)
    job = job_res.scalar_one_or_none()

    if payload.action == "start":
        if job and job.status == "assigned":
            job.status = "in_progress"
            job.version += 1
    elif payload.action == "arrived":
        stop.status = "arrived"
        stop.actual_arrival_at = payload.recorded_at
        if payload.lat is not None and payload.lon is not None:
            stop.arrival_distance_m = haversine_distance_m(payload.lat, payload.lon, stop.lat, stop.lon)
    elif payload.action == "delivered":
        stop.status = "completed"
        if not stop.actual_arrival_at:
            stop.actual_arrival_at = payload.recorded_at

        # Check if all stops completed
        all_stops_stmt = select(JobStop).where(JobStop.job_id == job.id)
        all_res = await db.execute(all_stops_stmt)
        all_stops = all_res.scalars().all()
        if all(s.status == "completed" or s.id == stop.id for s in all_stops):
            job.status = "completed"
            job.version += 1

    event = JobEvent(
        job_id=stop.job_id,
        workspace_id=session.workspace_id,
        actor_type="driver",
        actor_id=session.driver_id,
        event_type=f"stop_{payload.action}",
        payload={"stop_id": stop.id, "action": payload.action, "recorded_at": payload.recorded_at.isoformat()},
        created_at=now_utc,
    )
    db.add(event)
    await db.commit()

    await sse_manager.broadcast(
        workspace_id=session.workspace_id,
        event_type="stop_updated",
        data={
            "job_id": stop.job_id,
            "stop_id": stop.id,
            "action": payload.action,
            "stop_status": stop.status,
            "actual_arrival_at": stop.actual_arrival_at.isoformat() if stop.actual_arrival_at else None,
        }
    )

    return {"status": "ok", "stop_status": stop.status, "action": payload.action}
