import math
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.config import settings
from app.models.driver import Driver, LocationPing
from app.models.job import Job, JobStop, Prediction
from app.models.audit import DailyUsage
from app.integrations.azure_maps import azure_maps_client, AzureMapsException

logger = logging.getLogger("nexus.eta")

# In-memory short-lived route cache (key -> (result_dict, expires_at_timestamp))
_ROUTE_CACHE: Dict[Tuple[float, float, float, float], Tuple[Dict[str, Any], float]] = {}


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in meters between two coordinates."""
    r = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def classify_stop_eta(
    eta_at: datetime,
    window_end: datetime,
    margin_seconds: int
) -> Tuple[str, str]:
    """
    Classifies ETA according to requirement AC-62:
    - on_time if eta + margin <= window_end
    - late if eta - margin > window_end
    - otherwise at_risk
    """
    w_end = window_end if window_end.tzinfo else window_end.replace(tzinfo=timezone.utc)
    eta = eta_at if eta_at.tzinfo else eta_at.replace(tzinfo=timezone.utc)
    margin_delta = timedelta(seconds=margin_seconds)
    if eta + margin_delta <= w_end:
        return "on_time", "Projected arrival is comfortably within time window"
    elif eta - margin_delta > w_end:
        late_minutes = max(1, int((eta - w_end).total_seconds() / 60))
        return "late", f"Projected arrival exceeds window by ~{late_minutes} min"
    else:
        return "at_risk", "Projected arrival is tight against window end considering traffic uncertainty"


async def check_and_increment_daily_usage(db: AsyncSession, workspace_id: str) -> bool:
    """
    Checks if workspace has reached daily Azure Maps call cap.
    Returns True if allowed, False if capped.
    """
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    stmt = select(DailyUsage).where(
        and_(DailyUsage.workspace_id == workspace_id, DailyUsage.usage_date == today_str)
    ).with_for_update()
    res = await db.execute(stmt)
    usage = res.scalar_one_or_none()

    if not usage:
        usage = DailyUsage(
            workspace_id=workspace_id,
            usage_date=today_str,
            azure_maps_calls=0
        )
        db.add(usage)
        await db.flush()

    if usage.azure_maps_calls >= settings.DAILY_MAPS_CALL_CAP:
        return False

    usage.azure_maps_calls += 1
    return True


async def compute_job_eta(
    db: AsyncSession,
    job: Job,
    driver: Optional[Driver],
    latest_ping: Optional[LocationPing]
) -> Optional[Prediction]:
    """
    Computes or updates live traffic ETA and risk prediction for the next incomplete stop of a job.
    """
    # Find next incomplete stop
    next_stop: Optional[JobStop] = None
    for stop in sorted(job.stops, key=lambda s: s.sequence):
        if stop.status in ("pending", "arrived"):
            next_stop = stop
            break

    if not next_stop:
        return None

    now_utc = datetime.now(timezone.utc)

    # Validate driver ping recency (under 5 minutes = 300 seconds)
    if not driver or not latest_ping or (now_utc - latest_ping.recorded_at).total_seconds() > 300:
        pred = Prediction(
            job_id=job.id,
            stop_id=next_stop.id,
            workspace_id=job.workspace_id,
            driver_id=driver.id if driver else None,
            ping_id=latest_ping.id if latest_ping else None,
            origin_lat=driver.current_lat if (driver and driver.current_lat is not None) else next_stop.lat,
            origin_lon=driver.current_lon if (driver and driver.current_lon is not None) else next_stop.lon,
            eta_at=None,
            travel_time_seconds=None,
            traffic_delay_seconds=None,
            uncertainty_margin_seconds=300,
            status="unknown",
            reason="No recent GPS from this driver",
            cache_hit=False,
            provider_version="azure-maps-gen2",
            created_at=now_utc,
        )
        db.add(pred)
        return pred

    # Check daily usage cap guard
    allowed = await check_and_increment_daily_usage(db, job.workspace_id)
    if not allowed:
        pred = Prediction(
            job_id=job.id,
            stop_id=next_stop.id,
            workspace_id=job.workspace_id,
            driver_id=driver.id,
            ping_id=latest_ping.id,
            origin_lat=latest_ping.lat,
            origin_lon=latest_ping.lon,
            eta_at=None,
            travel_time_seconds=None,
            traffic_delay_seconds=None,
            uncertainty_margin_seconds=300,
            status="unknown",
            reason="Live traffic ETA paused (usage limit)",
            cache_hit=False,
            provider_version="azure-maps-gen2",
            created_at=now_utc,
        )
        db.add(pred)
        return pred

    # Check route cache (cell quantized to 3 decimal places ~110m)
    cache_key = (
        round(latest_ping.lat, 3),
        round(latest_ping.lon, 3),
        round(next_stop.lat, 3),
        round(next_stop.lon, 3),
    )
    now_ts = time.time()
    cached_entry = _ROUTE_CACHE.get(cache_key)
    cache_hit = False

    if cached_entry and cached_entry[1] > now_ts:
        route_data = cached_entry[0]
        cache_hit = True
    else:
        try:
            route_data = await azure_maps_client.calculate_route(
                origin_lat=latest_ping.lat,
                origin_lon=latest_ping.lon,
                dest_lat=next_stop.lat,
                dest_lon=next_stop.lon,
                depart_at=now_utc,
            )
            # Store in cache with 60s TTL
            _ROUTE_CACHE[cache_key] = (route_data, now_ts + 60.0)
        except AzureMapsException as exc:
            logger.warning("Azure Maps route calculation failed: %s", exc)
            pred = Prediction(
                job_id=job.id,
                stop_id=next_stop.id,
                workspace_id=job.workspace_id,
                driver_id=driver.id,
                ping_id=latest_ping.id,
                origin_lat=latest_ping.lat,
                origin_lon=latest_ping.lon,
                eta_at=None,
                travel_time_seconds=None,
                traffic_delay_seconds=None,
                uncertainty_margin_seconds=300,
                status="unknown",
                reason="PROVIDER_UNAVAILABLE",
                cache_hit=False,
                provider_version="azure-maps-gen2",
                created_at=now_utc,
            )
            db.add(pred)
            return pred

    travel_time_s = route_data.get("travel_time_seconds", 0)
    traffic_delay_s = route_data.get("traffic_delay_seconds", 0)
    eta_at = now_utc + timedelta(seconds=travel_time_s)

    # Uncertainty margin: 15% of travel time, min 5 minutes (300s)
    margin_s = max(300, int(travel_time_s * 0.15))
    status_label, reason_text = classify_stop_eta(eta_at, next_stop.window_end, margin_s)

    pred = Prediction(
        job_id=job.id,
        stop_id=next_stop.id,
        workspace_id=job.workspace_id,
        driver_id=driver.id,
        ping_id=latest_ping.id,
        origin_lat=latest_ping.lat,
        origin_lon=latest_ping.lon,
        eta_at=eta_at,
        travel_time_seconds=travel_time_s,
        traffic_delay_seconds=traffic_delay_s,
        uncertainty_margin_seconds=margin_s,
        status=status_label,
        reason=reason_text,
        cache_hit=cache_hit,
        provider_version="azure-maps-gen2",
        created_at=now_utc,
    )
    db.add(pred)
    return pred
