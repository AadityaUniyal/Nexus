import asyncio
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory, engine
from app.db.base import Base
import app.models  # Ensure all models are registered on Base.metadata
from app.models.user import Workspace, User, WorkspaceMembership
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.incidents import Incident, IncidentTimeline
from app.models.simulations import Simulation
from app.models.system import Notification, AuditLog, PipelineHealth, OperationalEvent
from app.core.security import get_password_hash

async def seed_database():
    print("[*] Creating tables if not exist in PostgreSQL Neon...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[*] Seeding deterministic NEXUS operational database...")
    random.seed(42)

    async with async_session_factory() as session:
        # Check if already seeded
        ws_check = await session.execute(select(Workspace).where(Workspace.id == "ws-continental-fleet-01"))
        if ws_check.scalars().first():
            print("[+] Database already seeded with ws-continental-fleet-01. Skipping.")
            return

        # 1. Create Workspace
        ws = Workspace(
            id="ws-continental-fleet-01",
            name="Continental Freight Network",
            slug="continental-freight-network",
            type="ENTERPRISE_LOGISTICS",
            region="US_CENTRAL",
            scale="NATIONAL_NETWORK",
            is_demo=True,
            is_active=True
        )
        session.add(ws)
        await session.flush()

        # 2. Create Users
        users_data = [
            ("usr-sarah-104", "sarah.chen@nexus.continental", "Sarah Chen", "ADMINISTRATOR", "Operations Leadership"),
            ("usr-marcus-02", "marcus.vance@nexus.continental", "Marcus Vance", "OPERATIONS_MANAGER", "Fleet Dispatch"),
            ("usr-elena-03", "elena.rostova@nexus.continental", "Elena Rostova", "ANALYST", "Predictive Logistics"),
            ("usr-david-04", "david.kim@nexus.continental", "David Kim", "OPERATOR", "Central Dock Control"),
            ("usr-viewer-05", "audit.viewer@nexus.continental", "External Auditor", "VIEWER", "Compliance Oversight")
        ]

        for u_id, email, name, role, dept in users_data:
            u = User(
                id=u_id,
                clerk_user_id=f"clerk_{u_id}",
                email=email,
                name=name,
                hashed_password=get_password_hash("MissionCritical2026!"),
                role=role,
                department=dept,
                onboarding_status="COMPLETE",
                workspace_id=ws.id,
                is_active=True
            )
            session.add(u)
            m = WorkspaceMembership(
                id=f"mem-{uuid.uuid4().hex[:8]}",
                workspace_id=ws.id,
                user_id=u_id,
                role=role
            )
            session.add(m)

        # 3. Warehouses
        warehouses_data = [
            ("wh-chi", "WH-CHI", "Chicago Central Logistics Hub", "Chicago", "IL", 41.8781, -87.6298, 15000, 12450, 24, 19, 96.4),
            ("wh-dfw", "WH-DFW", "Dallas-Fort Worth Freight Center", "Dallas", "TX", 32.7767, -96.7970, 18000, 14200, 28, 22, 94.8),
            ("wh-den", "WH-DEN", "Denver Mountain Relay Terminal", "Denver", "CO", 39.7392, -104.9903, 10000, 8900, 16, 15, 91.2),
        ]
        for w_id, code, name, city, state, lat, lng, cap, cur, docks, active_d, eff in warehouses_data:
            w = Warehouse(
                id=w_id,
                code=code,
                name=name,
                city=city,
                state=state,
                lat=lat,
                lng=lng,
                capacity_units=cap,
                current_units=cur,
                dock_count=docks,
                active_docks=active_d,
                efficiency_pct=eff,
                status="OPERATIONAL",
                workspace_id=ws.id
            )
            session.add(w)

        # 4. Routes
        routes_data = [
            ("rt-chi-den", "RT-CHI-DEN-01", "Chicago -> Denver Inter-Hub Corridor", "wh-chi", "Chicago Central Logistics Hub", "wh-den", "Denver Mountain Relay Terminal", 1620.0, 940, "SEVERE_WEATHER_ALERT"),
            ("rt-chi-dfw", "RT-CHI-DFW-02", "Chicago -> Dallas Express Line", "wh-chi", "Chicago Central Logistics Hub", "wh-dfw", "Dallas-Fort Worth Freight Center", 1480.0, 860, "NORMAL"),
            ("rt-dfw-den", "RT-DFW-DEN-03", "Dallas -> Denver Mountain Run", "wh-dfw", "Dallas-Fort Worth Freight Center", "wh-den", "Denver Mountain Relay Terminal", 1260.0, 780, "NORMAL"),
        ]
        for r_id, code, name, o_id, o_name, d_id, d_name, dist, dur, traf in routes_data:
            r = Route(
                id=r_id,
                code=code,
                name=name,
                origin_warehouse_id=o_id,
                origin_warehouse_name=o_name,
                dest_warehouse_id=d_id,
                dest_warehouse_name=d_name,
                distance_km=dist,
                avg_duration_mins=dur,
                traffic_condition=traf,
                waypoints=[
                    {"lat": 41.8781, "lng": -87.6298, "label": "Chicago Origin"},
                    {"lat": 41.2565, "lng": -95.9345, "label": "Omaha Relay"},
                    {"lat": 39.7392, "lng": -104.9903, "label": "Denver Terminal"}
                ],
                workspace_id=ws.id
            )
            session.add(r)

        # 5. Vehicles
        for i in range(1, 21):
            v_code = f"NX-{100 + i}"
            v = Vehicle(
                id=f"v-{100 + i}",
                code=v_code,
                name=f"Freightliner eCascadia #{v_code}",
                model="Class-8 Commercial EV",
                driver_name=f"Driver {i}",
                status="IN_TRANSIT" if i <= 15 else "IDLE",
                current_lat=41.2 + (i * 0.05),
                current_lng=-95.9 + (i * 0.05),
                speed_kmh=84.0 if i <= 15 else 0.0,
                battery_pct=random.randint(65, 98),
                health_score=random.randint(90, 100),
                current_route_id="rt-chi-den" if i % 2 == 0 else "rt-chi-dfw",
                current_route_name="Chicago -> Denver Inter-Hub Corridor" if i % 2 == 0 else "Chicago -> Dallas Express Line",
                workspace_id=ws.id
            )
            session.add(v)

        # 6. Active Incidents
        inc = Incident(
            id="inc-849201",
            code="INC-849201",
            title="I-80 Blizzard Corridor Impasse & Thermal Fleet Delay",
            summary="Severe sudden snowfall over Nebraska mountain pass has brought transit velocity down to 12 km/h.",
            severity="CRITICAL",
            status="INVESTIGATING",
            affected_entity_type="ROUTE",
            affected_entity_id="rt-chi-den",
            affected_entity_name="Chicago -> Denver Inter-Hub Corridor",
            delay_minutes=180,
            cost_estimate=14500.0,
            root_cause="Blizzard condition with 65 mph gusts closing westbound commercial lanes.",
            ai_analysis="AI evaluates 84% SLA violation risk across 14 high-value consignments.",
            workspace_id=ws.id
        )
        session.add(inc)

        t1 = IncidentTimeline(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            incident_id=inc.id,
            status="DETECTED",
            note="IoT sensor reported speed drop below threshold (<20km/h)",
            actor_name="Automated Watchdog"
        )
        t2 = IncidentTimeline(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            incident_id=inc.id,
            status="ACKNOWLEDGED",
            note="Operations Manager acknowledged incident and opened investigation",
            actor_name="Sarah Chen"
        )
        session.add(t1)
        session.add(t2)

        # 7. Pipeline Health
        p1 = PipelineHealth(id="pipe-1", source_name="Raw GPS IoT Stream", source_type="IOT_TELEMETRY", status="HEALTHY", latency_ms=4, throughput_per_sec=1420, records_today=1240000)
        p2 = PipelineHealth(id="pipe-2", source_name="Azure Event Hubs Gateway", source_type="AZURE_HUB", status="HEALTHY", latency_ms=12, throughput_per_sec=980, records_today=840000)
        p3 = PipelineHealth(id="pipe-3", source_name="Microsoft Fabric OneLake Sync", source_type="FABRIC_LAKE", status="HEALTHY", latency_ms=310, throughput_per_sec=420, records_today=410000)
        session.add_all([p1, p2, p3])

        # 8. Operational Orders
        orders_data = [
            ("ord-5001", "ORD-2026-5001", "AeroTech Propulsion Systems", "Denver Terminal Bay 4", "CRITICAL", "IN_TRANSIT", 12500.0, "2026-08-30T18:00:00Z", "v-104", "NX-104"),
            ("ord-5002", "ORD-2026-5002", "BioPharma ColdChain Logistics", "Denver Mountain Relay", "HIGH", "IN_TRANSIT", 8400.0, "2026-08-30T20:30:00Z", "v-104", "NX-104"),
            ("ord-5003", "ORD-2026-5003", "Apex Semiconductor Corp", "Dallas Freight Center", "NORMAL", "IN_TRANSIT", 4200.0, "2026-08-31T06:00:00Z", "v-101", "NX-101"),
            ("ord-5004", "ORD-2026-5004", "Continental Battery Systems", "Chicago Hub Central", "STANDARD", "IN_TRANSIT", 6100.0, "2026-08-31T12:00:00Z", "v-102", "NX-102"),
            ("ord-5005", "ORD-2026-5005", "Precision Robotics GmbH", "Denver Terminal Bay 1", "HIGH", "DELAYED", 9800.0, "2026-08-30T16:00:00Z", "v-104", "NX-104"),
        ]
        for o_id, o_num, cust, dest, prio, stat, cost, dline, v_id, v_code in orders_data:
            ord_obj = Order(
                id=o_id,
                order_number=o_num,
                customer_name=cust,
                destination=dest,
                priority=prio,
                status=stat,
                total_cost=cost,
                deadline=dline,
                vehicle_id=v_id,
                vehicle_code=v_code,
                workspace_id=ws.id,
            )
            session.add(ord_obj)

        # 9. Initial Notifications
        notifs_data = [
            ("notif-1", "CRITICAL", "Severe Blizzard Alert on I-80 Pass", "Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.", "/incidents/inc-849201", False),
            ("notif-2", "ATTENTION", "Thermal Unit Drift on NX-TRK-109", "Auxiliary condenser temperature deviation (+3.2°C) detected on Volvo VNR Electric.", "/incidents/inc-849201", False),
            ("notif-3", "SIMULATION", "Simulation Ready: I-70 Detour Analysis", "Scenario SIM-SCENARIO-901 shows 135 mins net time recovery with 94% recommendation score.", "/simulations/sim-901", True),
        ]
        for n_id, n_type, title, msg, link, read_status in notifs_data:
            n_obj = Notification(
                id=n_id,
                workspace_id=ws.id,
                type=n_type,
                title=title,
                message=msg,
                deep_link=link,
                read=read_status,
            )
            session.add(n_obj)

        await session.commit()
    print("[+] Deterministic seed successfully applied.")

if __name__ == "__main__":
    asyncio.run(seed_database())
