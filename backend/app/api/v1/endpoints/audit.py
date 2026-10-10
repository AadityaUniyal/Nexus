from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.auth.dependencies import get_current_principal
from app.auth.principal import RequestPrincipal
from app.models.audit import AuditLog
from app.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("")
async def list_audit_logs(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    stmt = (
        select(AuditLog)
        .where(AuditLog.workspace_id == principal.workspace_id)
        .order_by(desc(AuditLog.seq))
        .limit(100)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        {
            "id": r.id,
            "seq": r.seq,
            "actor_id": r.actor_id,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "payload": r.payload,
            "prev_hash": r.prev_hash,
            "hash": r.hash,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@router.get("/verify")
async def verify_audit_log_chain(
    principal: RequestPrincipal = Depends(get_current_principal),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cryptographically verifies the append-only SHA-256 hash chain for the caller's workspace (AC-75).
    """
    return await verify_audit_chain(db, principal.workspace_id)
