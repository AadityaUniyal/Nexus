import io
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import pyarrow as pa
import pyarrow.parquet as pq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.config import settings
from app.models.driver import LocationPing
from app.models.job import Prediction
from app.models.audit import AuditLog

logger = logging.getLogger("nexus.export")


async def export_workspace_day_to_parquet(
    db: AsyncSession,
    workspace_id: str,
    target_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Exports pings and predictions for target UTC date to partitioned Parquet bytes
    and computes the audit head anchor.
    Idempotent for repeated execution on the same date.
    """
    if not target_date:
        # Default to previous UTC day
        prev_day = datetime.now(timezone.utc) - timedelta(days=1)
        target_date = prev_day.strftime("%Y-%m-%d")

    day_start = datetime.strptime(target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    # 1. Query Pings
    pings_stmt = select(LocationPing).where(
        and_(
            LocationPing.workspace_id == workspace_id,
            LocationPing.recorded_at >= day_start,
            LocationPing.recorded_at < day_end,
        )
    ).order_by(LocationPing.recorded_at)
    pings_res = await db.execute(pings_stmt)
    pings = pings_res.scalars().all()

    pings_table = pa.Table.from_arrays(
        [
            pa.array([p.id for p in pings]),
            pa.array([p.driver_id for p in pings]),
            pa.array([p.workspace_id for p in pings]),
            pa.array([p.lat for p in pings]),
            pa.array([p.lon for p in pings]),
            pa.array([p.speed_mps for p in pings]),
            pa.array([p.heading for p in pings]),
            pa.array([p.accuracy_m for p in pings]),
            pa.array([p.recorded_at.isoformat() for p in pings]),
        ],
        names=["id", "driver_id", "workspace_id", "lat", "lon", "speed_mps", "heading", "accuracy_m", "recorded_at"]
    )
    pings_buffer = io.BytesIO()
    pq.write_table(pings_table, pings_buffer, compression="SNAPPY")
    pings_bytes = pings_buffer.getvalue()

    # 2. Query Predictions
    preds_stmt = select(Prediction).where(
        and_(
            Prediction.workspace_id == workspace_id,
            Prediction.created_at >= day_start,
            Prediction.created_at < day_end,
        )
    ).order_by(Prediction.created_at)
    preds_res = await db.execute(preds_stmt)
    preds = preds_res.scalars().all()

    preds_table = pa.Table.from_arrays(
        [
            pa.array([p.id for p in preds]),
            pa.array([p.job_id for p in preds]),
            pa.array([p.stop_id for p in preds]),
            pa.array([p.workspace_id for p in preds]),
            pa.array([p.status for p in preds]),
            pa.array([p.travel_time_seconds for p in preds]),
            pa.array([p.eta_at.isoformat() if p.eta_at else "" for p in preds]),
            pa.array([p.reason for p in preds]),
            pa.array([p.created_at.isoformat() for p in preds]),
        ],
        names=["id", "job_id", "stop_id", "workspace_id", "status", "travel_time_seconds", "eta_at", "reason", "created_at"]
    )
    preds_buffer = io.BytesIO()
    pq.write_table(preds_table, preds_buffer, compression="SNAPPY")
    preds_bytes = preds_buffer.getvalue()

    # 3. Audit Head Anchor
    audit_stmt = (
        select(AuditLog)
        .where(
            and_(
                AuditLog.workspace_id == workspace_id,
                AuditLog.created_at < day_end,
            )
        )
        .order_by(desc(AuditLog.seq))
        .limit(1)
    )
    audit_res = await db.execute(audit_stmt)
    latest_audit = audit_res.scalar_one_or_none()

    anchor = {
        "workspace_id": workspace_id,
        "date": target_date,
        "latest_audit_seq": latest_audit.seq if latest_audit else 0,
        "latest_audit_hash": latest_audit.hash if latest_audit else ("0" * 64),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "pings_count": len(pings),
        "predictions_count": len(preds),
    }

    # Upload to Azure Blob Storage if configured
    if settings.AZURE_STORAGE_CONNECTION_STRING:
        try:
            from azure.storage.blob.aio import BlobServiceClient
            async with BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING) as blob_svc:
                container_client = blob_svc.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
                prefix = f"workspace_id={workspace_id}/date={target_date}"
                await container_client.upload_blob(f"{prefix}/pings.parquet", pings_bytes, overwrite=True)
                await container_client.upload_blob(f"{prefix}/predictions.parquet", preds_bytes, overwrite=True)
                await container_client.upload_blob(f"{prefix}/audit_anchor.json", json.dumps(anchor).encode("utf-8"), overwrite=True)
                logger.info("Successfully exported %s Parquet blobs to Azure Storage", prefix)
        except Exception as exc:
            logger.warning("Azure Blob upload failed (local fallback retained): %s", exc)

    return {
        "workspace_id": workspace_id,
        "date": target_date,
        "pings_count": len(pings),
        "pings_bytes_length": len(pings_bytes),
        "predictions_count": len(preds),
        "predictions_bytes_length": len(preds_bytes),
        "audit_anchor": anchor,
    }
