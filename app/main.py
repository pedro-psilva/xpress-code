"""Ponto de entrada da API Xpress Code.

A documentação OpenAPI/Swagger fica disponível em /docs (nativo do FastAPI).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import close_mongo_connection, connect_to_mongo
from app.routers import health


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

app.include_router(health.router)


@app.get("/", tags=["root"], summary="Informações básicas da API")
async def root() -> dict[str, str]:
    return {"app": "Xpress Code API", "docs": "/docs"}
