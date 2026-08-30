import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.system import EventOutbox, Notification


async def process_outbox_batch(db: AsyncSession):
    stmt = (
        select(EventOutbox)
        .where(EventOutbox.processed_at.is_(None))
        .order_by(EventOutbox.created_at)
        .limit(20)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    now_iso = datetime.now(timezone.utc).isoformat()

    for outbox_item in records:
        try:
            event_type = outbox_item.event_type
            payload = outbox_item.payload or {}

            # Create notification for operational alerts
            is_relevant = (
                event_type.startswith("incident.")
                or event_type.startswith("decision.")
                or event_type.startswith("simulation.")
            )
            if is_relevant:
                n_type = "INFO"
                if "critical" in event_type:
                    n_type = "CRITICAL"
                elif "simulation" in event_type:
                    n_type = "SIMULATION"

                notif_msg = payload.get("message") or (
                    f"Event {event_type} on "
                    f"{outbox_item.aggregate_type}:{outbox_item.aggregate_id}"
                )

                notif = Notification(
                    id=f"notif-{uuid.uuid4().hex[:12]}",
                    workspace_id=outbox_item.workspace_id,
                    type=n_type,
                    title=f"Operational Update: {event_type}",
                    message=notif_msg,
                    read=False,
                )
                db.add(notif)

            # Mark processed
            outbox_item.processed_at = now_iso
            outbox_item.attempts += 1
        except Exception as e:
            outbox_item.last_error = str(e)
            outbox_item.attempts += 1

    if records:
        await db.commit()


async def run_worker_loop(interval_seconds: float = 2.0):
    print(
        f"[*] NEXUS Outbox Worker running (interval: {interval_seconds}s)..."
    )
    while True:
        try:
            async with async_session_factory() as session:
                await process_outbox_batch(session)
        except Exception as e:
            print(f"[!] Worker exception: {e}")
        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    asyncio.run(run_worker_loop())
