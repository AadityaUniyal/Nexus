import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.audit import AuditLog

GENESIS_HASH = "0" * 64


def canonical_json(data: Dict[str, Any]) -> str:
    """Produces deterministic, canonical JSON for hashing."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def compute_audit_hash(prev_hash: str, record_dict: Dict[str, Any]) -> str:
    """Computes SHA-256(prev_hash || canonical_json(record_dict))."""
    payload_str = canonical_json(record_dict)
    hasher = hashlib.sha256()
    hasher.update(prev_hash.encode("utf-8"))
    hasher.update(payload_str.encode("utf-8"))
    return hasher.hexdigest()


async def append_audit_entry(
    db: AsyncSession,
    workspace_id: str,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any]
) -> AuditLog:
    """
    Appends a new hash-chained audit record sequentially within a workspace.
    """
    # Fetch latest audit record for this workspace
    stmt = (
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace_id)
        .order_by(desc(AuditLog.seq))
        .limit(1)
        .with_for_update()
    )
    res = await db.execute(stmt)
    latest = res.scalar_one_or_none()

    if latest:
        next_seq = latest.seq + 1
        prev_hash = latest.hash
    else:
        next_seq = 1
        prev_hash = GENESIS_HASH

    now_utc = datetime.now(timezone.utc)
    record_content = {
        "seq": next_seq,
        "workspace_id": workspace_id,
        "actor_id": actor_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "payload": payload,
        "created_at": now_utc.isoformat(),
    }

    current_hash = compute_audit_hash(prev_hash, record_content)

    entry = AuditLog(
        workspace_id=workspace_id,
        seq=next_seq,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
        prev_hash=prev_hash,
        hash=current_hash,
        created_at=now_utc,
    )
    db.add(entry)
    await db.flush()
    return entry


async def verify_audit_chain(
    db: AsyncSession,
    workspace_id: str
) -> Dict[str, Any]:
    """
    Verifies integrity of the hash chain for a workspace.
    Returns dict with keys: valid, checked, first_broken_seq.
    """
    stmt = (
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace_id)
        .order_by(AuditLog.seq)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    if not records:
        return {"valid": True, "checked": 0, "first_broken_seq": None}

    expected_prev = GENESIS_HASH
    for expected_seq, rec in enumerate(records, start=1):
        if rec.seq != expected_seq:
            return {"valid": False, "checked": expected_seq - 1, "first_broken_seq": rec.seq}

        if rec.prev_hash != expected_prev:
            return {"valid": False, "checked": expected_seq - 1, "first_broken_seq": rec.seq}

        record_content = {
            "seq": rec.seq,
            "workspace_id": rec.workspace_id,
            "actor_id": rec.actor_id,
            "action": rec.action,
            "entity_type": rec.entity_type,
            "entity_id": rec.entity_id,
            "payload": rec.payload,
            "created_at": rec.created_at.isoformat(),
        }

        recalculated = compute_audit_hash(rec.prev_hash, record_content)
        if recalculated != rec.hash:
            return {"valid": False, "checked": expected_seq - 1, "first_broken_seq": rec.seq}

        expected_prev = rec.hash

    return {"valid": True, "checked": len(records), "first_broken_seq": None}
