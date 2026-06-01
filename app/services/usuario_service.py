"""Regras de negócio de Usuários."""
from datetime import datetime, timezone
from typing import Any

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_senha
from app.models.usuario import UsuarioCreate, UsuarioUpdate
from app.repositories.base import AbstractRepository


class UsuarioService:
    def __init__(self, repository: AbstractRepository) -> None:
        self._repo = repository

    async def listar(self, filtros: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        return await self._repo.list(filtros)

    async def buscar(self, usuario_id: str) -> dict[str, Any]:
        usuario = await self._repo.get_by_id(usuario_id)
        if usuario is None:
            raise NotFoundError("Usuário não encontrado.")
        return usuario

    async def criar(self, data: UsuarioCreate) -> dict[str, Any]:
        if await self._repo.list({"email": data.email}):
            raise ConflictError("E-mail já cadastrado.")
        doc = data.model_dump(exclude={"senha"})
        doc["perfil"] = data.perfil.value
        doc["senha_hash"] = hash_senha(data.senha)
        doc["criado_em"] = datetime.now(timezone.utc)
        return await self._repo.create(doc)

    async def atualizar(self, usuario_id: str, data: UsuarioUpdate) -> dict[str, Any]:
        update_doc = data.model_dump(exclude_unset=True, exclude={"senha", "perfil"})
        if data.perfil is not None:
            update_doc["perfil"] = data.perfil.value
        if data.senha is not None:
            update_doc["senha_hash"] = hash_senha(data.senha)
        if not update_doc:
            return await self.buscar(usuario_id)
        atualizado = await self._repo.update(usuario_id, update_doc)
        if atualizado is None:
            raise NotFoundError("Usuário não encontrado.")
        return atualizado

    async def remover(self, usuario_id: str) -> None:
        if not await self._repo.delete(usuario_id):
            raise NotFoundError("Usuário não encontrado.")
