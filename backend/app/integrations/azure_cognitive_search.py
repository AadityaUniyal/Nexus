import logging
from app.core.config import settings

logger = logging.getLogger("nexus.integrations.azure_cognitive_search")

try:
    # The official SDK is optional for the free tier; it may not be installed.
    from azure.core.credentials import AzureKeyCredential  # type: ignore
    from azure.search.documents import SearchClient  # type: ignore
    _SDK_AVAILABLE = True
except Exception:  # pragma: no cover
    _SDK_AVAILABLE = False

class AzureCognitiveSearchClient:
    """Minimal wrapper for Azure Cognitive Search.
    In the free‑tier preview we only need health‑check capability.
    """

    def __init__(self) -> None:
        self.enabled: bool = getattr(settings, "AZURE_COGNITIVE_SEARCH_ENABLED", False)
        self.endpoint: str = getattr(settings, "AZURE_COGNITIVE_SEARCH_ENDPOINT", "")
        self.api_key: str = getattr(settings, "AZURE_COGNITIVE_SEARCH_API_KEY", "")
        self.client = None
        if self.enabled and self.endpoint and self.api_key and _SDK_AVAILABLE:
            try:
                credential = AzureKeyCredential(self.api_key)
                # Using a default index name; real implementation will accept index name as argument.
                self.client = SearchClient(endpoint=self.endpoint, index_name="default-index", credential=credential)  # type: ignore
                logger.info("[Azure Cognitive Search] client initialized")
            except Exception as exc:  # pragma: no cover
                logger.error(f"[Azure Cognitive Search] initialization failed: {exc}")
        else:
            logger.info("[Azure Cognitive Search] disabled or SDK unavailable")

    def is_healthy(self) -> bool:
        return bool(self.enabled and self.client)

    # Placeholder methods for future use
    def upload_documents(self, docs: list) -> None:
        logger.debug(f"upload_documents called with {len(docs)} docs")
        # Real implementation would call self.client.upload_documents(...)
        return None

    def search(self, query: str, top: int = 10) -> list:
        logger.debug(f"search called – query={query}, top={top}")
        # Real implementation would call self.client.search(...)
        return []

# Module‑level singleton for easy import elsewhere
azure_cognitive_search_client = AzureCognitiveSearchClient()
