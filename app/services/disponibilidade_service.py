"""Cálculo de horários livres a partir da jornada e dos agendamentos."""
from datetime import date, datetime, timedelta
from typing import Any

from app.core.exceptions import ValidationError
from app.core.tempo import agora_utc, limites_do_dia
from app.models.agendamento import StatusAgendamento
from app.repositories.base import AbstractRepository
from app.services.jornada_service import JornadaService


class DisponibilidadeService:
    def __init__(
        self,
        servico_repo: AbstractRepository,
        agendamento_repo: AbstractRepository,
        jornada_service: JornadaService,
        passo_minutos: int,
    ) -> None:
        self._servico_repo = servico_repo
        self._agendamento_repo = agendamento_repo
        self._jornada_service = jornada_service
        self._passo = timedelta(minutes=passo_minutos)

    async def slots_livres(
        self, profissional_id: str, servico_id: str, dia: date
    ) -> list[dict[str, datetime]]:
        servico = await self._servico_repo.get_by_id(servico_id)
        if servico is None:
            raise ValidationError("Serviço informado não existe.")
        permitidos = servico.get("profissionais_ids") or []
        if permitidos and profissional_id not in permitidos:
            return []
        intervalos = await self._jornada_service.intervalos_do_dia(profissional_id, dia)
        if not intervalos:
            return []
        duracao = timedelta(minutes=int(servico["duracao_minutos"]))
        ocupados = await self._ocupados(profissional_id, dia)
        agora = agora_utc()
        slots: list[dict[str, datetime]] = []
        for inicio_bloco, fim_bloco in intervalos:
            slots.extend(
                self._gerar(inicio_bloco, fim_bloco, duracao, ocupados, agora)
            )
        return slots

    async def _ocupados(
        self, profissional_id: str, dia: date
    ) -> list[tuple[datetime, datetime]]:
        inicio_dia, fim_dia = limites_do_dia(dia)
        docs = await self._agendamento_repo.list(
            {
                "profissional_id": profissional_id,
                "data_hora_inicio": {"$gte": inicio_dia, "$lte": fim_dia},
            }
        )
        return [
            (doc["data_hora_inicio"], doc["data_hora_fim"])
            for doc in docs
            if doc.get("status") == StatusAgendamento.agendado.value
        ]

    def _gerar(
        self,
        inicio_bloco: datetime,
        fim_bloco: datetime,
        duracao: timedelta,
        ocupados: list[tuple[datetime, datetime]],
        agora: datetime,
    ) -> list[dict[str, datetime]]:
        slots = []
        candidato = inicio_bloco
        while candidato + duracao <= fim_bloco:
            fim = candidato + duracao
            if candidato >= agora and not self._colide(candidato, fim, ocupados):
                slots.append({"inicio": candidato, "fim": fim})
            candidato += self._passo
        return slots

    @staticmethod
    def _colide(
        inicio: datetime, fim: datetime, ocupados: list[tuple[datetime, datetime]]
    ) -> bool:
        return any(inicio < oc_fim and fim > oc_inicio for oc_inicio, oc_fim in ocupados)
