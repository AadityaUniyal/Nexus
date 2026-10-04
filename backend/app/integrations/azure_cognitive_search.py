import logging
from typing import List, Any

logger = logging.getLogger("nexus.search")


class AzureCognitiveSearchClient:
    """Zero-Azure search client stub.
    
    Provides standard database-backed search interface without Azure Search SDK.
    """
    def __init__(self) -> None:
        self.enabled = False
        self.client = None

    def is_healthy(self) -> bool:
        return True

    def upload_documents(self, docs: List[Any]) -> None:
        logger.debug(f"[Search] upload_documents called with {len(docs)} documents")
        return None

    def search(self, query: str, top: int = 10) -> List[Any]:
        logger.debug(f"[Search] search query: '{query}', top={top}")
        return []


azure_cognitive_search_client = AzureCognitiveSearchClient()
