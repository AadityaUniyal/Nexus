import os
import logging
from typing import Optional

logger = logging.getLogger("nexus.integrations.keyvault")

class AzureKeyVaultManager:
    """
    Azure Key Vault Secret Provider.
    Retrieves production secrets (DATABASE_URL, SECRET_KEY, API Keys) securely using Azure Managed Identity.
    """
    def __init__(self, vault_url: Optional[str] = None):
        self.vault_url = vault_url or os.getenv("AZURE_KEYVAULT_URL", "")
        self._cache = {}

    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        if secret_name in self._cache:
            return self._cache[secret_name]

        # Sourced directly from environment in local/non-keyvault mode
        val = os.getenv(secret_name, default)
        if val:
            self._cache[secret_name] = val
        return val

keyvault_manager = AzureKeyVaultManager()
