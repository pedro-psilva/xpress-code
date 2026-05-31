from typing import Any

from app.core.exceptions import NotFoundError
from app.models.plano import PlanoCreate
from app.repositories.base import AbstractRepository


class PlanoService:
    def __init__(self, repository: AbstractRepository) -> None:
        self._repo = repository

    async def listar(self) -> list[dict[str, Any]]:
        return await self._repo.list()

    async def buscar(self, plano_id: str) -> dict[str, Any]:
        plano = await self._repo.get_by_id(plano_id)
        if plano is None:
            raise NotFoundError("Plano não encontrado.")
        return plano

    async def criar(self, data: PlanoCreate) -> dict[str, Any]:
        return await self._repo.create(data.model_dump())

    async def atualizar(self, plano_id: str, data: PlanoCreate) -> dict[str, Any]:
        atualizado = await self._repo.update(plano_id, data.model_dump())
        if atualizado is None:
            raise NotFoundError("Plano não encontrado.")
        return atualizado

    async def desativar(self, plano_id: str) -> None:
        atualizado = await self._repo.update(plano_id, {"ativo": False})
        if atualizado is None:
            raise NotFoundError("Plano não encontrado.")
