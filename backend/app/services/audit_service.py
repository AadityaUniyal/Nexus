import uuid
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system import AuditLog

async def log_audit_action(
    db: AsyncSession,
    workspace_id: str,
    actor_id: str,
    actor_name: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: str,
    metadata_json: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> AuditLog:
    """
    Appends an immutable audit log entry into the ledger.
    """
    log_entry = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        workspace_id=workspace_id,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        metadata_json=metadata_json or {},
        request_id=request_id
    )
    db.add(log_entry)
    return log_entry
