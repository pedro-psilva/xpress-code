"""Conexão com o MongoDB.

Cliente assíncrono (Motor) gerenciado pelo ciclo de vida da aplicação.
A instância do banco é exposta via `get_database`, que será injetada nas
rotas/repositórios pelo mecanismo de dependências do FastAPI (Depends) — DIP.
"""
from datetime import timezone

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


class _Database:
    client: AsyncIOMotorClient | None = None


_db = _Database()


async def connect_to_mongo() -> None:
    _db.client = AsyncIOMotorClient(
        settings.mongo_uri, tz_aware=True, tzinfo=timezone.utc
    )
    await _criar_indices()


async def close_mongo_connection() -> None:
    if _db.client is not None:
        _db.client.close()
        _db.client = None


def get_database() -> AsyncIOMotorDatabase:
    if _db.client is None:
        raise RuntimeError("Conexão com o MongoDB não inicializada.")
    return _db.client[settings.mongo_db_name]


async def _criar_indices() -> None:
    db = get_database()
    await db["usuarios"].create_index("email", unique=True)
    await db["usuarios"].create_index("telefone")
    await db["usuarios"].create_index("perfil")
    await db["agendamentos"].create_index("profissional_id")
    await db["agendamentos"].create_index("cliente_id")
    await db["agendamentos"].create_index("data_hora_inicio")
    await db["agendamentos"].create_index("status")
    await db["agendamentos"].create_index(
        [("profissional_id", 1), ("data_hora_inicio", 1)],
        unique=True,
        partialFilterExpression={"status": "agendado"},
        name="ux_agendamento_profissional_inicio_ativo",
    )
    await db["assinaturas"].create_index("cliente_id")
    await db["assinaturas"].create_index("plano_id")
    await db["assinaturas"].create_index("status")
    await db["servicos"].create_index("nome")
    await db["planos"].create_index("nome")
    await db["jornadas"].create_index("profissional_id", unique=True)
