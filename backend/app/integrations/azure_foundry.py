import logging
from typing import Dict, Any

logger = logging.getLogger("nexus.foundry")


class AzureFoundryClient:
    """Zero-Azure AI foundry workflow client stub.
    
    Provides local workflow execution facade without external Azure Foundry SDK.
    """
    def __init__(self) -> None:
        self.enabled = False
        self.client = None

    def is_healthy(self) -> bool:
        return True

    def run_workflow(self, workflow_id: str, payload: Dict[str, Any]) -> None:
        logger.debug(f"[Foundry] run_workflow id={workflow_id}, payload_keys={list(payload.keys())}")
        return None


azure_foundry_client = AzureFoundryClient()
