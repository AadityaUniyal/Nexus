import logging
from typing import Dict, Any, Optional
from app.core.config import settings

try:
    from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter, AzureMonitorMetricExporter, AzureMonitorLogExporter
    from opentelemetry import trace, metrics
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    import opentelemetry.trace.status as trace_status
except ImportError:
    pass

logger = logging.getLogger("nexus.integrations.azure_monitor")

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
        
        if self.enabled and self.connection_string:
            try:
                # Setup Tracing
                tracer_provider = TracerProvider()
                trace_exporter = AzureMonitorTraceExporter(connection_string=self.connection_string)
                span_processor = BatchSpanProcessor(trace_exporter)
                tracer_provider.add_span_processor(span_processor)
                trace.set_tracer_provider(tracer_provider)
                self.tracer = trace.get_tracer(__name__)
                
                # Setup Metrics
                metric_exporter = AzureMonitorMetricExporter(connection_string=self.connection_string)
                reader = PeriodicExportingMetricReader(metric_exporter)
                meter_provider = MeterProvider(metric_readers=[reader])
                metrics.set_meter_provider(meter_provider)
                self.meter = metrics.get_meter(__name__)
                
                logger.info("[Azure Monitor] Initialized Application Insights with OpenTelemetry")
            except Exception as e:
                logger.error(f"[Azure Monitor] Failed to initialize: {e}")
                self.tracer = None
                self.meter = None
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
            # We create a counter for simplicity here in the generalized method
            counter = self.meter.create_counter(name=name)
            counter.add(value, attributes=properties or {})
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
        if self.tracer and trace.get_tracer_provider():
            if hasattr(trace.get_tracer_provider(), "force_flush"):
                trace.get_tracer_provider().force_flush()
        if self.meter and metrics.get_meter_provider():
            if hasattr(metrics.get_meter_provider(), "force_flush"):
                metrics.get_meter_provider().force_flush()
        logger.debug("[Azure Monitor] Flushed telemetry")

azure_monitor_client = AzureMonitorClient()
