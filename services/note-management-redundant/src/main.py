from fastapi import FastAPI
from .db.database import lifespan
import socket
import os

from prometheus_fastapi_instrumentator import Instrumentator
import logging
from logging_loki import LokiHandler


# Loki configuration.
logger = logging.getLogger("fastapi")
logger.setLevel(logging.INFO)
loki_handler = LokiHandler(
    url="http://loki:3100/loki/api/v1/push",
    tags={"application": "fastapi_app"},
    version="1",
)
logger.addHandler(loki_handler)

# Initialize app.
app = FastAPI(lifespan=lifespan)




# Using this middleware to log every request and response with LOKI.
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        logger.info(
            f"{request.method} {request.url.path}"
            f"status: {response.status_code}"
            f"Time: {process_time:.2f}ms"
        )
        return response


app.add_middleware(LoggingMiddleware)


# Prometheus configuration.
Instrumentator().instrument(app).expose(app)

# Custom prometheous metrics: how much time a req takes.
from prometheus_client import Histogram

REQUEST_TIME = Histogram(
    "fastapi_request_duration_seconds",
    "Time spent processing request",
    ["method", "endpoint"],
)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        REQUEST_TIME.labels(request.method, request.url.path).observe(process_time)
        return response


app.add_middleware(MetricsMiddleware)





# OpenTelemetry configuration.
from .tracing import setup_telemetry

tracer = setup_telemetry(app)


###*****************************###

from .note.views import router as note_router
app.include_router(note_router)

@app.get("/")
async def read_root():
    return {"message": "Server Running!"}


@app.get("/info")
async def container_info():
    # These values comes from docker.
    return {
        "container_id": socket.gethostname(),
        "container_name": os.environ.get("HOSTNAME", "unknown"),
        "process_id": os.getpid(),
        "message": f"Response from container: {socket.gethostname()}",
    }
