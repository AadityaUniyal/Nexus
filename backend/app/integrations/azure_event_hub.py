import logging
from typing import Optional
from app.core.config import settings

try:
    from azure.eventhub import EventHubProducerClient
    _EVENT_HUB_SDK_AVAILABLE = True
except ImportError:
    _EVENT_HUB_SDK_AVAILABLE = False

logger = logging.getLogger("nexus.integrations.azure_event_hub")

class AzureEventHubClient:
    """Simple wrapper for Azure Event Hub production client.
    Provides a minimal `is_healthy` method and a `send_events` stub.
    """
    def __init__(self):
        self.enabled = settings.EVENT_HUB_ENABLED
        self.connection_str = settings.EVENT_HUB_CONNECTION_STRING
        self._client: Optional[EventHubProducerClient] = None
        if self.enabled and self.connection_str and _EVENT_HUB_SDK_AVAILABLE:
            try:
                self._client = EventHubProducerClient.from_connection_string(self.connection_str)
                logger.info("[Azure Event Hub] Client initialized")
            except Exception as e:
                logger.error(f"[Azure Event Hub] Initialization failed: {e}")
                self._client = None
        else:
            logger.info("[Azure Event Hub] Disabled or SDK missing; client not created")

    def is_healthy(self) -> bool:
        return bool(self._client)

    def send_events(self, events) -> bool:
        """Send a batch of events. Returns True on success, False otherwise."""
        if not self._client:
            logger.warning("[Azure Event Hub] send_events called but client not configured")
            return False
        try:
            with self._client:
                event_data_batch = self._client.create_batch()
                for ev in events:
                    event_data_batch.add(ev)
                self._client.send_batch(event_data_batch)
            logger.debug(f"[Azure Event Hub] Sent {len(events)} events")
            return True
        except Exception as e:
            logger.error(f"[Azure Event Hub] Failed to send events: {e}")
            return False

# Instantiate a module-level client for easy import elsewhere
azure_event_hub_client = AzureEventHubClient()
