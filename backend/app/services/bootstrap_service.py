import uuid
import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, Workspace, AvatarPreferences
from app.models.system import Notification
from app.models.operations import Warehouse, Vehicle, Route, Order
from app.models.incidents import Incident
from app.auth.principal import RequestPrincipal, RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP
from app.schemas.me import (
    BootstrapResponse,
    UserProfileRead,
    WorkspaceRead,
    OnboardingProgress,
    AvatarPreferencesDTO
)

logger = logging.getLogger("nexus.bootstrap")

async def seed_initial_workspace_data(db: AsyncSession, workspace_id: str):
    """Seed initial operational entities for a newly bootstrapped workspace."""
    # Check if warehouses exist
    w_res = await db.execute(select(func.count()).select_from(Warehouse).where(Warehouse.workspace_id == workspace_id))
    if (w_res.scalar() or 0) > 0:
        return

    logger.info(f"Seeding operational entities for workspace {workspace_id}")

    wh1 = Warehouse(
        id="wh-chi-01",
        code="WH-ORD-01",
        name="Chicago O'Hare Freight Hub",
        city="Chicago",
        state="IL",
        lat=41.9742,
        lng=-87.9073,
        capacity_units=15000,
        current_units=12450,
        dock_count=8,
        active_docks=6,
        efficiency_pct=94.2,
        status="OPERATIONAL",
        workspace_id=workspace_id
    )
    wh2 = Warehouse(
        id="wh-dfw-01",
        code="WH-DFW-01",
        name="Dallas Fort Worth Regional Terminal",
        city="Dallas",
        state="TX",
        lat=32.8998,
        lng=-97.0403,
        capacity_units=18000,
        current_units=14200,
        dock_count=8,
        active_docks=7,
        efficiency_pct=96.0,
        status="OPERATIONAL",
        workspace_id=workspace_id
    )
    db.add_all([wh1, wh2])
    await db.flush()

    v1 = Vehicle(
        id="v-104",
        code="NX-104",
        name="Freightliner eCascadia Class-8",
        model="eCascadia 2026 EV",
        driver_name="Marcus Vance",
        status="IN_TRANSIT",
        current_lat=41.2565,
        current_lng=-95.9345,
        speed_kmh=68.5,
        battery_pct=82,
        health_score=98,
        current_route_name="Chicago - Denver Interstate 80 Pass",
        workspace_id=workspace_id
    )
    v2 = Vehicle(
        id="v-109",
        code="NX-TRK-109",
        name="Volvo VNR Electric Heavy Duty",
        model="VNR Electric 6x4",
        driver_name="Elena Rostova",
        status="IN_TRANSIT",
        current_lat=39.7392,
        current_lng=-104.9903,
        speed_kmh=72.0,
        battery_pct=74,
        health_score=95,
        current_route_name="Denver - Dallas Corridor",
        workspace_id=workspace_id
    )
    db.add_all([v1, v2])
    await db.flush()

    r1 = Route(
        id="rt-801",
        code="RT-CHI-DEN-01",
        name="Midwest Continental Arterial (Chicago to Denver)",
        origin_warehouse_id=wh1.id,
        origin_warehouse_name=wh1.name,
        dest_warehouse_id=wh2.id,
        dest_warehouse_name=wh2.name,
        distance_km=1620.0,
        avg_duration_mins=940,
        traffic_condition="MODERATE_CONGESTION",
        workspace_id=workspace_id
    )
    db.add(r1)
    await db.flush()

    o1 = Order(
        id="ord-901",
        order_number="ORD-2026-9801",
        customer_name="AeroTech Defense Dynamics",
        destination="Denver Logistics Hub Dock 4",
        priority="HIGH",
        status="IN_TRANSIT",
        total_cost=2450.00,
        deadline="2026-09-25T18:00:00Z",
        warehouse_id=wh1.id,
        vehicle_id=v1.id,
        vehicle_code=v1.code,
        workspace_id=workspace_id
    )
    o2 = Order(
        id="ord-902",
        order_number="ORD-2026-9802",
        customer_name="BioPharma ColdChain Logistics",
        destination="Dallas Metro Terminal",
        priority="CRITICAL",
        status="IN_TRANSIT",
        total_cost=3180.00,
        deadline="2026-09-25T14:00:00Z",
        warehouse_id=wh2.id,
        vehicle_id=v2.id,
        vehicle_code=v2.code,
        workspace_id=workspace_id
    )
    db.add_all([o1, o2])

    inc1 = Incident(
        id="inc-8041",
        code="INC-8041",
        title="Blizzard Hazard & Highway Closure on I-80 Pass",
        summary="Severe winter storm system creating whiteout conditions and commercial transport blockage.",
        severity="HIGH",
        status="DETECTED",
        affected_entity_type="ROUTE",
        affected_entity_id=r1.id,
        affected_entity_name=r1.name,
        cost_estimate=4200.0,
        orders_affected=2,
        delay_minutes=180,
        workspace_id=workspace_id
    )
    db.add(inc1)

    n1 = Notification(
        id="notif-1",
        workspace_id=workspace_id,
        type="CRITICAL",
        title="Severe Blizzard Alert on I-80 Pass",
        message="Route RT-CHI-DEN-01 impacted by weather anomaly. Alternate detour simulation available.",
        deep_link="/incidents/inc-8041",
        read=False
    )
    db.add(n1)

    await db.commit()
    logger.info(f"Successfully seeded initial operational data for workspace {workspace_id}")


async def bootstrap_user_session(db: AsyncSession, principal: RequestPrincipal) -> BootstrapResponse:
    """
    Idempotently ensures user exists in DB and returns aggregate bootstrap context.
    """
    # 1. Fetch user or ensure created
    stmt = select(User).where(User.email == principal.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Check if default workspace exists
        ws_stmt = select(Workspace).limit(1)
        ws_res = await db.execute(ws_stmt)
        default_ws = ws_res.scalars().first()

        if not default_ws:
            default_ws = Workspace(
                id="ws-continental-fleet-01",
                name="Continental Freight Network",
                slug="continental-freight-network",
                type="ENTERPRISE_LOGISTICS",
                region="US_CENTRAL",
                scale="NATIONAL_NETWORK",
                is_demo=True,
                is_active=True
            )
            db.add(default_ws)
            await db.flush()

        user = User(
            id=principal.nexus_user_id or f"usr-{uuid.uuid4().hex[:8]}",
            clerk_user_id=principal.clerk_user_id,
            email=principal.email,
            name=principal.display_name or "Sarah Chen",
            role=principal.role.value if hasattr(principal.role, "value") else str(principal.role),
            department="Continental Logistics",
            onboarding_status="COMPLETE",
            workspace_id=default_ws.id,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 2. Ensure initial operational data is seeded
    await seed_initial_workspace_data(db, user.workspace_id)

    # 3. Fetch workspace
    ws_stmt = select(Workspace).where(Workspace.id == user.workspace_id)
    ws_res = await db.execute(ws_stmt)
    workspace = ws_res.scalars().first()

    # 4. Fetch unread notifications count
    notif_stmt = select(func.count()).select_from(Notification).where(
        Notification.workspace_id == user.workspace_id,
        Notification.read == False
    )
    notif_res = await db.execute(notif_stmt)
    unread_count = notif_res.scalar() or 0

    # 5. Fetch or default avatar preferences
    av_stmt = select(AvatarPreferences).where(AvatarPreferences.user_id == user.id)
    av_res = await db.execute(av_stmt)
    av_pref = av_res.scalars().first()

    avatar_dto = AvatarPreferencesDTO(
        enabled=av_pref.enabled if av_pref else True,
        reducedMotion=av_pref.reduced_motion if av_pref else False,
        companionHintsEnabled=av_pref.companion_hints_enabled if av_pref else True,
        soundEnabled=av_pref.sound_enabled if av_pref else False,
        avatarVariant=av_pref.avatar_variant if av_pref else "TACTILE_SPATIAL_MINIMAL"
    )

    role_enum = RoleEnum(user.role) if user.role in RoleEnum.__members__ else RoleEnum.OPERATIONS_MANAGER
    permissions = [p.value for p in ROLE_PERMISSIONS_MAP.get(role_enum, [])]

    is_onboarded = (user.onboarding_status == "COMPLETE")

    return BootstrapResponse(
        user=UserProfileRead(
            id=user.id,
            clerkUserId=user.clerk_user_id,
            email=user.email,
            name=user.name,
            role=user.role,
            department=user.department,
            isActive=user.is_active
        ),
        workspace=WorkspaceRead(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            type=workspace.type,
            region=workspace.region,
            scale=workspace.scale,
            isDemo=workspace.is_demo
        ) if workspace else None,
        role=user.role,
        permissions=permissions,
        onboarding=OnboardingProgress(
            completed=is_onboarded,
            status=user.onboarding_status,
            nextStep=None if is_onboarded else "/onboarding/workspace"
        ),
        unreadNotifications=unread_count,
        dataFreshness="FRESH",
        destination="/app/overview" if is_onboarded else "/onboarding/welcome",
        avatar=avatar_dto
    )
