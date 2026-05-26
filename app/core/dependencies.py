"""Provedores de dependência (FastAPI Depends).

Montam os serviços injetando repositórios concretos. É aqui que a abstração
(AbstractRepository) é ligada à implementação concreta (MongoRepository) — DIP.
"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.repositories.mongo_repository import MongoRepository
from app.services.servico_service import ServicoService


def get_servico_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ServicoService:
    return ServicoService(MongoRepository(db["servicos"]))
