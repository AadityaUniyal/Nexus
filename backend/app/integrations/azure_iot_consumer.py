"""Consumes real device-to-cloud telemetry from the IoT Hub Event Hubs endpoint."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings

logger = logging.getLogger("nexus.azure_iot")


class AzureIoTHubConsumer:
    def __init__(self) -> None:
        self.status = "NOT_CONFIGURED"
        self.received_count = 0
        self.last_event_at: str | None = None
        self._client: Any = None
        self._task: asyncio.Task | None = None

    async def start(self) -> bool:
        if not (settings.AZURE_IOT_HUB_ENABLED and settings.AZURE_IOT_HUB_EVENTHUB_CONNECTION_STRING):
            self.status = "NOT_CONFIGURED"
            return False
        if not settings.AZURE_STORAGE_ENABLED or not settings.AZURE_STORAGE_CONNECTION_STRING:
            self.status = "BLOCKED_STORAGE_CHECKPOINTS"
            logger.error("Azure IoT consumer requires the configured Blob checkpoint store")
            return False
        try:
            from azure.eventhub.aio import EventHubConsumerClient
            from azure.eventhub.extensions.checkpointstoreblobaio import BlobCheckpointStore
            from azure.storage.blob import BlobServiceClient

            checkpoint_container = settings.AZURE_IOT_HUB_CHECKPOINT_CONTAINER
            blob_service = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
            try:
                container = blob_service.get_container_client(checkpoint_container)
                if not container.exists():
                    container.create_container()
            finally:
                blob_service.close()

            checkpoint_store = BlobCheckpointStore.from_connection_string(
                settings.AZURE_STORAGE_CONNECTION_STRING,
                checkpoint_container,
            )
            self._client = EventHubConsumerClient.from_connection_string(
                settings.AZURE_IOT_HUB_EVENTHUB_CONNECTION_STRING,
                consumer_group=settings.AZURE_IOT_HUB_CONSUMER_GROUP,
                checkpoint_store=checkpoint_store,
                transport_type=__import__("azure.eventhub", fromlist=["TransportType"]).TransportType.AmqpOverWebsocket,
            )
            self.status = "CONNECTING"
            self._task = asyncio.create_task(self._consume(), name="azure-iot-hub-consumer")
            return True
        except Exception:
            self.status = "UNAVAILABLE"
            logger.exception("Azure IoT Hub consumer initialization failed")
            return False

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        if self._client:
            try:
                await self._client.close()
            except Exception:
                logger.exception("Could not close the Azure IoT Hub consumer cleanly")

    async def _consume(self) -> None:
        try:
            async with self._client:
                await self._client.receive(
                    on_event=self._on_event,
                    on_partition_initialize=self._on_partition_initialize,
                    on_error=self._on_error,
                    starting_position="@latest",
                    max_wait_time=10,
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            self.status = "DEGRADED"
            logger.exception("Azure IoT Hub consumer stopped unexpectedly")
        finally:
            if self.status == "CONNECTED":
                self.status = "STOPPED"

    async def _on_partition_initialize(self, partition_context: Any) -> None:
        self.status = "CONNECTED"
        logger.info("Azure IoT Hub consumer attached to partition %s", partition_context.partition_id)

    async def _on_error(self, partition_context: Any, error: Exception) -> None:
        self.status = "DEGRADED"
        logger.error(
            "Azure IoT Hub consumer error on partition %s: %s",
            getattr(partition_context, "partition_id", "unknown"),
            type(error).__name__,
        )

    async def _on_event(self, partition_context: Any, event: Any) -> None:
        if event is None:
            return
        try:
            raw = event.body_as_str(encoding="UTF-8")
            payload = json.loads(raw)
            if not isinstance(payload, dict):
                raise ValueError("IoT message body must be a JSON object")
            device_id = self._device_id(event, payload)
            if not device_id:
                logger.warning("Discarding Azure IoT message without an authenticated device identity")
                await partition_context.update_checkpoint(event)
                return

            from sqlalchemy import select
            from app.db.session import AsyncSessionLocal
            from app.models.fleet import VehicleDevice
            from app.services.telemetry_service import ingest_telemetry_packet
            from app.integrations.telemetry_adapters import TelemetryAdapter

            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(VehicleDevice).where(
                        VehicleDevice.provider == "AZURE_IOT",
                        VehicleDevice.serial_number == device_id,
                    )
                )
                registered_device = result.scalar_one_or_none()
                if registered_device is None:
                    logger.warning("Discarding telemetry from an IoT identity not mapped to a workspace vehicle")
                    await partition_context.update_checkpoint(event)
                    return

                packet_data = dict(payload)
                packet_data["deviceId"] = device_id
                packet = TelemetryAdapter.from_azure_iot(packet_data).model_copy(
                    update={
                        "vehicle_identifier": registered_device.vehicle_id,
                        "external_device_id": device_id,
                        "source_provider": "AZURE_IOT",
                    }
                )
                await ingest_telemetry_packet(db, packet, registered_device.workspace_id)

            await partition_context.update_checkpoint(event)
            self.received_count += 1
            self.last_event_at = datetime.now(timezone.utc).isoformat()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Azure IoT telemetry event was not acknowledged; it will be retried")

    @staticmethod
    def _device_id(event: Any, payload: dict[str, Any]) -> str | None:
        if payload.get("deviceId") or payload.get("device_id"):
            return str(payload.get("deviceId") or payload.get("device_id"))
        props = getattr(event, "system_properties", None) or {}
        for key in ("iothub-connection-device-id", b"iothub-connection-device-id"):
            value = props.get(key)
            if value:
                return value.decode("utf-8") if isinstance(value, bytes) else str(value)
        return None


azure_iot_consumer = AzureIoTHubConsumer()
