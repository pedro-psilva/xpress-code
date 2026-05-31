from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.exceptions import DomainError, NotFoundError
from app.models.assinatura import AssinaturaCreate, CobrancaResponse, StatusAssinatura
from app.repositories.base import AbstractRepository
from app.services.infinitepay_client import InfinitePayClient
from app.services.notification_service import NotificationService
from app.services.plano_service import PlanoService
from app.services.usuario_service import UsuarioService


class AssinaturaService:
    def __init__(
        self,
        repository: AbstractRepository,
        usuario_service: UsuarioService,
        plano_service: PlanoService,
        infinitepay: InfinitePayClient,
        notification: NotificationService,
    ) -> None:
        self._repo = repository
        self._usuarios = usuario_service
        self._planos = plano_service
        self._pay = infinitepay
        self._notif = notification

    async def listar(self) -> list[dict[str, Any]]:
        return await self._repo.list()

    async def buscar(self, assinatura_id: str) -> dict[str, Any]:
        doc = await self._repo.get_by_id(assinatura_id)
        if doc is None:
            raise NotFoundError("Assinatura nao encontrada.")
        return doc

    async def criar(self, data: AssinaturaCreate) -> dict[str, Any]:
        await self._usuarios.buscar(data.cliente_id)
        await self._planos.buscar(data.plano_id)
        doc = data.model_dump()
        doc["status"] = data.status.value
        doc["proxima_cobranca"] = datetime.now(timezone.utc) + timedelta(days=30)
        doc["ultima_cobranca"] = None
        doc["ultimo_link_pagamento"] = None
        return await self._repo.create(doc)

    async def atualizar_status(
        self, assinatura_id: str, status: StatusAssinatura
    ) -> dict[str, Any]:
        atualizado = await self._repo.update(
            assinatura_id, {"status": status.value}
        )
        if atualizado is None:
            raise NotFoundError("Assinatura nao encontrada.")
        return atualizado

    async def remover(self, assinatura_id: str) -> None:
        removido = await self._repo.delete(assinatura_id)
        if not removido:
            raise NotFoundError("Assinatura nao encontrada.")

    async def gerar_cobranca(self, assinatura_id: str) -> CobrancaResponse:
        if not self._pay.configurado:
            raise DomainError(
                "InfinitePay nao configurado (defina INFINITEPAY_HANDLE no .env).",
                status_code=503,
            )
        assinatura = await self.buscar(assinatura_id)
        cliente = await self._usuarios.buscar(assinatura["cliente_id"])
        plano = await self._planos.buscar(assinatura["plano_id"])
        valor = (
            plano["preco_corte_barba"]
            if assinatura.get("inclui_barba")
            else plano["preco_corte"]
        )
        descricao = (
            f"Plano {plano['nome']}"
            + (" + Barba" if assinatura.get("inclui_barba") else "")
        )
        order_nsu = f"sub-{assinatura_id}-{int(datetime.now(timezone.utc).timestamp())}"
        resp = await self._pay.criar_link(order_nsu, descricao, valor)
        if not resp or not resp.get("url"):
            raise DomainError(
                "Nao foi possivel criar o link de pagamento na InfinitePay.",
                status_code=502,
            )
        link = resp["url"]
        canais = await self._notif.enviar_cobranca(cliente, plano["nome"], valor, link)
        await self._repo.update(
            assinatura_id,
            {
                "ultima_cobranca": datetime.now(timezone.utc),
                "ultimo_link_pagamento": link,
                "status": StatusAssinatura.pendente.value,
            },
        )
        return CobrancaResponse(
            link=link,
            enviado_email=canais["email"],
            enviado_whatsapp=canais["whatsapp"],
        )

    async def processar_webhook_pagamento(self, payload: dict[str, Any]) -> None:
        order_nsu = payload.get("order_nsu")
        if not order_nsu or not order_nsu.startswith("sub-"):
            return
        partes = order_nsu.split("-")
        if len(partes) < 3:
            return
        assinatura_id = partes[1]
        existente = await self._repo.get_by_id(assinatura_id)
        if existente is None:
            return
        await self._repo.update(
            assinatura_id,
            {
                "status": StatusAssinatura.ativa.value,
                "proxima_cobranca": datetime.now(timezone.utc) + timedelta(days=30),
            },
        )
