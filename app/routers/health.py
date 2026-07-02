"""Rotas de health check — úteis para validar a infraestrutura."""
from fastapi import APIRouter

from app.core.database import get_database

router = APIRouter(tags=["health"])


@router.get("/health", summary="Verifica se a API está no ar")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db", summary="Verifica a conexão com o MongoDB")
async def health_db() -> dict[str, str]:
    db = get_database()
    await db.command("ping")
    return {"status": "ok", "database": "connected"}
