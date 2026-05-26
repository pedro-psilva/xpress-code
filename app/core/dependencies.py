"""Provedores de dependência (FastAPI Depends).

Montam os serviços injetando repositórios concretos. É aqui que a abstração
(AbstractRepository) é ligada à implementação concreta (MongoRepository) — DIP.
"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.repositories.mongo_repository import MongoRepository
from app.services.agendamento_service import AgendamentoService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService


def get_servico_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ServicoService:
    return ServicoService(MongoRepository(db["servicos"]))


def get_usuario_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UsuarioService:
    return UsuarioService(MongoRepository(db["usuarios"]))


def get_agendamento_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> AgendamentoService:
    return AgendamentoService(
        agendamento_repo=MongoRepository(db["agendamentos"]),
        servico_repo=MongoRepository(db["servicos"]),
        usuario_repo=MongoRepository(db["usuarios"]),
    )
