from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User, WorkspaceMembership
from app.models.system import AuditLog, PipelineHealth
from app.schemas.user import UserRead, UserRoleUpdate
from app.schemas.system import AuditLogRead, PipelineHealthRead
from app.integrations.location import get_location_provider
from app.services.location_service import LocationService
from app.core.errors import EntityNotFoundException, NexusException
from app.auth.dependencies import require_permission, get_current_principal, get_optional_principal
from app.auth.principal import PermissionEnum, RequestPrincipal, RoleEnum

router = APIRouter(prefix="/admin", tags=["Admin & Governance"])

@router.get("/overview")
async def get_admin_overview(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
) -> Dict[str, Any]:
    """Retrieve platform governance overview and aggregate statistics."""
    ws = principal.workspace_id
    u_stmt = select(func.count()).select_from(WorkspaceMembership).where(WorkspaceMembership.workspace_id == ws)
    u_res = await db.execute(u_stmt)
    users_count = u_res.scalar() or 0

    a_stmt = select(func.count()).select_from(AuditLog).where(AuditLog.workspace_id == ws)
    a_res = await db.execute(a_stmt)
    audit_count = a_res.scalar() or 0

    return {
        "usersCount": users_count,
        "activePipelines": None,
        "auditLogsCount": audit_count,
        "systemStatus": "UNVERIFIED",
        "activeIntegrations": None,
        "securityAlerts": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/users", response_model=List[UserRead])
async def list_admin_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_USERS)),
):
    """List all workspace users directly from PostgreSQL with pagination."""
    ws = principal.workspace_id
    stmt = (
        select(User, WorkspaceMembership.role)
        .join(WorkspaceMembership, WorkspaceMembership.user_id == User.id)
        .where(WorkspaceMembership.workspace_id == ws)
        .order_by(User.name, User.id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    users = result.all()
    return [
        UserRead(
            id=u.id,
            email=u.email,
            name=u.name,
            role=membership_role,
            department=u.department or "Operations",
            is_active=u.is_active,
            workspace_id=ws,
        ) for u, membership_role in users
    ]

@router.get("/users/{user_id}", response_model=UserRead)
async def get_admin_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_USERS)),
):
    """Retrieve a single user by ID from PostgreSQL within the principal workspace."""
    ws = principal.workspace_id
    stmt = select(User, WorkspaceMembership.role).join(
        WorkspaceMembership, WorkspaceMembership.user_id == User.id
    ).where(
        WorkspaceMembership.workspace_id == ws,
        or_(User.id == user_id, User.email == user_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise EntityNotFoundException("User", user_id)
    user, membership_role = row
    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        role=membership_role,
        department=user.department or "Operations",
        is_active=user.is_active,
        workspace_id=ws,
    )

@router.patch("/users/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: str,
    req: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_ROLES)),
):
    """Update a user's RBAC role in PostgreSQL within the principal workspace."""
    ws = principal.workspace_id
    stmt = select(User, WorkspaceMembership).join(
        WorkspaceMembership, WorkspaceMembership.user_id == User.id
    ).where(
        WorkspaceMembership.workspace_id == ws,
        or_(User.id == user_id, User.email == user_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise EntityNotFoundException("User", user_id)

    user, membership = row
    try:
        new_role = RoleEnum(req.role.upper()).value
    except ValueError as exc:
        raise NexusException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="INVALID_ROLE",
            message="Choose a supported workspace role.",
        ) from exc
    membership.role = new_role
    # Retain the legacy field only for the user's default workspace during the
    # transition; authorization for a selected workspace reads its membership.
    if user.workspace_id == ws:
        user.role = new_role
    await db.commit()
    await db.refresh(user)

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        role=membership.role,
        department=user.department or "Operations",
        is_active=user.is_active,
        workspace_id=ws,
    )

@router.get("/roles")
async def get_admin_roles(
    principal: Optional[RequestPrincipal] = Depends(get_optional_principal),
) -> Dict[str, Any]:
    """Retrieve canonical RBAC roles and permissions from backend security matrix."""
    from app.auth.principal import RoleEnum, PermissionEnum, ROLE_PERMISSIONS_MAP

    roles_data = []
    for r in RoleEnum:
        perms = [p.value for p in ROLE_PERMISSIONS_MAP.get(r, [])]
        roles_data.append({
            "role": r.value,
            "title": r.value.replace("_", " ").title(),
            "perms": perms,
        })

    permissions_list = [
        {"key": p.value, "label": p.value.replace("_", " ").title()}
        for p in PermissionEnum
    ]

    return {
        "roles": roles_data,
        "permissions": permissions_list,
        "total_roles": len(roles_data),
    }


@router.get("/pipeline", response_model=List[PipelineHealthRead])
async def get_data_pipeline_health(
    db: AsyncSession = Depends(get_db),
    principal: Optional[RequestPrincipal] = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
):
    """Retrieve telemetry ingestion pipeline health status from PostgreSQL."""
    result = await db.execute(select(PipelineHealth))
    rows = result.scalars().all()
    return [
        PipelineHealthRead(
            id=p.id,
            source_name=p.source_name,
            source_type=p.source_type,
            status=p.status,
            latency_ms=p.latency_ms,
            throughput_per_sec=p.throughput_per_sec,
            records_today=p.records_today,
        ) for p in rows
    ]

@router.get("/health")
@router.get("/system-health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
) -> Dict[str, Any]:
    """Return only checks performed by this request."""
    started = datetime.now(timezone.utc)
    try:
        result = await db.execute(text("SELECT 1"))
        connected = result.scalar() == 1
        latency = round((datetime.now(timezone.utc) - started).total_seconds() * 1000, 2) if connected else None
    except Exception:
        connected = False
        latency = None

    status_value = "HEALTHY" if connected else "DEGRADED"
    return {
        "status": status_value,
        "subsystems": {
            "api": {"name": "API process", "status": "RUNNING"},
            "database": {"name": "Database", "status": "CONNECTED" if connected else "DISCONNECTED", "latencyMs": latency},
        },
        "services": {"database": "CONNECTED" if connected else "DISCONNECTED"},
        "platform": "NEXUS",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/audit", response_model=List[AuditLogRead])
async def list_audit_logs(
    workspace_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.VIEW_AUDIT)),
):
    """Retrieve immutable audit log history from PostgreSQL."""
    ws = principal.workspace_id
    stmt = select(AuditLog).where(AuditLog.workspace_id == ws).order_by(AuditLog.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return [
        AuditLogRead(
            id=a.id,
            workspace_id=a.workspace_id,
            actor_id=a.actor_id,
            actor_name=a.actor_name,
            action=a.action,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            details=a.details,
            metadata_json=a.metadata_json or {},
            created_at=a.created_at.isoformat() if hasattr(a.created_at, "isoformat") else str(a.created_at),
        ) for a in logs
    ]

@router.get("/integrations")
async def list_integrations(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> List[Dict[str, Any]]:
    """Report configured integrations without implying an unperformed health check."""
    location_health = await get_location_provider().health_check()
    entries = [
        ("geoapify", "Location and geocoding", bool(settings.GEOAPIFY_API_KEY), location_health.get("status", "UNKNOWN") if settings.GEOAPIFY_API_KEY else "NOT_CONFIGURED"),
        ("groq", "Groq AI", bool(settings.GROQ_API_KEY), "CONFIGURED" if settings.GROQ_API_KEY else "NOT_CONFIGURED"),
        ("gemini", "Gemini AI fallback", bool(settings.GEMINI_API_KEY), "CONFIGURED" if settings.GEMINI_API_KEY else "NOT_CONFIGURED"),
        ("azure_iot", "Azure IoT Hub", bool(settings.AZURE_IOT_HUB_HOSTNAME), "CONFIGURED" if settings.AZURE_IOT_HUB_HOSTNAME else "NOT_CONFIGURED"),
        ("azure_blob", "Azure Blob Storage", bool(settings.AZURE_STORAGE_CONNECTION_STRING), "CONFIGURED" if settings.AZURE_STORAGE_CONNECTION_STRING else "NOT_CONFIGURED"),
        ("azure_key_vault", "Azure Key Vault", bool(settings.AZURE_KEYVAULT_URL), "CONFIGURED" if settings.AZURE_KEYVAULT_URL else "NOT_CONFIGURED"),
        ("fabric", "Microsoft Fabric", bool(settings.FABRIC_WORKSPACE_ID), "CONFIGURED" if settings.FABRIC_WORKSPACE_ID else "NOT_CONFIGURED"),
    ]
    return [
        {"id": key, "name": name, "provider": key, "configured": configured, "status": state}
        for key, name, configured, state in entries
    ]

@router.get("/integrations/geoapify")
async def get_geoapify_integration_status(
    principal: Optional[RequestPrincipal] = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Retrieve Geoapify integration metrics and provider health."""
    metrics = LocationService.get_metrics()
    provider = get_location_provider()
    health = await provider.health_check()
    return {"configured": bool(settings.GEOAPIFY_API_KEY), "health": health, "metrics": metrics}

@router.post("/integrations/geoapify/test")
async def test_geoapify_integration(
    principal: Optional[RequestPrincipal] = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Perform a live diagnostics probe on the Geoapify location provider."""
    provider = get_location_provider()
    return await provider.health_check()

@router.post("/integrations/{provider}/test")
async def test_integration_provider(
    provider: str,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    if provider.lower() in {"geoapify", "location", "maps"}:
        return await get_location_provider().health_check()
    raise HTTPException(status_code=501, detail=f"No live connectivity probe is implemented for {provider}.")

@router.get("/sync-status")
async def get_admin_sync_status(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve real-time database connection metrics, engine pool stats, and cache performance."""
    from app.core.cache import entity_cache
    from app.core.task_queue import task_queue
    from app.db.session import engine

    db_latency_ms = 0.0
    db_connected = False
    try:
        t0 = datetime.now()
        await db.execute(text("SELECT 1"))
        db_latency_ms = round((datetime.now() - t0).total_seconds() * 1000, 2)
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "database": {
            "status": "CONNECTED" if db_connected else "DEGRADED",
            "latencyMs": db_latency_ms,
            "poolType": str(type(engine.pool).__name__),
            "driver": "PostgreSQL asyncpg / aiosqlite",
            "sslMode": "require" if "?sslmode=require" in settings.DATABASE_URL else "standard"
        },
        "cache": entity_cache.get_metrics(),
        "taskQueue": task_queue.get_metrics(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/azure/telemetry")
async def get_azure_cloud_telemetry(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_SYSTEM)),
) -> Dict[str, Any]:
    from app.integrations.azure_iot_consumer import azure_iot_consumer
    from app.integrations.azure_blob_storage import azure_blob_storage_client
    from app.integrations.azure_monitor import _configured
    return {
        "services": {
            "iotHub": {"status": azure_iot_consumer.status, "eventsReceived": azure_iot_consumer.received_count, "lastEventAt": azure_iot_consumer.last_event_at},
            "blobStorage": {"status": "CONNECTED" if azure_blob_storage_client.enabled and azure_blob_storage_client.blob_service_client else "NOT_CONFIGURED"},
            "applicationInsights": {"status": "CONFIGURED" if _configured else "NOT_CONFIGURED"},
            "fabric": {"status": "NOT_CONFIGURED"},
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/azure/maps/route")
async def get_azure_maps_route(
    origin_lat: float = Query(..., description="Origin latitude"),
    origin_lng: float = Query(..., description="Origin longitude"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lng: float = Query(..., description="Destination longitude"),
    vehicle_weight_kg: float = Query(36000.0, description="Commercial vehicle weight in kg"),
    vehicle_height_meters: float = Query(4.1, description="Vehicle height in meters"),
    avoid_tolls: bool = Query(False, description="Avoid toll roads"),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Calculate commercial heavy-freight truck route using Azure Maps with clearance constraints."""
    from app.integrations.azure_maps import AzureMapsService
    return await AzureMapsService.calculate_commercial_truck_route(
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        dest_lat=dest_lat,
        dest_lng=dest_lng,
        vehicle_weight_kg=vehicle_weight_kg,
        vehicle_height_meters=vehicle_height_meters,
        avoid_tolls=avoid_tolls,
    )


@router.get("/azure/maps/isoline")
async def get_azure_maps_isoline(
    current_lat: float = Query(..., description="Current latitude"),
    current_lng: float = Query(..., description="Current longitude"),
    battery_soc_percent: float = Query(..., description="Battery State of Charge"),
    payload_weight_kg: float = Query(24000.0, description="Payload weight in kg"),
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Compute EV reachability contour isoline using Azure Maps freight energy model."""
    from app.integrations.azure_maps import AzureMapsService
    return await AzureMapsService.compute_ev_reachable_isoline(
        current_lat=current_lat,
        current_lng=current_lng,
        battery_state_of_charge_percent=battery_soc_percent,
        payload_weight_kg=payload_weight_kg,
    )


@router.post("/azure/vision/bol-ocr")
async def analyze_bill_of_lading_ocr(
    payload: Optional[Dict[str, Any]] = None,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Extract structured freight data and signatures from Bill of Lading using Azure AI Vision."""
    from app.integrations.azure_ai_vision import AzureVisionService
    img_b64 = (payload or {}).get("image_base64")
    doc_url = (payload or {}).get("document_url")
    return await AzureVisionService.analyze_bill_of_lading(image_base64=img_b64, document_url=doc_url)


@router.post("/azure/vision/cargo-damage")
async def inspect_cargo_damage_vision(
    payload: Optional[Dict[str, Any]] = None,
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Perform automated loading dock pallet and cargo damage inspection via Azure Multimodal Vision."""
    from app.integrations.azure_ai_vision import AzureVisionService
    img_b64 = (payload or {}).get("image_base64")
    return await AzureVisionService.inspect_cargo_damage(image_base64=img_b64)


@router.get("/azure/pubsub/token")
async def get_azure_pubsub_token(
    principal: RequestPrincipal = Depends(require_permission(PermissionEnum.MANAGE_INTEGRATIONS)),
) -> Dict[str, Any]:
    """Generate ephemeral WebSocket access token for Azure Web PubSub real-time streaming."""
    from app.integrations.azure_pubsub import AzureWebPubSubService
    return await AzureWebPubSubService.get_client_access_token(user_id=getattr(principal, "nexus_user_id", None) or getattr(principal, "clerk_user_id", None) or "admin")
