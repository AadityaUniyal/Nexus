import asyncio
import logging
import uuid
from sqlalchemy import select
from app.db.session import async_session_factory, engine
from app.db.base import Base
import app.models  # ensure models registered
from app.models.user import User, Workspace
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.system import DataPipelineHealth
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus.seed")

WORKSPACE_ID = "ws-continental-fleet-01"

INITIAL_WAREHOUSES = [
    {"id": "wh-chi", "code": "WH-CHI", "name": "Chicago Central Fulfillment Superhub", "city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298, "capacity_units": 15000, "current_units": 12450, "dock_count": 12, "active_docks": 8, "efficiency_pct": 96.4, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
    {"id": "wh-dfw", "code": "WH-DFW", "name": "Dallas-Fort Worth Southern Gateway", "city": "Dallas", "state": "TX", "lat": 32.7767, "lng": -96.7970, "capacity_units": 18000, "current_units": 14200, "dock_count": 16, "active_docks": 11, "efficiency_pct": 94.8, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
    {"id": "wh-atl", "code": "WH-ATL", "name": "Atlanta Logistics Terminal", "city": "Atlanta", "state": "GA", "lat": 33.7490, "lng": -84.3880, "capacity_units": 14000, "current_units": 11100, "dock_count": 10, "active_docks": 7, "efficiency_pct": 92.1, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
    {"id": "wh-den", "code": "WH-DEN", "name": "Denver High-Altitude Crossdock", "city": "Denver", "state": "CO", "lat": 39.7392, "lng": -104.9903, "capacity_units": 10000, "current_units": 7200, "dock_count": 8, "active_docks": 5, "efficiency_pct": 97.2, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
    {"id": "wh-sea", "code": "WH-SEA", "name": "Seattle Northwest Hub", "city": "Seattle", "state": "WA", "lat": 47.6062, "lng": -122.3321, "capacity_units": 12000, "current_units": 8900, "dock_count": 10, "active_docks": 6, "efficiency_pct": 95.0, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
    {"id": "wh-nyc", "code": "WH-NYC", "name": "Newark / NYC Eastern Superhub", "city": "Newark", "state": "NJ", "lat": 40.7357, "lng": -74.1724, "capacity_units": 20000, "current_units": 17800, "dock_count": 18, "active_docks": 14, "efficiency_pct": 98.1, "status": "OPERATIONAL", "workspace_id": WORKSPACE_ID},
]

INITIAL_ROUTES = [
    {"id": "rt-chi-den", "code": "RT-CHI-DEN-01", "name": "Midwest Transcontinental Corridor (I-80)", "origin_warehouse_id": "wh-chi", "origin_warehouse_name": "Chicago Central Hub", "dest_warehouse_id": "wh-den", "dest_warehouse_name": "Denver High-Altitude Hub", "distance_km": 1620.0, "avg_duration_mins": 940, "traffic_condition": "SEVERE_WEATHER_ALERT", "waypoints": [], "workspace_id": WORKSPACE_ID},
    {"id": "rt-atl-nyc", "code": "RT-ATL-NYC-02", "name": "Eastern Seaboard Primary (I-85 / I-95)", "origin_warehouse_id": "wh-atl", "origin_warehouse_name": "Atlanta Hub", "dest_warehouse_id": "wh-nyc", "dest_warehouse_name": "Newark Hub", "distance_km": 1380.0, "avg_duration_mins": 810, "traffic_condition": "NORMAL", "waypoints": [], "workspace_id": WORKSPACE_ID},
    {"id": "rt-dfw-den", "code": "RT-DFW-DEN-04", "name": "Southwest Plains Connector", "origin_warehouse_id": "wh-dfw", "origin_warehouse_name": "Dallas Hub", "dest_warehouse_id": "wh-den", "dest_warehouse_name": "Denver Hub", "distance_km": 1280.0, "avg_duration_mins": 750, "traffic_condition": "NORMAL", "waypoints": [], "workspace_id": WORKSPACE_ID},
]

INITIAL_VEHICLES = [
    {"id": "v-104", "code": "NX-104", "name": "eCascadia #104", "model": "Freightliner eCascadia", "driver_name": "Marcus Vance", "status": "IN_TRANSIT", "current_lat": 41.2565, "current_lng": -95.9345, "speed_kmh": 68.0, "battery_pct": 78, "health_score": 98, "current_route_id": "rt-chi-den", "current_route_name": "Midwest Transcontinental Corridor (I-80)", "workspace_id": WORKSPACE_ID},
    {"id": "v-109", "code": "NX-109", "name": "eCascadia #109", "model": "Freightliner eCascadia", "driver_name": "Elena Rostova", "status": "IN_TRANSIT", "current_lat": 35.2271, "current_lng": -80.8431, "speed_kmh": 72.0, "battery_pct": 84, "health_score": 96, "current_route_id": "rt-atl-nyc", "current_route_name": "Eastern Seaboard Primary (I-85 / I-95)", "workspace_id": WORKSPACE_ID},
]

INITIAL_USERS = [
    {"id": "usr-admin-01", "clerk_user_id": "local_admin_01", "email": "admin@nexus.ops", "name": "Marcus Vance", "role": "ADMINISTRATOR", "department": "Platform Governance & Security", "password": "Password123!", "workspace_id": WORKSPACE_ID},
    {"id": "usr-ops-01", "clerk_user_id": "local_ops_01", "email": "sarah.chen@nexus.ops", "name": "Sarah Chen", "role": "OPERATIONS_MANAGER", "department": "Fleet Command & Decision Dispatch", "password": "Password123!", "workspace_id": WORKSPACE_ID},
]

async def seed_database():
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # 1. Seed Workspace
        stmt = select(Workspace).where(Workspace.id == WORKSPACE_ID)
        ws = (await db.execute(stmt)).scalar_one_or_none()
        if not ws:
            ws = Workspace(
                id=WORKSPACE_ID,
                name="Continental Freight Network",
                code="CFN-MAIN",
                region="North America Central",
            )
            db.add(ws)
            await db.commit()
            logger.info("Seeded primary workspace: %s", WORKSPACE_ID)

        # 2. Seed Users
        for u_data in INITIAL_USERS:
            stmt = select(User).where(User.email == u_data["email"])
            existing_u = (await db.execute(stmt)).scalar_one_or_none()
            if not existing_u:
                u = User(
                    id=u_data["id"],
                    clerk_user_id=u_data["clerk_user_id"],
                    email=u_data["email"],
                    name=u_data["name"],
                    hashed_password=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    department=u_data["department"],
                    workspace_id=u_data["workspace_id"],
                    is_active=True,
                )
                db.add(u)
                logger.info("Seeded user: %s (%s)", u_data["email"], u_data["role"])

        # 3. Seed Warehouses
        for w_data in INITIAL_WAREHOUSES:
            stmt = select(Warehouse).where(Warehouse.id == w_data["id"])
            if not (await db.execute(stmt)).scalar_one_or_none():
                db.add(Warehouse(**w_data))

        # 4. Seed Routes
        for r_data in INITIAL_ROUTES:
            stmt = select(Route).where(Route.id == r_data["id"])
            if not (await db.execute(stmt)).scalar_one_or_none():
                db.add(Route(**r_data))

        # 5. Seed Vehicles
        for v_data in INITIAL_VEHICLES:
            stmt = select(Vehicle).where(Vehicle.id == v_data["id"])
            if not (await db.execute(stmt)).scalar_one_or_none():
                db.add(Vehicle(**v_data))

        await db.commit()
        logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
