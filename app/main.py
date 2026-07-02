"""Ponto de entrada da API Xpress Code.

A documentação OpenAPI/Swagger fica disponível em /docs (nativo do FastAPI).
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.exceptions import DomainError
from app.core.middleware import BodySizeLimitMiddleware, SecurityHeadersMiddleware
from app.core.rate_limit import limiter
from app.routers import (
    agendamentos,
    assinaturas,
    auth,
    disponibilidade,
    health,
    jornadas,
    lembretes,
    notificacoes,
    planos,
    servicos,
    usuarios,
    webhooks,
    whatsapp,
)

_PROD = os.getenv("ENVIRONMENT", "development").lower() == "production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Xpress Code API",
    description="SaaS de gestão para barbearias — agendamentos, serviços e usuários.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if _PROD else "/docs",
    redoc_url=None if _PROD else "/redoc",
    openapi_url=None if _PROD else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware, max_bytes=1_048_576)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Converte erros de domínio em resposta JSON com o status HTTP adequado."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": exc.status_code, "detail": exc.detail},
    )


app.include_router(health.router)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(servicos.router, prefix=settings.api_v1_prefix)
app.include_router(planos.router, prefix=settings.api_v1_prefix)
app.include_router(usuarios.router, prefix=settings.api_v1_prefix)
app.include_router(agendamentos.router, prefix=settings.api_v1_prefix)
app.include_router(jornadas.router, prefix=settings.api_v1_prefix)
app.include_router(disponibilidade.router, prefix=settings.api_v1_prefix)
app.include_router(notificacoes.router, prefix=settings.api_v1_prefix)
app.include_router(lembretes.router, prefix=settings.api_v1_prefix)
app.include_router(assinaturas.router, prefix=settings.api_v1_prefix)
app.include_router(whatsapp.router, prefix=settings.api_v1_prefix)
app.include_router(webhooks.router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"], summary="Informações básicas da API")
async def root() -> dict[str, str]:
    return {"app": "Xpress Code API", "docs": "/docs"}
