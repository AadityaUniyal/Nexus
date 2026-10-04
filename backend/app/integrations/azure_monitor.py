import logging
import os
import sys
from typing import Dict, Any, Optional
from app.core.config import settings

# Silence verbose Azure SDK HTTP logging pipeline loggers to prevent closed-stream I/O errors
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)
logging.getLogger("azure.monitor.opentelemetry").setLevel(logging.WARNING)
logging.getLogger("azure.core.pipeline").setLevel(logging.WARNING)

logger = logging.getLogger("nexus.integrations.azure_monitor")

# Each import is isolated and its failure is logged. Previously one combined
# try/except silently disabled all telemetry whenever any single name was
# missing (e.g. an exporter class absent from the installed SDK version).
OTEL_IMPORT_ERROR = None
trace = metrics = trace_status = None
TracerProvider = MeterProvider = BatchSpanProcessor = PeriodicExportingMetricReader = None
AzureMonitorTraceExporter = AzureMonitorMetricExporter = None
try:
    from opentelemetry import trace, metrics
    import opentelemetry.trace.status as trace_status
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter, AzureMonitorMetricExporter
except Exception as _e:  # noqa: BLE001
    OTEL_IMPORT_ERROR = f"{type(_e).__name__}: {_e}"
    logger.error("[Azure Monitor] OpenTelemetry import failed: %s", OTEL_IMPORT_ERROR)

class AzureMonitorClient:
    """
    Integrates Application Insights via OpenTelemetry for tracking:
    - request latency
    - active users
    - API endpoint usage
    - error rates
    - custom events (simulation runs, telemetry ingested, incidents detected)
    """
    def __init__(self):
        self.enabled = settings.AZURE_MONITOR_ENABLED
        self.connection_string = settings.APPLICATIONINSIGHTS_CONNECTION_STRING
        
        self.tracer = None
        self.meter = None
        self.tracer_provider = None
        self.meter_provider = None
        self.metric_reader = None
        self.span_processor = None

        is_testing = (
            getattr(settings, "APP_ENV", "").lower() in ["test", "testing"]
            or bool(os.getenv("TESTING"))
            or bool(os.getenv("PYTEST_CURRENT_TEST"))
            or "pytest" in sys.modules
        )

        if self.enabled and self.connection_string and OTEL_IMPORT_ERROR:
            logger.error("[Azure Monitor] Disabled: %s", OTEL_IMPORT_ERROR)
        elif self.enabled and self.connection_string:
            try:
                # Setup Tracing
                self.tracer_provider = TracerProvider()
                if not is_testing:
                    trace_exporter = AzureMonitorTraceExporter(connection_string=self.connection_string)
                    self.span_processor = BatchSpanProcessor(trace_exporter)
                    self.tracer_provider.add_span_processor(self.span_processor)
                trace.set_tracer_provider(self.tracer_provider)
                self.tracer = trace.get_tracer(__name__)
                
                # Setup Metrics
                if is_testing:
                    # In test environment, do not start background PeriodicExportingMetricReader
                    self.meter_provider = MeterProvider()
                    metrics.set_meter_provider(self.meter_provider)
                    self.meter = metrics.get_meter(__name__)
                    logger.info("[Azure Monitor] Testing environment detected; background metric exporter disabled")
                else:
                    metric_exporter = AzureMonitorMetricExporter(connection_string=self.connection_string)
                    self.metric_reader = PeriodicExportingMetricReader(metric_exporter)
                    self.meter_provider = MeterProvider(metric_readers=[self.metric_reader])
                    metrics.set_meter_provider(self.meter_provider)
                    self.meter = metrics.get_meter(__name__)
                
                logger.info("[Azure Monitor] Initialized Application Insights with OpenTelemetry")
            except Exception as e:
                logger.error(f"[Azure Monitor] Failed to initialize: {e}")
                self.tracer = None
                self.meter = None
                self.tracer_provider = None
                self.meter_provider = None
        else:
            logger.info("[Azure Monitor] Application Insights connection string not found or disabled. Using local logging fallback.")
            
    def track_event(self, name: str, properties: Optional[Dict[str, Any]] = None):
        """Tracks custom events (e.g. simulation runs, telemetry ingested, incidents detected)"""
        if self.tracer:
            with self.tracer.start_as_current_span(name) as span:
                span.add_event(name, attributes=properties or {})
        else:
            logger.info(f"[Azure Monitor Event] {name} | Properties: {properties}")

    def track_metric(self, name: str, value: float, properties: Optional[Dict[str, Any]] = None):
        """Tracks custom metrics (e.g. request latency, active users, error rates)"""
        if self.meter:
            # Histograms give App Insights avg/min/max/percentiles for latency-style metrics.
            cache = self.__dict__.setdefault("_instruments", {})
            hist = cache.get(name) or cache.setdefault(name, self.meter.create_histogram(name=name))
            hist.record(value, attributes=properties or {})
        else:
            logger.info(f"[Azure Monitor Metric] {name}: {value} | Properties: {properties}")

    def track_dependency(self, name: str, duration_ms: float, success: bool, properties: Optional[Dict[str, Any]] = None):
        """Tracks dependency calls (e.g. external APIs, databases)"""
        if self.tracer:
            with self.tracer.start_as_current_span(f"Dependency: {name}") as span:
                span.set_attribute("dependency.duration_ms", duration_ms)
                span.set_attribute("dependency.success", success)
                if properties:
                    for k, v in properties.items():
                        span.set_attribute(k, v)
                if not success:
                    span.set_status(trace_status.Status(trace_status.StatusCode.ERROR))
        else:
            status = "SUCCESS" if success else "FAILED"
            logger.info(f"[Azure Monitor Dependency] {name} - {status} ({duration_ms}ms) | Properties: {properties}")

    def track_exception(self, exception: Exception, properties: Optional[Dict[str, Any]] = None):
        """Tracks exceptions and errors"""
        if self.tracer:
            with self.tracer.start_as_current_span("Exception") as span:
                span.record_exception(exception)
                span.set_status(trace_status.Status(trace_status.StatusCode.ERROR))
                if properties:
                    for k, v in properties.items():
                        span.set_attribute(k, v)
        else:
            logger.error(f"[Azure Monitor Exception] {type(exception).__name__}: {str(exception)} | Properties: {properties}")

    def flush(self):
        """Flushes telemetry to Azure Monitor"""
        try:
            if self.tracer_provider and hasattr(self.tracer_provider, "force_flush"):
                self.tracer_provider.force_flush()
            elif self.tracer and trace.get_tracer_provider():
                if hasattr(trace.get_tracer_provider(), "force_flush"):
                    trace.get_tracer_provider().force_flush()
        except Exception:
            pass
        try:
            if self.meter_provider and hasattr(self.meter_provider, "force_flush"):
                self.meter_provider.force_flush()
            elif self.meter and metrics.get_meter_provider():
                if hasattr(metrics.get_meter_provider(), "force_flush"):
                    metrics.get_meter_provider().force_flush()
        except Exception:
            pass
        logger.debug("[Azure Monitor] Flushed telemetry")

    def shutdown(self):
        """Gracefully stop background threads and exporters."""
        if self.meter_provider and hasattr(self.meter_provider, "shutdown"):
            try:
                self.meter_provider.shutdown()
            except Exception as e:
                logger.debug(f"[Azure Monitor] Meter provider shutdown error: {e}")

        if self.tracer_provider and hasattr(self.tracer_provider, "shutdown"):
            try:
                self.tracer_provider.shutdown()
            except Exception as e:
                logger.debug(f"[Azure Monitor] Tracer provider shutdown error: {e}")

        try:
            global_meter = metrics.get_meter_provider()
            if global_meter and hasattr(global_meter, "shutdown") and global_meter != self.meter_provider:
                global_meter.shutdown()
        except Exception:
            pass

        try:
            global_tracer = trace.get_tracer_provider()
            if global_tracer and hasattr(global_tracer, "shutdown") and global_tracer != self.tracer_provider:
                global_tracer.shutdown()
        except Exception:
            pass

        logger.debug("[Azure Monitor] Telemetry providers shut down")

azure_monitor_client = AzureMonitorClient()
