from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserRead
from app.schemas.system import AuditLogRead, PipelineHealthRead
from app.integrations.location import get_location_provider
from app.services.location_service import LocationService

router = APIRouter(prefix="/admin", tags=["Admin & Governance"])

@router.get("/users", response_model=List[UserRead])
async def list_admin_users(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """List all workspace users with assigned RBAC roles."""
    return [
        UserRead(
            id="usr-adm-1",
            email="marcus.vance@nexus.ops",
            name="Marcus Vance",
            role="ADMINISTRATOR",
            department="Platform Governance & Security",
            is_active=True,
            workspace_id=workspace_id,
        ),
        UserRead(
            id="usr-mgr-1",
            email="sarah.chen@nexus.ops",
            name="Sarah Chen",
            role="OPERATIONS_MANAGER",
            department="Fleet Command & Decision Dispatch",
            is_active=True,
            workspace_id=workspace_id,
        ),
        UserRead(
            id="usr-ana-1",
            email="elena.rostova@nexus.ops",
            name="Elena Rostova",
            role="ANALYST",
            department="Operational Analytics & Optimization",
            is_active=True,
            workspace_id=workspace_id,
        ),
        UserRead(
            id="usr-opr-1",
            email="david.kim@nexus.ops",
            name="David Kim",
            role="OPERATOR",
            department="Central Superhub Control",
            is_active=True,
            workspace_id=workspace_id,
        ),
    ]

@router.get("/pipeline", response_model=List[PipelineHealthRead])
async def get_data_pipeline_health(db: AsyncSession = Depends(get_db)):
    """Retrieve telemetry ingestion pipeline and Fabric/Azure health status."""
    return [
        PipelineHealthRead(
            id="pip-1",
            source_name="Realtime Telemetry Ingestion Engine",
            source_type="IOT_TELEMETRY",
            status="HEALTHY",
            latency_ms=12,
            throughput_per_sec=1450,
            records_today=1240000,
        ),
        PipelineHealthRead(
            id="pip-2",
            source_name="Azure IoT Hub Gateway",
            source_type="AZURE_HUB",
            status="HEALTHY",
            latency_ms=28,
            throughput_per_sec=890,
            records_today=840000,
        ),
        PipelineHealthRead(
            id="pip-3",
            source_name="Microsoft Fabric Delta Lake",
            source_type="FABRIC_LAKE",
            status="HEALTHY",
            latency_ms=64,
            throughput_per_sec=420,
            records_today=3600000,
        ),
        PipelineHealthRead(
            id="pip-4",
            source_name="PostgreSQL Neon Operational Stream",
            source_type="POSTGRESQL",
            status="HEALTHY",
            latency_ms=8,
            throughput_per_sec=2100,
            records_today=2100000,
        ),
    ]

@router.get("/audit", response_model=List[AuditLogRead])
async def list_audit_logs(
    workspace_id: str = Query(default="ws-demo-1"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve immutable audit log history."""
    return [
        AuditLogRead(
            id="aud-1",
            workspace_id=workspace_id,
            actor_id="usr-mgr-1",
            actor_name="Sarah Chen",
            action="DECISION_APPLIED",
            entity_type="SIMULATION",
            entity_id="sim-901",
            details="Applied I-70 South Bypass detour to vehicle NX-TRK-104. Recovered +135 minutes on high-priority AeroTech shipment.",
            metadata_json={"incidentId": "inc-8041", "costDelta": 80.70},
            created_at="2026-08-30T00:15:00Z",
        ),
        AuditLogRead(
            id="aud-2",
            workspace_id=workspace_id,
            actor_id="usr-mgr-1",
            actor_name="Sarah Chen",
            action="INCIDENT_ACKNOWLEDGED",
            entity_type="INCIDENT",
            entity_id="inc-8041",
            details="Acknowledged critical blizzard closure on Interstate 80 corridor.",
            metadata_json={"severity": "CRITICAL"},
            created_at="2026-08-30T00:11:00Z",
        ),
        AuditLogRead(
            id="aud-3",
            workspace_id=workspace_id,
            actor_id="usr-adm-1",
            actor_name="Marcus Vance",
            action="USER_PROVISIONED",
            entity_type="USER",
            entity_id="usr-opr-1",
            details="Provisioned operator credentials and RBAC clearance for David Kim.",
            metadata_json={"role": "OPERATOR"},
            created_at="2026-08-30T00:01:00Z",
        ),
    ]

@router.get("/integrations/geoapify")
async def get_geoapify_integration_status() -> Dict[str, Any]:
    """Retrieve Geoapify integration metrics and provider health."""
    metrics = LocationService.get_metrics()
    provider = get_location_provider()
    health = await provider.health_check()
    return {
        "configured": True,
        "provider": health.get("provider", "geoapify"),
        "status": health.get("status", "HEALTHY"),
        "geocoding": health.get("geocoding", "operational"),
        "routing": health.get("routing", "operational"),
        "places": health.get("places", "operational"),
        "metrics": metrics,
    }

@router.post("/integrations/geoapify/test")
async def test_geoapify_integration() -> Dict[str, Any]:
    """Perform a live diagnostics probe on the Geoapify location provider."""
    provider = get_location_provider()
    return await provider.health_check()
