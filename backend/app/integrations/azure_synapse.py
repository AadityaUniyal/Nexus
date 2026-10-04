import logging
from typing import Any, Optional

logger = logging.getLogger("nexus.synapse")


class AzureSynapseClient:
    """Zero-Azure data pipeline and query client stub.
    
    Provides standard database analytics facade without external Azure Synapse SDK.
    """
    def __init__(self):
        self.enabled = False
        self.client = None

    def is_healthy(self) -> bool:
        return True

    def submit_spark_job(self, job_name: str, **kwargs) -> Optional[Any]:
        logger.debug(f"[Synapse] submit_spark_job name={job_name}, kwargs={kwargs}")
        return None

    def execute_sql(self, sql: str) -> Optional[Any]:
        logger.debug(f"[Synapse] execute_sql: {sql}")
        return None


azure_synapse_client = AzureSynapseClient()
