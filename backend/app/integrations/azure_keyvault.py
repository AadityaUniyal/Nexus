import os
import logging
from typing import Optional, List, Dict

logger = logging.getLogger("nexus.secrets")


class AzureKeyVaultManager:
    """Zero-Azure secret provider.
    
    Reads production secrets securely from standard environment variables
    with in-memory caching, eliminating Azure Key Vault and Azure Identity SDK dependencies.
    """
    def __init__(self, vault_url: Optional[str] = None):
        self.vault_url = ""
        self._cache: Dict[str, str] = {}
        logger.debug("[Secrets] Initialized standard environment secret provider")

    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """Retrieves a secret by name from cache or environment variable."""
        if secret_name in self._cache:
            return self._cache[secret_name]
        val = os.getenv(secret_name, default)
        if val is not None:
            self._cache[secret_name] = val
        return val

    def set_secret(self, secret_name: str, value: str) -> bool:
        """Stores a secret in memory cache and process environment."""
        self._cache[secret_name] = value
        os.environ[secret_name] = value
        return True

    def list_secrets(self) -> List[str]:
        """Lists known secret names from cache and environment."""
        return list(set(list(self._cache.keys()) + list(os.environ.keys())))


keyvault_manager = AzureKeyVaultManager()
