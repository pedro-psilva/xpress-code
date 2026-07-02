"""Envio de lembretes de agendamentos próximos.

Idempotente: cada agendamento recebe um único lembrete (`lembrete_enviado`).
Pensado para ser disparado por um cron externo, não por scheduler in-process.
"""
from datetime import timedelta

from app.core.tempo import agora_utc, formatar_local
from app.models.agendamento import StatusAgendamento
from app.models.notificacao import TipoNotificacao
from app.repositories.base import AbstractRepository
from app.services.notificacao_service import NotificacaoService
from app.services.notification_service import NotificationService


class LembreteService:
    def __init__(
        self,
        agendamento_repo: AbstractRepository,
        usuario_repo: AbstractRepository,
        notificacao_service: NotificacaoService,
        notification_service: NotificationService,
    ) -> None:
        self._repo = agendamento_repo
        self._usuario_repo = usuario_repo
        self._notificacao_service = notificacao_service
        self._notification_service = notification_service

    async def processar(self, antecedencia_horas: int = 24) -> int:
        agora = agora_utc()
        limite = agora + timedelta(hours=antecedencia_horas)
        candidatos = await self._repo.list(
            {
                "status": StatusAgendamento.agendado.value,
                "data_hora_inicio": {"$gte": agora, "$lte": limite},
            }
        )
        enviados = 0
        for agendamento in candidatos:
            if agendamento.get("lembrete_enviado"):
                continue
            cliente = await self._usuario_repo.get_by_id(agendamento["cliente_id"])
            if cliente is None:
                continue
            quando = formatar_local(agendamento["data_hora_inicio"])
            await self._notificacao_service.criar(
                usuario_id=agendamento["cliente_id"],
                tipo=TipoNotificacao.lembrete,
                titulo="Lembrete de agendamento",
                mensagem=f"Você tem um agendamento em {quando}.",
                agendamento_id=agendamento["id"],
            )
            await self._notification_service.enviar_lembrete(cliente, quando)
            await self._repo.update(agendamento["id"], {"lembrete_enviado": True})
            enviados += 1
        return enviados
