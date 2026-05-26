"""Regras de negócio de Agendamentos.

Valida a integridade do relacionamento (cliente, profissional e serviço
precisam existir) e calcula o término a partir da duração do serviço.

NOTA M3 (Essencial): a validação de conflito de horário do mesmo
profissional será adicionada no método `criar` na Camada 3.
"""
from datetime import date, datetime, timedelta
from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.models.agendamento import AgendamentoCreate, StatusAgendamento
from app.repositories.base import AbstractRepository


class AgendamentoService:
    def __init__(
        self,
        agendamento_repo: AbstractRepository,
        servico_repo: AbstractRepository,
        usuario_repo: AbstractRepository,
    ) -> None:
        self._repo = agendamento_repo
        self._servico_repo = servico_repo
        self._usuario_repo = usuario_repo

    async def listar(
        self,
        cliente_id: str | None = None,
        profissional_id: str | None = None,
        data: date | None = None,
    ) -> list[dict[str, Any]]:
        filters: dict[str, Any] = {}
        if cliente_id:
            filters["cliente_id"] = cliente_id
        if profissional_id:
            filters["profissional_id"] = profissional_id
        if data:
            inicio_dia = datetime(data.year, data.month, data.day)
            filters["data_hora_inicio"] = {
                "$gte": inicio_dia,
                "$lt": inicio_dia + timedelta(days=1),
            }
        return await self._repo.list(filters)

    async def buscar(self, agendamento_id: str) -> dict[str, Any]:
        agendamento = await self._repo.get_by_id(agendamento_id)
        if agendamento is None:
            raise NotFoundError("Agendamento não encontrado.")
        return agendamento

    async def criar(self, data: AgendamentoCreate) -> dict[str, Any]:
        servico = await self._servico_repo.get_by_id(data.servico_id)
        if servico is None:
            raise ValidationError("Serviço informado não existe.")
        if await self._usuario_repo.get_by_id(data.cliente_id) is None:
            raise ValidationError("Cliente informado não existe.")
        if await self._usuario_repo.get_by_id(data.profissional_id) is None:
            raise ValidationError("Profissional informado não existe.")

        inicio = data.data_hora_inicio
        fim = inicio + timedelta(minutes=int(servico["duracao_minutos"]))
        doc = {
            "cliente_id": data.cliente_id,
            "profissional_id": data.profissional_id,
            "servico_id": data.servico_id,
            "data_hora_inicio": inicio,
            "data_hora_fim": fim,
            "status": StatusAgendamento.agendado.value,
        }
        return await self._repo.create(doc)

    async def cancelar(self, agendamento_id: str) -> None:
        """Cancelamento lógico: status -> cancelado (preserva o histórico)."""
        atualizado = await self._repo.update(
            agendamento_id, {"status": StatusAgendamento.cancelado.value}
        )
        if atualizado is None:
            raise NotFoundError("Agendamento não encontrado.")
