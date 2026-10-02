import os
import logging
from typing import Optional

logger = logging.getLogger("nexus.integrations.keyvault")

try:
    from azure.keyvault.secrets import SecretClient
    from azure.identity import DefaultAzureCredential
    _AZURE_SDK_AVAILABLE = True
except ImportError:
    _AZURE_SDK_AVAILABLE = False

class AzureKeyVaultManager:
    """
    Azure Key Vault Secret Provider.
    Retrieves production secrets (DATABASE_URL, SECRET_KEY, API Keys) securely.

    Modes:
      1. Azure Mode: Uses DefaultAzureCredential + SecretClient (azure-keyvault-secrets SDK)
      2. Local Mode: Falls back to os.getenv() when Key Vault URL is not configured

    FREE TIER: ~$0.03 per 10,000 operations (effectively free for small apps)
    """
    def __init__(self, vault_url: Optional[str] = None):
        self.vault_url = vault_url or os.getenv("AZURE_KEYVAULT_URL", "")
        self._cache = {}
        self._client = None

        if self.vault_url and _AZURE_SDK_AVAILABLE:
            try:
                credential = DefaultAzureCredential()
                self._client = SecretClient(vault_url=self.vault_url, credential=credential)
                logger.info(f"[Azure Key Vault] Connected to {self.vault_url}")
            except Exception as e:
                logger.warning(f"[Azure Key Vault] Failed to connect, using environment fallback: {e}")
                self._client = None
        else:
            if not self.vault_url:
                logger.info("[Azure Key Vault] No vault URL configured. Using environment variable fallback.")
            elif not _AZURE_SDK_AVAILABLE:
                logger.info("[Azure Key Vault] SDK not installed. Using environment variable fallback.")

    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """
        Retrieves a secret by name.
        Priority: Cache -> Azure Key Vault -> Environment Variable -> Default
        """
        if secret_name in self._cache:
            return self._cache[secret_name]

        # Try Azure Key Vault first
        if self._client:
            try:
                # Key Vault secret names use dashes, not underscores
                kv_name = secret_name.replace("_", "-").lower()
                secret = self._client.get_secret(kv_name)
                if secret and secret.value:
                    self._cache[secret_name] = secret.value
                    return secret.value
            except Exception as e:
                logger.debug(f"[Azure Key Vault] Secret '{secret_name}' not found in vault: {e}")

        # Fallback to environment variable
        val = os.getenv(secret_name, default)
        if val:
            self._cache[secret_name] = val
        return val

    def set_secret(self, secret_name: str, value: str) -> bool:
        """Stores a secret in Azure Key Vault (or cache in local mode)."""
        if self._client:
            try:
                kv_name = secret_name.replace("_", "-").lower()
                self._client.set_secret(kv_name, value)
                self._cache[secret_name] = value
                logger.info(f"[Azure Key Vault] Secret '{secret_name}' stored successfully")
                return True
            except Exception as e:
                logger.error(f"[Azure Key Vault] Failed to store secret '{secret_name}': {e}")
                return False
        else:
            self._cache[secret_name] = value
            logger.debug(f"[Azure Key Vault] Secret '{secret_name}' stored in local cache only")
            return True

    def list_secrets(self) -> list:
        """Lists all secret names (from Key Vault or cache)."""
        if self._client:
            try:
                return [s.name for s in self._client.list_properties_of_secrets()]
            except Exception as e:
                logger.error(f"[Azure Key Vault] Failed to list secrets: {e}")
                return list(self._cache.keys())
        return list(self._cache.keys())

keyvault_manager = AzureKeyVaultManager()
