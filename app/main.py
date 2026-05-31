"""Ponto de entrada da API Xpress Code.

A documentação OpenAPI/Swagger fica disponível em /docs (nativo do FastAPI).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.core.exceptions import DomainError
from app.routers import (
    agendamentos,
    assinaturas,
    auth,
    health,
    planos,
    servicos,
    usuarios,
    webhooks,
    whatsapp,
)


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
)

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
app.include_router(assinaturas.router, prefix=settings.api_v1_prefix)
app.include_router(whatsapp.router, prefix=settings.api_v1_prefix)
app.include_router(webhooks.router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"], summary="Informações básicas da API")
async def root() -> dict[str, str]:
    return {"app": "Xpress Code API", "docs": "/docs"}
