import asyncio
import logging
import uuid
from sqlalchemy import select
from app.db.session import async_session_factory, engine
from app.db.base import Base
import app.models  # ensure models registered
from app.models.organization import Organization, SubscriptionPlan, OrganizationMembership
from app.models.user import User, Workspace, WorkspaceMembership
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.fleet import VehicleType, Driver
from app.models.logistics import Customer, Trip
from app.models.telemetry import VehicleStatus
from app.models.incidents import Incident, IncidentTimeline
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus.seed")

ORG_ID = "org-nexus-demo"
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
        # 1. Seed Demo Organization
        stmt = select(Organization).where(Organization.id == ORG_ID)
        org = (await db.execute(stmt)).scalar_one_or_none()
        if not org:
            org = Organization(
                id=ORG_ID,
                name="Continental Freight Network Corp",
                slug="continental-freight-network",
                industry="GLOBAL_LOGISTICS",
                country="United States",
                plan="ENTERPRISE",
                is_active=True,
            )
            db.add(org)
            await db.flush()
            sub = SubscriptionPlan(
                organization_id=org.id,
                plan_tier="ENTERPRISE",
                max_vehicles=1000,
                max_users=100,
                ai_copilot_enabled=True,
                fabric_integration_enabled=True,
            )
            db.add(sub)
            await db.commit()
            logger.info("Seeded primary organization: %s", ORG_ID)

        # 2. Seed Primary Workspace
        stmt_ws = select(Workspace).where(Workspace.id == WORKSPACE_ID)
        ws = (await db.execute(stmt_ws)).scalar_one_or_none()
        if not ws:
            ws = Workspace(
                id=WORKSPACE_ID,
                name="Continental North America Hub",
                slug="continental-na-hub",
                organization_id=ORG_ID,
                region="US_CENTRAL",
                is_demo=False,
                is_active=True,
            )
            db.add(ws)
            await db.commit()
            logger.info("Seeded primary workspace: %s", WORKSPACE_ID)

        # 3. Seed Users
        for u_data in INITIAL_USERS:
            stmt_u = select(User).where(User.email == u_data["email"])
            existing_u = (await db.execute(stmt_u)).scalar_one_or_none()
            if not existing_u:
                u = User(
                    id=u_data["id"],
                    clerk_user_id=u_data["clerk_user_id"],
                    email=u_data["email"],
                    name=u_data["name"],
                    hashed_password=get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    department=u_data["department"],
                    organization_id=ORG_ID,
                    workspace_id=u_data["workspace_id"],
                    is_active=True,
                )
                db.add(u)
                await db.flush()
                om = OrganizationMembership(
                    organization_id=ORG_ID,
                    user_id=u.id,
                    role=u_data["role"],
                    is_default=True,
                )
                wm = WorkspaceMembership(
                    workspace_id=WORKSPACE_ID,
                    user_id=u.id,
                    role=u_data["role"],
                )
                db.add(om)
                db.add(wm)
                logger.info("Seeded user: %s (%s)", u_data["email"], u_data["role"])

        # 4. Seed Warehouses
        for w_data in INITIAL_WAREHOUSES:
            stmt_w = select(Warehouse).where(Warehouse.id == w_data["id"])
            if not (await db.execute(stmt_w)).scalar_one_or_none():
                db.add(Warehouse(**w_data))
        await db.flush()

        # 5. Seed Routes
        for r_data in INITIAL_ROUTES:
            stmt_r = select(Route).where(Route.id == r_data["id"])
            if not (await db.execute(stmt_r)).scalar_one_or_none():
                db.add(Route(**r_data))
        await db.flush()

        # 6. Seed Vehicles
        for v_data in INITIAL_VEHICLES:
            stmt_v = select(Vehicle).where(Vehicle.id == v_data["id"])
            if not (await db.execute(stmt_v)).scalar_one_or_none():
                v = Vehicle(**v_data)
                db.add(v)
                await db.flush()
                vs = VehicleStatus(
                    vehicle_id=v.id,
                    status=v.status,
                    lat=v.current_lat,
                    lng=v.current_lng,
                    speed_kmh=v.speed_kmh,
                    heading=90.0,
                    battery_pct=v.battery_pct,
                    health_score=v.health_score,
                    last_telemetry_at="2026-09-14T12:00:00Z",
                    workspace_id=WORKSPACE_ID,
                )
                db.add(vs)

        # 7. Seed Active Demonstration Incident
        stmt_inc = select(Incident).where(Incident.code == "INC-802")
        if not (await db.execute(stmt_inc)).scalar_one_or_none():
            inc = Incident(
                id="inc-weather-01",
                code="INC-802",
                title="Severe Atmospheric Blizzard: I-80 Nebraska Corridor",
                summary="Winter storm blizzard obstruction with sustained 70 km/h crosswinds and zero road visibility near Omaha, NE.",
                severity="CRITICAL",
                category="WEATHER",
                status="DETECTED",
                lat=41.2565,
                lng=-95.9345,
                affected_entity_type="VEHICLE",
                affected_entity_id="v-104",
                affected_entity_name="eCascadia #104",
                vehicle_id="v-104",
                delay_minutes=180,
                cost_estimate=2850.0,
                orders_affected=14,
                risk_score=94,
                root_cause="Blizzard whiteout and black ice accumulation along Interstate I-80 corridor.",
                ai_analysis="Immediate counterfactual detour via I-70 South Corridor will recover 135 minutes with 88% SLA protection.",
                workspace_id=WORKSPACE_ID,
            )
            db.add(inc)
            await db.flush()
            tl = IncidentTimeline(
                incident_id=inc.id,
                status="DETECTED",
                note="Atmospheric sensor array flagged critical blizzard obstruction.",
                actor_name="Automated Weather Sentinel",
            )
            db.add(tl)

        await db.commit()
        logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
