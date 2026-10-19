import logging
import os
import json
import time
from typing import Dict, Any, List, Optional, Union
from pathlib import Path

logger = logging.getLogger("nexus.storage")


class AzureBlobStorageClient:
    """Enterprise storage client for telemetry archival and private document storage (PODs).
    
    Supports real Azure Blob Storage via azure.storage.blob SDK when configured with connection string
    or Managed Identity, with clean local filesystem fallback for development and test execution.
    """
    def __init__(self):
        from app.core.config import settings
        self.enabled = bool(settings.AZURE_STORAGE_ENABLED and settings.AZURE_STORAGE_CONNECTION_STRING)
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.blob_service_client = None
        self.local_fallback_dir = Path(os.getcwd()) / "local_storage"
        self.allow_local_fallback = settings.APP_ENV.lower() != "production"
        if self.allow_local_fallback:
            self._ensure_local_dirs()

        if self.enabled:
            try:
                import importlib
                azure_blob = importlib.import_module("azure.storage.blob")
                BlobServiceClient = getattr(azure_blob, "BlobServiceClient")
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                logger.info("[Storage] Connected to Azure Blob Storage service")
            except Exception as e:
                logger.exception("[Storage] Azure Blob Storage could not be initialized")
                self.enabled = False

    def _ensure_local_dirs(self):
        containers = ["telemetry-bronze", "telemetry-silver", "analytics-gold", "documents-pod"]
        for container in containers:
            try:
                (self.local_fallback_dir / container).mkdir(parents=True, exist_ok=True)
            except Exception as e:
                logger.debug(f"[Storage] Could not create local directory {container}: {e}")

    def upload_file(self, container: str, blob_name: str, data: Union[bytes, str]) -> bool:
        """Saves a file to Azure Blob Storage or local directory fallback."""
        if isinstance(data, str):
            data = data.encode("utf-8")

        if self.enabled and self.blob_service_client:
            try:
                container_client = self.blob_service_client.get_container_client(container)
                if not container_client.exists():
                    container_client.create_container()
                blob_client = container_client.get_blob_client(blob_name)
                blob_client.upload_blob(data, overwrite=True)
                logger.debug(f"[Storage] Uploaded {blob_name} to Azure container {container}")
                return True
            except Exception:
                logger.exception("[Storage] Azure upload failed for container %s", container)
                if not self.allow_local_fallback:
                    return False

        elif not self.allow_local_fallback:
            logger.error("[Storage] Azure Blob Storage is not configured; production upload rejected")
            return False

        try:
            file_path = self.local_fallback_dir / container / blob_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(data)
            logger.debug(f"[Storage] Saved {blob_name} to local {container}")
            return True
        except Exception as e:
            logger.error(f"[Storage] Local save failed for {blob_name}: {e}")
            return False

    def download_file(self, container: str, blob_name: str) -> Optional[bytes]:
        """Reads a file from Azure Blob Storage or local directory fallback."""
        if self.enabled and self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(container=container, blob=blob_name)
                if blob_client.exists():
                    return blob_client.download_blob().readall()
            except Exception:
                logger.exception("[Storage] Azure download failed for container %s", container)
                if not self.allow_local_fallback:
                    return None
        elif not self.allow_local_fallback:
            return None

        try:
            file_path = self.local_fallback_dir / container / blob_name
            if file_path.exists():
                with open(file_path, "rb") as f:
                    return f.read()
            return None
        except Exception as e:
            logger.error(f"[Storage] Read failed for {blob_name}: {e}")
            return None

    def upload_telemetry_batch(self, records: List[Dict[str, Any]], tier: str = "bronze") -> bool:
        """Uploads a batch of telemetry records to the medallion tier directory."""
        container = f"telemetry-{tier}" if tier in ["bronze", "silver"] else "analytics-gold"
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        blob_name = f"{time.strftime('%Y/%m/%d')}/batch_{timestamp}.json"
        data = json.dumps(records, indent=2).encode("utf-8")
        return self.upload_file(container, blob_name, data)

    def list_blobs(self, container: str, prefix: Optional[str] = None) -> List[str]:
        """Lists files in the local container directory, optionally filtered by prefix."""
        if self.enabled and self.blob_service_client:
            try:
                return [blob.name for blob in self.blob_service_client.get_container_client(container).list_blobs(name_starts_with=prefix)]
            except Exception:
                logger.exception("[Storage] Could not list Azure container %s", container)
                return []
        if not self.allow_local_fallback:
            return []
        blobs = []
        try:
            container_dir = self.local_fallback_dir / container
            if container_dir.exists():
                for filepath in container_dir.rglob("*"):
                    if filepath.is_file():
                        rel_path = filepath.relative_to(container_dir).as_posix()
                        if prefix is None or rel_path.startswith(prefix):
                            blobs.append(rel_path)
        except Exception as e:
            logger.error(f"[Storage] List failed for {container}: {e}")
        return blobs

    def get_telemetry_archive_url(self, date_str: str, tier: str = "bronze") -> str:
        """Returns the local URI path for a specific day's telemetry archive."""
        container = f"telemetry-{tier}" if tier in ["bronze", "silver"] else "analytics-gold"
        prefix = date_str.replace("-", "/")
        return f"azure://{container}/{prefix}" if self.enabled else f"local://{container}/{prefix}"


azure_blob_storage_client = AzureBlobStorageClient()
