import logging
from typing import Any, Optional

logger = logging.getLogger("nexus.kusto")


class AzureKustoClient:
    """Zero-Azure telemetry analytics query client stub.
    
    Provides local query facade without external Azure Kusto SDK.
    """
    def __init__(self):
        self.enabled = False
        self.client = None

    def is_healthy(self) -> bool:
        return True

    def execute_query(self, query: str) -> Optional[Any]:
        logger.debug(f"[Kusto] execute_query: {query}")
        return None


azure_kusto_client = AzureKustoClient()
