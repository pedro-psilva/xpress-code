"""Rotas de health check — úteis para validar a infraestrutura."""
from fastapi import APIRouter
from pymongo.errors import PyMongoError

from app.core.database import get_database
from app.core.exceptions import DomainError

router = APIRouter(tags=["health"])


@router.get("/health", summary="Verifica se a API está no ar")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db", summary="Verifica a conexão com o MongoDB")
async def health_db() -> dict[str, str]:
    db = get_database()
    try:
        await db.command("ping")
    except PyMongoError:
        raise DomainError("Banco de dados indisponível.", status_code=503)
    return {"status": "ok", "database": "connected"}
