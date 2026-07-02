"""Regras de negócio das notificações in-app."""
from typing import Any

from app.core.exceptions import NotFoundError
from app.core.tempo import agora_utc
from app.models.notificacao import TipoNotificacao
from app.repositories.base import AbstractRepository


class NotificacaoService:
    def __init__(self, repository: AbstractRepository) -> None:
        self._repo = repository

    async def criar(
        self,
        usuario_id: str,
        tipo: TipoNotificacao,
        titulo: str,
        mensagem: str,
        agendamento_id: str | None = None,
    ) -> dict[str, Any]:
        return await self._repo.create(
            {
                "usuario_id": usuario_id,
                "tipo": tipo.value,
                "titulo": titulo,
                "mensagem": mensagem,
                "lida": False,
                "criado_em": agora_utc(),
                "agendamento_id": agendamento_id,
            }
        )

    async def listar(
        self,
        usuario_id: str,
        apenas_nao_lidas: bool = False,
        skip: int = 0,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        filtros: dict[str, Any] = {"usuario_id": usuario_id}
        if apenas_nao_lidas:
            filtros["lida"] = False
        return await self._repo.list(filtros, skip=skip, limit=limit)

    async def contar_nao_lidas(self, usuario_id: str) -> int:
        return len(await self._repo.list({"usuario_id": usuario_id, "lida": False}))

    async def marcar_lida(self, notificacao_id: str, usuario_id: str) -> dict[str, Any]:
        notificacao = await self._repo.get_by_id(notificacao_id)
        if notificacao is None or notificacao["usuario_id"] != usuario_id:
            raise NotFoundError("Notificação não encontrada.")
        return await self._repo.update(notificacao_id, {"lida": True})

    async def marcar_todas_lidas(self, usuario_id: str) -> int:
        nao_lidas = await self._repo.list({"usuario_id": usuario_id, "lida": False})
        for notificacao in nao_lidas:
            await self._repo.update(notificacao["id"], {"lida": True})
        return len(nao_lidas)
