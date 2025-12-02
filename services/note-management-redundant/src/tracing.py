from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME,Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
import logging
import os


logger = logging.getLogger(__name__)


def setup_telemetry(app,engine=None):
    """
    Args:
        app: FastAPI instance
        engine: SQLAlchemy engine instance
    """
    service_name = os.getenv("SERVICE_NAME", "fastapi_app")
    
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://tempo:4317")

    resource = Resource(attributes={
        SERVICE_NAME: service_name,
    })

    # create a tracer provider
    provider = TracerProvider(resource=resource)

    otlp_exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=True,# for local development
    )

    # Add batch span processor
    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)

    # set the tracer provider(default)
    trace.set_tracer_provider(provider)

    # Instrumentation
    FastAPIInstrumentor.instrument_app(app)

    LoggingInstrumentor().instrument(set_logging_format=True)

    logger.info(f"OpenTelemetry instrumentation initialized for {service_name}")
    logger.info(f"Exporting traces to {otlp_endpoint}")

    return trace.get_tracer(__name__)
    