import logging
import os
import json
import time
from typing import Dict, Any, List, Optional, Union
from app.core.config import settings
from pathlib import Path

try:
    from azure.storage.blob import BlobServiceClient
except ImportError:
    pass

logger = logging.getLogger("nexus.integrations.azure_blob_storage")

class AzureBlobStorageClient:
    """
    Azure Blob Storage client for telemetry archival and file uploads.
    Archives telemetry data in Bronze/Silver/Gold medallion pattern.
    """
    def __init__(self):
        self.enabled = settings.AZURE_STORAGE_ENABLED
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.blob_service_client = None
        self.local_fallback_dir = Path(os.getcwd()) / "local_storage"
        
        if self.enabled and self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                self._ensure_containers()
                logger.info("[Azure Blob Storage] Initialized successfully")
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Failed to initialize, falling back to local storage: {e}")
                self.blob_service_client = None
                self._ensure_local_dirs()
        else:
            logger.info("[Azure Blob Storage] Connection string not found or disabled. Using local fallback.")
            self._ensure_local_dirs()

    def _ensure_containers(self):
        """Ensures that the required medallion architecture containers exist"""
        containers = ["telemetry-bronze", "telemetry-silver", "analytics-gold"]
        if not self.blob_service_client:
            return
            
        for container in containers:
            try:
                container_client = self.blob_service_client.get_container_client(container)
                if not container_client.exists():
                    container_client.create_container()
                    logger.debug(f"[Azure Blob Storage] Created container: {container}")
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Error checking/creating container {container}: {e}")

    def _ensure_local_dirs(self):
        containers = ["telemetry-bronze", "telemetry-silver", "analytics-gold"]
        for container in containers:
            (self.local_fallback_dir / container).mkdir(parents=True, exist_ok=True)

    def upload_telemetry_batch(self, records: List[Dict[str, Any]], tier: str = "bronze") -> bool:
        """
        Uploads a batch of telemetry records to the appropriate medallion tier.
        Tiers: bronze, silver, gold.
        """
        container = f"telemetry-{tier}" if tier in ["bronze", "silver"] else "analytics-gold"
        
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        blob_name = f"{time.strftime('%Y/%m/%d')}/batch_{timestamp}.json"
        
        data = json.dumps(records, indent=2).encode('utf-8')
        return self.upload_file(container, blob_name, data)

    def upload_file(self, container: str, blob_name: str, data: Union[bytes, str]) -> bool:
        """Uploads a file to a specific container"""
        if isinstance(data, str):
            data = data.encode('utf-8')
            
        if self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(container=container, blob=blob_name)
                blob_client.upload_blob(data, overwrite=True)
                logger.debug(f"[Azure Blob Storage] Uploaded blob {blob_name} to {container}")
                return True
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Error uploading blob {blob_name}: {e}")
                return False
        else:
            try:
                file_path = self.local_fallback_dir / container / blob_name
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, "wb") as f:
                    f.write(data)
                logger.debug(f"[Azure Blob Storage] Saved locally {blob_name} to {container}")
                return True
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Local save failed for {blob_name}: {e}")
                return False

    def download_file(self, container: str, blob_name: str) -> Optional[bytes]:
        """Downloads a file from a specific container"""
        if self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(container=container, blob=blob_name)
                return blob_client.download_blob().readall()
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Error downloading blob {blob_name}: {e}")
                return None
        else:
            try:
                file_path = self.local_fallback_dir / container / blob_name
                if file_path.exists():
                    with open(file_path, "rb") as f:
                        return f.read()
                return None
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Local read failed for {blob_name}: {e}")
                return None

    def list_blobs(self, container: str, prefix: Optional[str] = None) -> List[str]:
        """Lists blobs in a container, optionally filtered by prefix"""
        blobs = []
        if self.blob_service_client:
            try:
                container_client = self.blob_service_client.get_container_client(container)
                blob_list = container_client.list_blobs(name_starts_with=prefix)
                for blob in blob_list:
                    blobs.append(blob.name)
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Error listing blobs in {container}: {e}")
        else:
            try:
                container_dir = self.local_fallback_dir / container
                if container_dir.exists():
                    for filepath in container_dir.rglob("*"):
                        if filepath.is_file():
                            rel_path = filepath.relative_to(container_dir).as_posix()
                            if prefix is None or rel_path.startswith(prefix):
                                blobs.append(rel_path)
            except Exception as e:
                logger.error(f"[Azure Blob Storage] Local list failed for {container}: {e}")
        return blobs

    def get_telemetry_archive_url(self, date_str: str, tier: str = "bronze") -> str:
        """Returns a URL or path for a specific day's telemetry archive"""
        container = f"telemetry-{tier}" if tier in ["bronze", "silver"] else "analytics-gold"
        prefix = date_str.replace("-", "/") # e.g. 2026-09-29 -> 2026/09/29
        
        if self.blob_service_client:
            account_url = self.blob_service_client.primary_endpoint
            return f"{account_url}{container}/{prefix}"
        else:
            return f"local://{container}/{prefix}"

azure_blob_storage_client = AzureBlobStorageClient()
