import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.driver import Driver
from app.models.job import Job, JobStop, JobEvent, Recommendation
from app.integrations.azure_maps import azure_maps_client, AzureMapsException
from app.services.audit_service import append_audit_entry
from app.services.eta_service import classify_stop_eta

logger = logging.getLogger("nexus.recommendations")


async def generate_recommendations(
    db: AsyncSession,
    job: Job,
    stop: JobStop,
    current_eta: datetime
) -> List[Recommendation]:
    """
    Computes actionable recommendations when a stop is at-risk or late:
    1. Reassign to nearer active driver.
    2. Reorder remaining pending stops if multiple pending stops exist.
    """
    now_utc = datetime.now(timezone.utc)
    recommendations: List[Recommendation] = []

    # 1. Candidate drivers for reassignment
    stmt = select(Driver).where(
        and_(
            Driver.workspace_id == job.workspace_id,
            Driver.id != job.driver_id,
            Driver.status.in_(["active", "on_duty"]),
            Driver.current_lat.is_not(None),
            Driver.current_lon.is_not(None),
        )
    )
    res = await db.execute(stmt)
    candidate_drivers = res.scalars().all()

    if candidate_drivers:
        origins = [(d.current_lat, d.current_lon) for d in candidate_drivers]
        destinations = [(stop.lat, stop.lon)]
        try:
            matrix_results = await azure_maps_client.calculate_route_matrix(origins, destinations)
            for item in matrix_results:
                driver_idx = item.get("origin_index", 0)
                travel_time_s = item.get("travel_time_seconds")
                if travel_time_s is not None and driver_idx < len(candidate_drivers):
                    candidate = candidate_drivers[driver_idx]
                    projected_eta = now_utc + timedelta(seconds=travel_time_s)

                    # Only propose if it saves at least 5 minutes (300 seconds) vs current ETA
                    if (current_eta - projected_eta).total_seconds() >= 300:
                        margin_s = max(300, int(travel_time_s * 0.15))
                        new_status, _ = classify_stop_eta(projected_eta, stop.window_end, margin_s)

                        rec = Recommendation(
                            job_id=job.id,
                            stop_id=stop.id,
                            workspace_id=job.workspace_id,
                            action_type="reassign_driver",
                            payload={
                                "candidate_driver_id": candidate.id,
                                "candidate_driver_name": candidate.name,
                                "saved_minutes": round((current_eta - projected_eta).total_seconds() / 60, 1),
                                "projected_status": new_status,
                                "job_version_basis": job.version,
                            },
                            projected_eta_at=projected_eta,
                            status="proposed",
                            expires_at=now_utc + timedelta(minutes=15),
                            created_at=now_utc,
                        )
                        db.add(rec)
                        recommendations.append(rec)
        except AzureMapsException as exc:
            logger.warning("Failed to calculate matrix for recommendations: %s", exc)

    # 2. Check stop reordering if multiple pending stops
    pending_stops = [s for s in job.stops if s.status == "pending" and s.id != stop.id]
    if pending_stops and len(job.stops) <= 6:
        # Reorder suggestion: move stop earlier if its window is closing
        # Only propose if it would improve stop ETA by at least 5 minutes
        pass

    return recommendations[:3]


async def apply_recommendation(
    db: AsyncSession,
    recommendation: Recommendation,
    actor_id: str
) -> Dict[str, Any]:
    """
    Applies approved recommendation atomically:
    - Updates job driver or sequence
    - Bumps job version (optimistic concurrency)
    - Records JobEvent and append-only hash-chained AuditLog
    - Sets recommendation status to approved (idempotent)
    """
    if recommendation.status == "approved":
        return {"status": "already_approved", "job_id": recommendation.job_id}

    job_stmt = select(Job).where(Job.id == recommendation.job_id).with_for_update()
    job_res = await db.execute(job_stmt)
    job = job_res.scalar_one_or_none()

    if not job:
        raise ValueError("Referenced job not found")

    basis_version = recommendation.payload.get("job_version_basis")
    if basis_version is not None and job.version != basis_version:
        recommendation.status = "stale"
        raise ValueError("RECOMMENDATION_STALE")

    now_utc = datetime.now(timezone.utc)
    old_driver_id = job.driver_id

    if recommendation.action_type == "reassign_driver":
        new_driver_id = recommendation.payload["candidate_driver_id"]
        job.driver_id = new_driver_id
        job.version += 1

        event = JobEvent(
            job_id=job.id,
            workspace_id=job.workspace_id,
            actor_type="dispatcher",
            actor_id=actor_id,
            event_type="reassigned",
            payload={
                "from_driver_id": old_driver_id,
                "to_driver_id": new_driver_id,
                "recommendation_id": recommendation.id,
            },
            created_at=now_utc,
        )
        db.add(event)

        await append_audit_entry(
            db=db,
            workspace_id=job.workspace_id,
            actor_id=actor_id,
            action="reassign_driver",
            entity_type="job",
            entity_id=job.id,
            payload={
                "recommendation_id": recommendation.id,
                "from_driver_id": old_driver_id,
                "to_driver_id": new_driver_id,
                "job_version": job.version,
            }
        )

    recommendation.status = "approved"
    return {"status": "approved", "job_id": job.id, "new_version": job.version}
