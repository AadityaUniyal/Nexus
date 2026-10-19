import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("nexus.telemetry")

_configured = False


def configure_monitoring() -> bool:
    """Enable request, dependency, and exception telemetry when Azure is configured."""
    global _configured
    from app.core.config import settings

    if _configured:
        return True
    if not settings.AZURE_MONITOR_ENABLED or not settings.APPLICATIONINSIGHTS_CONNECTION_STRING:
        return False
    try:
        from azure.monitor.opentelemetry import configure_azure_monitor

        configure_azure_monitor(
            connection_string=settings.APPLICATIONINSIGHTS_CONNECTION_STRING,
            sampling_ratio=0.1,
            logger_name="nexus",
        )
        _configured = True
        logger.info("Azure Monitor OpenTelemetry is configured for this API process")
    except Exception:
        logger.exception("Azure Monitor OpenTelemetry could not be initialized")
    return _configured


class AzureMonitorClient:
    """Small event/metric facade backed by OpenTelemetry and Azure Monitor."""
    def __init__(self):
        from app.core.config import settings
        self.enabled = _configured
        self.connection_string = settings.APPLICATIONINSIGHTS_CONNECTION_STRING
        self.tracer = None
        self.meter = None
        self.tracer_provider = None
        self.meter_provider = None
        self.metric_reader = None
        self.span_processor = None
        if not self.enabled:
            logger.info("Azure Monitor telemetry is not configured")

    def track_event(self, name: str, properties: Optional[Dict[str, Any]] = None):
        """Logs custom events (e.g. simulation runs, telemetry ingested, incidents detected)."""
        if not self.enabled:
            return
        try:
            from opentelemetry import trace
            with trace.get_tracer("nexus.events").start_as_current_span(name) as span:
                for key, value in (properties or {}).items():
                    if value is not None and isinstance(value, (str, bool, int, float)):
                        span.set_attribute(f"nexus.{key}", value)
        except Exception:
            logger.exception("Azure Monitor event could not be recorded")

    def track_metric(self, name: str, value: float, properties: Optional[Dict[str, Any]] = None):
        """Logs custom metrics (e.g. request latency, active users, error rates)."""
        if not self.enabled:
            return
        try:
            from opentelemetry import metrics
            meter = metrics.get_meter("nexus.metrics")
            counter = meter.create_counter(name)
            attributes = {key: value for key, value in (properties or {}).items() if isinstance(value, (str, bool, int, float))}
            counter.add(value, attributes)
        except Exception:
            logger.exception("Azure Monitor metric could not be recorded")

    def track_dependency(self, name: str, duration_ms: float, success: bool, properties: Optional[Dict[str, Any]] = None):
        """Logs dependency calls (e.g. external APIs, databases)."""
        status = "SUCCESS" if success else "FAILED"
        if self.enabled:
            self.track_event(f"dependency.{name}", {**(properties or {}), "status": status, "duration_ms": duration_ms})

    def track_exception(self, exception: Exception, properties: Optional[Dict[str, Any]] = None):
        """Logs exceptions and operational errors."""
        exc_info = (type(exception), exception, exception.__traceback__) if exception is not None else False
        logger.error(
            "[Telemetry Exception] %s | Properties: %s",
            type(exception).__name__,
            properties or {},
            exc_info=exc_info,
        )

    def flush(self):
        """Flushes telemetry buffers (no-op in zero-Azure mode)."""
        logger.debug("[Telemetry] Telemetry flushed")

    def shutdown(self):
        """Gracefully shuts down telemetry providers (no-op in zero-Azure mode)."""
        logger.debug("[Telemetry] Telemetry providers shut down")


azure_monitor_client = AzureMonitorClient()
