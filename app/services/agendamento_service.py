"""Regras de negócio de Agendamentos.

Valida a integridade do relacionamento (cliente, profissional e serviço
precisam existir), calcula o término a partir da duração do serviço e impede
que o mesmo profissional tenha dois agendamentos com horários sobrepostos.
"""
from datetime import date, datetime, timedelta
from typing import Any

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.tempo import data_local, limites_do_dia, para_utc
from app.models.agendamento import AgendamentoCreate, StatusAgendamento
from app.models.notificacao import TipoNotificacao
from app.repositories.base import AbstractRepository
from app.services.jornada_service import JornadaService
from app.services.notificacao_service import NotificacaoService


class AgendamentoService:
    def __init__(
        self,
        agendamento_repo: AbstractRepository,
        servico_repo: AbstractRepository,
        usuario_repo: AbstractRepository,
        jornada_service: JornadaService,
        notificacao_service: NotificacaoService,
    ) -> None:
        self._repo = agendamento_repo
        self._servico_repo = servico_repo
        self._usuario_repo = usuario_repo
        self._jornada_service = jornada_service
        self._notificacao_service = notificacao_service

    async def listar(
        self,
        cliente_id: str | None = None,
        profissional_id: str | None = None,
        data: date | None = None,
        skip: int = 0,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        filters: dict[str, Any] = {}
        if cliente_id:
            filters["cliente_id"] = cliente_id
        if profissional_id:
            filters["profissional_id"] = profissional_id
        if data:
            inicio_dia, fim_dia = limites_do_dia(data)
            filters["data_hora_inicio"] = {"$gte": inicio_dia, "$lte": fim_dia}
        return await self._repo.list(filters, skip=skip, limit=limit)

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

        permitidos = servico.get("profissionais_ids") or []
        if permitidos and data.profissional_id not in permitidos:
            raise ValidationError(
                "Este profissional não realiza o serviço selecionado."
            )

        inicio = para_utc(data.data_hora_inicio)
        fim = inicio + timedelta(minutes=int(servico["duracao_minutos"]))

        await self._validar_jornada(data.profissional_id, inicio, fim)
        await self._validar_conflito(data.profissional_id, inicio, fim)

        doc = {
            "cliente_id": data.cliente_id,
            "profissional_id": data.profissional_id,
            "servico_id": data.servico_id,
            "data_hora_inicio": inicio,
            "data_hora_fim": fim,
            "status": StatusAgendamento.agendado.value,
        }
        criado = await self._repo.create(doc)
        await self._notificacao_service.criar(
            usuario_id=data.cliente_id,
            tipo=TipoNotificacao.confirmacao,
            titulo="Agendamento confirmado",
            mensagem="Seu agendamento foi confirmado.",
            agendamento_id=criado["id"],
        )
        return criado

    async def _validar_jornada(
        self, profissional_id: str, inicio: datetime, fim: datetime
    ) -> None:
        intervalos = await self._jornada_service.intervalos_do_dia(
            profissional_id, data_local(inicio)
        )
        if not intervalos:
            return
        dentro = any(ini <= inicio and fim <= f for ini, f in intervalos)
        if not dentro:
            raise ValidationError(
                "Horário fora da jornada de trabalho do profissional."
            )

    async def _validar_conflito(
        self, profissional_id: str, inicio: datetime, fim: datetime
    ) -> None:
        """Rejeita sobreposição de horário do mesmo profissional.

        Dois intervalos [a_inicio, a_fim) e [b_inicio, b_fim) se sobrepõem
        quando a_inicio < b_fim e a_fim > b_inicio. Agendamentos cancelados
        liberam o horário e são ignorados.
        """
        existentes = await self._repo.list({"profissional_id": profissional_id})
        for ag in existentes:
            if ag.get("status") == StatusAgendamento.cancelado.value:
                continue
            if inicio < ag["data_hora_fim"] and fim > ag["data_hora_inicio"]:
                raise ConflictError(
                    "O profissional já possui um agendamento nesse horário."
                )

    async def cancelar(self, agendamento_id: str) -> None:
        """Cancelamento lógico: status -> cancelado (preserva o histórico)."""
        atualizado = await self._mudar_status(
            agendamento_id,
            StatusAgendamento.cancelado,
            {StatusAgendamento.agendado},
        )
        await self._notificacao_service.criar(
            usuario_id=atualizado["cliente_id"],
            tipo=TipoNotificacao.cancelamento,
            titulo="Agendamento cancelado",
            mensagem="Seu agendamento foi cancelado.",
            agendamento_id=agendamento_id,
        )

    async def concluir(self, agendamento_id: str) -> dict[str, Any]:
        """Marca o atendimento como concluído (entra no balanço financeiro)."""
        return await self._mudar_status(
            agendamento_id,
            StatusAgendamento.concluido,
            {StatusAgendamento.agendado},
        )

    async def marcar_no_show(self, agendamento_id: str) -> dict[str, Any]:
        """Cliente não compareceu — registra para histórico/relatórios."""
        return await self._mudar_status(
            agendamento_id,
            StatusAgendamento.no_show,
            {StatusAgendamento.agendado},
        )

    async def _mudar_status(
        self,
        agendamento_id: str,
        novo: StatusAgendamento,
        validos_atuais: set[StatusAgendamento],
    ) -> dict[str, Any]:
        agendamento = await self._repo.get_by_id(agendamento_id)
        if agendamento is None:
            raise NotFoundError("Agendamento não encontrado.")
        atual = agendamento.get("status")
        if atual not in {s.value for s in validos_atuais}:
            raise ValidationError(
                f"Transição de status inválida: '{atual}' → '{novo.value}'."
            )
        return await self._repo.update(agendamento_id, {"status": novo.value})
