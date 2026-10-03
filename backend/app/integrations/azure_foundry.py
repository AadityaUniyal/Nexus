import logging
from app.core.config import settings

logger = logging.getLogger("nexus.integrations.azure_foundry")

try:
    # The Azure Foundry SDK is optional for free tier; it may not be installed.
    # Placeholder import – replace with actual SDK import when available.
    from azure.identity import DefaultAzureCredential  # type: ignore
    _SDK_AVAILABLE = True
except Exception:  # pragma: no cover
    _SDK_AVAILABLE = False

class AzureFoundryClient:
    """Minimal wrapper for Azure Foundry (preview).
    For the free‑tier preview we only need health‑check capability.
    """

    def __init__(self) -> None:
        self.enabled: bool = getattr(settings, "AZURE_FOUNDRY_ENABLED", False)
        self.endpoint: str = getattr(settings, "AZURE_FOUNDRY_ENDPOINT", "")
        self.api_key: str = getattr(settings, "AZURE_FOUNDRY_API_KEY", "")
        self.client = None
        if self.enabled and self.endpoint and self.api_key and _SDK_AVAILABLE:
            try:
                # In a real implementation we would initialise the Foundry client here.
                self.client = "foundry-client-placeholder"
                logger.info("[Azure Foundry] client initialized")
            except Exception as exc:  # pragma: no cover
                logger.error(f"[Azure Foundry] initialization failed: {exc}")
        else:
            logger.info("[Azure Foundry] disabled or SDK unavailable")

    def is_healthy(self) -> bool:
        return bool(self.enabled and self.client)

    # Placeholder methods for future extensions
    def run_workflow(self, workflow_id: str, payload: dict) -> None:
        logger.debug(f"run_workflow called – id={workflow_id}, payload_keys={list(payload.keys())}")
        # Real implementation would invoke the Foundry workflow via REST/API.
        return None

# Module‑level singleton for easy import elsewhere
azure_foundry_client = AzureFoundryClient()
