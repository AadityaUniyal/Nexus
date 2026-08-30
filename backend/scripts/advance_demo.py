import asyncio
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.operations import Vehicle, Warehouse
from app.services.event_service import record_operational_event

async def advance_operational_demo():
    print("[*] Advancing operational state and dispatching real-time domain events...")
    async with async_session_factory() as session:
        # 1. Update vehicle positions and dispatch movement events
        stmt = select(Vehicle).limit(5)
        res = await session.execute(stmt)
        vehicles = res.scalars().all()

        for v in vehicles:
            v.current_lat += (random.random() - 0.5) * 0.02
            v.current_lng += (random.random() - 0.5) * 0.02
            v.speed_kmh = max(30.0, min(105.0, v.speed_kmh + random.randint(-5, 5)))
            
            await record_operational_event(
                db=session,
                workspace_id=v.workspace_id,
                event_type="vehicle.location_updated",
                entity_type="VEHICLE",
                entity_id=v.id,
                message=f"Vehicle {v.code} telemetry refreshed: speed {v.speed_kmh:.1f} km/h, position ({v.current_lat:.4f}, {v.current_lng:.4f})",
                severity="INFO",
                payload={"speedKmh": v.speed_kmh, "lat": v.current_lat, "lng": v.current_lng}
            )

        # 2. Update warehouse capacity
        w_stmt = select(Warehouse).limit(1)
        w_res = await session.execute(w_stmt)
        w = w_res.scalars().first()
        if w:
            w.current_units += random.randint(-50, 80)
            await record_operational_event(
                db=session,
                workspace_id=w.workspace_id,
                event_type="warehouse.capacity_changed",
                entity_type="WAREHOUSE",
                entity_id=w.id,
                message=f"Hub {w.code} inventory updated to {w.current_units} units ({round(w.current_units/w.capacity_units*100)}% utilization)",
                severity="INFO"
            )

        await session.commit()
    print("[+] Operational simulation step advanced and events dispatched.")

if __name__ == "__main__":
    asyncio.run(advance_operational_demo())
