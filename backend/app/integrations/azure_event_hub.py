import logging
from typing import Optional, List, Any

logger = logging.getLogger("nexus.event_hub")


class AzureEventHubClient:
    """Zero-Azure event producer client.
    
    Provides standard logger-backed event streaming without external Azure Event Hub SDK.
    """
    def __init__(self):
        self.enabled = False
        self._client = None

    def is_healthy(self) -> bool:
        return True

    def send_events(self, events: List[Any]) -> bool:
        """Send a batch of events via internal event pipeline."""
        logger.debug(f"[Event Streaming] Processed {len(events)} events locally")
        return True


azure_event_hub_client = AzureEventHubClient()
