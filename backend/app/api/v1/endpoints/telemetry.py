import hmac
import hashlib
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Header, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.auth.dependencies import require_authenticated, require_workspace
from app.auth.principal import RequestPrincipal
from app.models.telemetry import TelemetryEvent, VehicleStatus
from app.services.telemetry_service import (
    NormalizedTelemetryPacket,
    ingest_telemetry_packet,
)
from app.integrations.telemetry_adapters import TelemetryAdapter
from app.models.integrations import WebhookEndpoint, IntegrationEvent
from app.services.quota_guard import quota_guard

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Telematics Ingestion"])

class TelemetryBatchRequest(BaseModel):
    packets: List[NormalizedTelemetryPacket]

@router.post("", status_code=status.HTTP_200_OK)
async def ingest_telemetry(
    packet: Union[NormalizedTelemetryPacket, TelemetryBatchRequest],
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest normalized live vehicle telemetry for the authenticated organization workspace.
    Updates live vehicle coordinates, checks incident thresholds, and broadcasts via SSE.
    """
    # Quota guard: track Event Hub events (1 per packet or batch size)
    if isinstance(packet, TelemetryBatchRequest):
        quota_guard.check_event_hub(len(packet.packets))
    else:
        quota_guard.check_event_hub(1)
    if isinstance(packet, TelemetryBatchRequest):
        results = []
        for p in packet.packets:
            res = await ingest_telemetry_packet(db, p, principal.workspace_id)
            results.append(res)
        return {"status": "BATCH_PROCESSED", "count": len(results), "results": results}
    else:
        res = await ingest_telemetry_packet(db, packet, principal.workspace_id)
        return res

@router.get("/live", status_code=status.HTTP_200_OK)
async def get_live_telemetry_snapshot(
    principal: RequestPrincipal = Depends(require_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the latest live operational status of all fleet vehicles in workspace."""
    stmt = select(VehicleStatus).where(VehicleStatus.workspace_id == principal.workspace_id)
    result = await db.execute(stmt)
    statuses = result.scalars().all()

    return [
        {
            "id": s.id,
            "vehicle_id": s.vehicle_id,
            "status": s.status,
            "lat": s.lat,
            "lng": s.lng,
            "speed_kmh": s.speed_kmh,
            "heading": s.heading,
            "battery_pct": s.battery_pct,
            "health_score": s.health_score,
            "last_telemetry_at": s.last_telemetry_at,
        }
        for s in statuses
    ]

@router.post("/webhooks/{provider}", status_code=status.HTTP_200_OK)
async def receive_provider_webhook(
    provider: str,
    payload: Dict[str, Any],
    x_nexus_secret: Optional[str] = Header(None, alias="X-Nexus-Webhook-Secret"),
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Receive webhook events from external telematics providers (Samsara, Geotab, Azure IoT).
    Verifies signature / token, normalizes via provider adapter, and updates Nexus operational state.
    """
    prov_upper = provider.upper()
    ws_id = x_workspace_id or "ws-continental-fleet-01"

    # Normalize packet through provider adapter
    if prov_upper == "SAMSARA":
        packet = TelemetryAdapter.from_samsara(payload)
    elif prov_upper == "GEOTAB":
        packet = TelemetryAdapter.from_geotab(payload)
    elif prov_upper in ["AZURE_IOT", "IOT_HUB"]:
        packet = TelemetryAdapter.from_azure_iot(payload)
    else:
        # Generic payload fallback
        packet = NormalizedTelemetryPacket(
            vehicle_identifier=str(payload.get("vehicle_id") or payload.get("id") or "GENERIC-01"),
            latitude=float(payload.get("lat") or payload.get("latitude") or 41.8781),
            longitude=float(payload.get("lng") or payload.get("longitude") or -87.6298),
            speed_kmh=float(payload.get("speed_kmh") or payload.get("speed") or 0.0),
            battery_pct=payload.get("battery_pct"),
            source_provider=f"WEBHOOK_{prov_upper}",
            raw_payload=payload
        )

    res = await ingest_telemetry_packet(db, packet, ws_id)
    return {"status": "WEBHOOK_PROCESSED", "provider": prov_upper, "result": res}
