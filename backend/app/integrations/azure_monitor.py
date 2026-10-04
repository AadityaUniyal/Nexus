import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("nexus.telemetry")

OTEL_IMPORT_ERROR = None


class AzureMonitorClient:
    """Zero-Azure telemetry and logging facade.
    
    Replaces Azure Application Insights with standard Python logging,
    preserving caller interfaces while eliminating all external cloud SDK dependencies.
    """
    def __init__(self):
        self.enabled = False
        self.connection_string = ""
        self.tracer = None
        self.meter = None
        self.tracer_provider = None
        self.meter_provider = None
        self.metric_reader = None
        self.span_processor = None
        logger.debug("[Telemetry] Initialized local zero-Azure logging facade")

    def track_event(self, name: str, properties: Optional[Dict[str, Any]] = None):
        """Logs custom events (e.g. simulation runs, telemetry ingested, incidents detected)."""
        logger.info(f"[Telemetry Event] {name} | Properties: {properties}")

    def track_metric(self, name: str, value: float, properties: Optional[Dict[str, Any]] = None):
        """Logs custom metrics (e.g. request latency, active users, error rates)."""
        logger.debug(f"[Telemetry Metric] {name}: {value} | Properties: {properties}")

    def track_dependency(self, name: str, duration_ms: float, success: bool, properties: Optional[Dict[str, Any]] = None):
        """Logs dependency calls (e.g. external APIs, databases)."""
        status = "SUCCESS" if success else "FAILED"
        logger.debug(f"[Telemetry Dependency] {name} - {status} ({duration_ms}ms) | Properties: {properties}")

    def track_exception(self, exception: Exception, properties: Optional[Dict[str, Any]] = None):
        """Logs exceptions and operational errors."""
        logger.error(f"[Telemetry Exception] {type(exception).__name__}: {str(exception)} | Properties: {properties}")

    def flush(self):
        """Flushes telemetry buffers (no-op in zero-Azure mode)."""
        logger.debug("[Telemetry] Telemetry flushed")

    def shutdown(self):
        """Gracefully shuts down telemetry providers (no-op in zero-Azure mode)."""
        logger.debug("[Telemetry] Telemetry providers shut down")


azure_monitor_client = AzureMonitorClient()
