import pytest
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.services.audit_service import append_audit_entry, verify_audit_chain
from app.models.audit import AuditLog

@pytest.mark.asyncio
async def test_audit_hash_chain_creation_and_verification():
    """Verify cryptographic SHA-256 hash chaining and tamper-detection engine."""
    ws_id = "ws_tenant_a"

    async with AsyncSessionLocal() as session:
        # 1. Append 3 audit records
        entry_1 = await append_audit_entry(
            db=session,
            workspace_id=ws_id,
            actor_id="user_tenant_a",
            action="job_created",
            entity_type="job",
            entity_id="job_001",
            payload={"title": "First delivery job"}
        )
        assert entry_1.seq == 1
        assert entry_1.prev_hash == "0" * 64
        assert len(entry_1.hash) == 64

        entry_2 = await append_audit_entry(
            db=session,
            workspace_id=ws_id,
            actor_id="user_tenant_a",
            action="driver_assigned",
            entity_type="job",
            entity_id="job_001",
            payload={"driver_id": "drv_001"}
        )
        assert entry_2.seq == 2
        assert entry_2.prev_hash == entry_1.hash

        entry_3 = await append_audit_entry(
            db=session,
            workspace_id=ws_id,
            actor_id="drv_001",
            action="stop_arrived",
            entity_type="job_stop",
            entity_id="stop_001",
            payload={"arrived_at": "2026-10-15T09:30:00Z"}
        )
        assert entry_3.seq == 3
        assert entry_3.prev_hash == entry_2.hash

        # 2. Verify audit chain from database
        res = await verify_audit_chain(session, ws_id)
        assert res["valid"] is True
        assert res["checked"] == 3
        assert res["first_broken_seq"] is None

        # 3. Tamper with entry_2 payload
        entry_2.payload = {"driver_id": "drv_fraudulent"}
        session.add(entry_2)
        await session.flush()

        # 4. Verification must detect tampering and fail at sequence 2
        tamper_res = await verify_audit_chain(session, ws_id)
        assert tamper_res["valid"] is False
        assert tamper_res["first_broken_seq"] == 2
