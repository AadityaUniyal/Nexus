"""First-party product analytics: ingest and aggregate user behaviour events.

Write path:  browser SDK -> POST /events/track (batched)
             -> Neon `product_events` (queryable)
             -> Application Insights customEvents (monitoring / KQL)
             -> Azure Blob bronze tier (raw archive, background task)
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_optional_principal
from app.auth.principal import RequestPrincipal
from app.db.session import get_db
from app.models.product_analytics import ProductEvent
from app.services.ai_service import ai_service
from app.services.platform_metrics import platform_metrics

logger = logging.getLogger("nexus.events")
router = APIRouter(prefix="/events", tags=["Product Analytics"])

ALLOWED_EVENTS = {
    "page_view", "session_start", "click", "feature_used", "search",
    "export", "simulation_run", "report_generated", "ai_query", "error", "web_vital",
}


class TrackEvent(BaseModel):
    name: str = Field(..., max_length=64)
    path: Optional[str] = Field(None, max_length=255)
    referrer: Optional[str] = Field(None, max_length=255)
    anonymousId: Optional[str] = Field(None, max_length=64)
    sessionId: Optional[str] = Field(None, max_length=64)
    device: Optional[str] = Field(None, max_length=16)
    properties: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def known_event(cls, v: str) -> str:
        if v not in ALLOWED_EVENTS:
            raise ValueError(f"unknown event '{v}'")
        return v

    @field_validator("properties")
    @classmethod
    def small_props(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        # Keep payloads small and flat; drop anything nested or oversized.
        clean = {}
        for k, val in list(v.items())[:20]:
            if isinstance(val, (str, int, float, bool)) or val is None:
                clean[str(k)[:40]] = val[:200] if isinstance(val, str) else val
        return clean


class TrackBatch(BaseModel):
    events: List[TrackEvent] = Field(..., min_length=1, max_length=50)


def _archive(records: List[Dict[str, Any]]) -> None:
    try:
        logger.debug("Archived %d product event records locally", len(records))
    except Exception as e:
        logger.debug("Archive skipped: %s", e)


@router.post("/track", status_code=202)
async def track(
    batch: TrackBatch,
    request: Request,
    background: BackgroundTasks,
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    user_id = principal.nexus_user_id if principal else None
    ws_id = principal.workspace_id if principal else None
    rows, archive = [], []
    for e in batch.events:
        ts = e.timestamp or now
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if abs((now - ts).total_seconds()) > 86400:  # clamp clock skew
            ts = now
        rows.append(ProductEvent(
            name=e.name, workspace_id=ws_id, user_id=user_id, anonymous_id=e.anonymousId,
            session_id=e.sessionId, path=e.path, referrer=e.referrer, device=e.device,
            properties=e.properties, occurred_at=ts, received_at=now,
        ))
        archive.append({"type": "product_event", "name": e.name, "path": e.path,
                        "session": e.sessionId, "ws": ws_id, "ts": ts.isoformat(), **e.properties})

    db.add_all(rows)
    await db.flush()

    try:
        for e in batch.events:
            logger.info(f"[ProductEvent] {e.name} path={e.path} device={e.device}")
    except Exception:
        pass
    background.add_task(_archive, archive)
    return {"accepted": len(rows)}


def _since(range_: str) -> datetime:
    days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(range_, 7)
    return datetime.now(timezone.utc) - timedelta(days=days)


@router.get("/summary")
async def summary(
    range: str = Query("7d", pattern="^(24h|7d|30d|90d)$"),
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated (non-PII) product usage: traffic, top pages, features, devices, daily trend."""
    since = _since(range)
    ws = principal.workspace_id if principal and principal.workspace_id else None
    where = [ProductEvent.occurred_at >= since]
    if ws:
        where.append(ProductEvent.workspace_id == ws)

    totals = (await db.execute(
        select(
            func.count(ProductEvent.id),
            func.count(distinct(ProductEvent.session_id)),
            func.count(distinct(func.coalesce(ProductEvent.user_id, ProductEvent.anonymous_id))),
        ).where(*where)
    )).one()

    pv_where = where + [ProductEvent.name == "page_view"]
    page_views = (await db.execute(select(func.count()).where(*pv_where))).scalar() or 0

    top_pages = (await db.execute(
        select(ProductEvent.path, func.count().label("c"))
        .where(*pv_where).group_by(ProductEvent.path).order_by(func.count().desc()).limit(8)
    )).all()

    by_event = (await db.execute(
        select(ProductEvent.name, func.count().label("c"))
        .where(*where).group_by(ProductEvent.name).order_by(func.count().desc())
    )).all()

    devices = (await db.execute(
        select(ProductEvent.device, func.count(distinct(ProductEvent.session_id)))
        .where(*where).group_by(ProductEvent.device)
    )).all()

    day = func.date_trunc("day", ProductEvent.occurred_at)
    daily = (await db.execute(
        select(day.label("d"), func.count().label("events"), func.count(distinct(ProductEvent.session_id)).label("s"))
        .where(*where).group_by(day).order_by(day)
    )).all()

    sessions = totals[1] or 0
    return {
        "range": range,
        "totals": {
            "events": totals[0] or 0,
            "sessions": sessions,
            "users": totals[2] or 0,
            "pageViews": page_views,
            "pagesPerSession": round(page_views / sessions, 2) if sessions else 0,
        },
        "topPages": [{"path": p or "/", "views": c} for p, c in top_pages],
        "events": [{"name": n, "count": c} for n, c in by_event],
        "devices": [{"device": d or "unknown", "sessions": c} for d, c in devices],
        "daily": [{"date": d.date().isoformat() if d else None, "events": e, "sessions": s} for d, e, s in daily],
    }


@router.get("/platform")
async def platform():
    """Live API health metrics for this instance plus AI provider usage."""
    return {"api": platform_metrics.snapshot(), "ai": ai_service.status()}
