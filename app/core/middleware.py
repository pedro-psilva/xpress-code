"""Middlewares de borda: log de requisições, headers e limite de payload."""
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.logging import logger


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        inicio = time.perf_counter()
        response = await call_next(request)
        duracao_ms = (time.perf_counter() - inicio) * 1000
        logger.info(
            "%s %s %s %.1fms",
            request.method,
            request.url.path,
            response.status_code,
            duracao_ms,
        )
        return response

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        for chave, valor in _SECURITY_HEADERS.items():
            response.headers.setdefault(chave, valor)
        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_bytes: int) -> None:
        super().__init__(app)
        self._max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        tamanho = request.headers.get("content-length")
        if tamanho is not None and tamanho.isdigit() and int(tamanho) > self._max_bytes:
            return JSONResponse(
                status_code=413,
                content={"status": 413, "detail": "Payload muito grande."},
            )
        return await call_next(request)
