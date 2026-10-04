import logging
import os
import json
import time
from typing import Dict, Any, List, Optional, Union
from pathlib import Path

logger = logging.getLogger("nexus.storage")


class AzureBlobStorageClient:
    """Zero-Azure storage client for telemetry archival and local file persistence.
    
    Replaces Azure Blob Storage with clean local/serverless filesystem storage,
    preserving caller interfaces while eliminating Azure SDK dependencies.
    """
    def __init__(self):
        self.enabled = False
        self.connection_string = ""
        self.blob_service_client = None
        self.local_fallback_dir = Path(os.getcwd()) / "local_storage"
        self._ensure_local_dirs()

    def _ensure_local_dirs(self):
        containers = ["telemetry-bronze", "telemetry-silver", "analytics-gold"]
        for container in containers:
            try:
                (self.local_fallback_dir / container).mkdir(parents=True, exist_ok=True)
            except Exception as e:
                logger.debug(f"[Storage] Could not create local directory {container}: {e}")

    def upload_telemetry_batch(self, records: List[Dict[str, Any]], tier: str = "bronze") -> bool:
        """Uploads a batch of telemetry records to the medallion tier directory."""
        container = f"telemetry-{tier}" if tier in ["bronze", "silver"] else "analytics-gold"
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        blob_name = f"{time.strftime('%Y/%m/%d')}/batch_{timestamp}.json"
        data = json.dumps(records, indent=2).encode("utf-8")
        return self.upload_file(container, blob_name, data)

    def upload_file(self, container: str, blob_name: str, data: Union[bytes, str]) -> bool:
        """Saves a file to the local storage directory."""
        if isinstance(data, str):
            data = data.encode("utf-8")
        try:
            file_path = self.local_fallback_dir / container / blob_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(data)
            logger.debug(f"[Storage] Saved {blob_name} to {container}")
            return True
        except Exception as e:
            logger.error(f"[Storage] Save failed for {blob_name}: {e}")
            return False

    def download_file(self, container: str, blob_name: str) -> Optional[bytes]:
        """Reads a file from the local storage directory."""
        try:
            file_path = self.local_fallback_dir / container / blob_name
            if file_path.exists():
                with open(file_path, "rb") as f:
                    return f.read()
            return None
        except Exception as e:
            logger.error(f"[Storage] Read failed for {blob_name}: {e}")
            return None

    def list_blobs(self, container: str, prefix: Optional[str] = None) -> List[str]:
        """Lists files in the local container directory, optionally filtered by prefix."""
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
        return f"local://{container}/{prefix}"


azure_blob_storage_client = AzureBlobStorageClient()
