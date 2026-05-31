"""Provedores de dependência (FastAPI Depends).

Montam os serviços injetando repositórios concretos. É aqui que a abstração
(AbstractRepository) é ligada à implementação concreta (MongoRepository) — DIP.
"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.repositories.mongo_repository import MongoRepository
from app.services.agendamento_service import AgendamentoService
from app.services.auth_service import AuthService
from app.services.plano_service import PlanoService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService
from app.services.whatsapp_client import WhatsAppClient
from app.services.whatsapp_service import WhatsAppService


def get_auth_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthService:
    return AuthService(MongoRepository(db["usuarios"]))


def get_servico_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ServicoService:
    return ServicoService(MongoRepository(db["servicos"]))


def get_plano_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> PlanoService:
    return PlanoService(MongoRepository(db["planos"]))


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


def get_whatsapp_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> WhatsAppService:
    return WhatsAppService(
        db=db,
        client=WhatsAppClient(),
        usuario_service=get_usuario_service(db),
        servico_service=get_servico_service(db),
        agendamento_service=get_agendamento_service(db),
    )
