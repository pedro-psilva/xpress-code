"""Regras de negócio de Serviços."""
from typing import Any

from app.core.exceptions import NotFoundError
from app.models.servico import ServicoCreate
from app.repositories.base import AbstractRepository


class ServicoService:
    def __init__(self, repository: AbstractRepository) -> None:
        self._repo = repository

    async def listar(self, filtros: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        return await self._repo.list(filtros)

    async def buscar(self, servico_id: str) -> dict[str, Any]:
        servico = await self._repo.get_by_id(servico_id)
        if servico is None:
            raise NotFoundError("Serviço não encontrado.")
        return servico

    async def criar(self, data: ServicoCreate) -> dict[str, Any]:
        return await self._repo.create(data.model_dump())

    async def atualizar(self, servico_id: str, data: ServicoCreate) -> dict[str, Any]:
        atualizado = await self._repo.update(servico_id, data.model_dump())
        if atualizado is None:
            raise NotFoundError("Serviço não encontrado.")
        return atualizado

    async def desativar(self, servico_id: str) -> None:
        """Remoção lógica: marca o serviço como inativo (ativo=False)."""
        atualizado = await self._repo.update(servico_id, {"ativo": False})
        if atualizado is None:
            raise NotFoundError("Serviço não encontrado.")
