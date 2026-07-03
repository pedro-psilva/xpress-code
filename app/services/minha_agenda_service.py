"""Agenda self-service do cliente (P2-15).

Camada de domínio que expõe ao próprio cliente (perfil `cliente`, autenticado)
o catálogo, a disponibilidade e o CRUD dos *seus* agendamentos. A identidade é
fixada no servidor: toda operação usa o `cliente_id` vindo do token, nunca um id
escolhido pelo chamador. É o mesmo guard rail de `AgendaTools` (bot do WhatsApp),
só que servindo a API HTTP — as mutações passam pelos serviços de domínio, que já
validam jornada, conflito e double-booking.
"""
from datetime import date, datetime
from typing import Any

from app.core.exceptions import NotFoundError
from app.models.agendamento import AgendamentoCreate
from app.models.usuario import Perfil
from app.services.agendamento_service import AgendamentoService
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService


class MinhaAgendaService:
    def __init__(
        self,
        cliente_id: str,
        servico_service: ServicoService,
        usuario_service: UsuarioService,
        agendamento_service: AgendamentoService,
        disponibilidade_service: DisponibilidadeService,
    ) -> None:
        self._cliente_id = cliente_id
        self._servico_service = servico_service
        self._usuario_service = usuario_service
        self._agendamento_service = agendamento_service
        self._disponibilidade_service = disponibilidade_service

    async def listar_servicos(self) -> list[dict[str, Any]]:
        """Catálogo de serviços ativos (só o que o cliente pode contratar)."""
        return await self._servico_service.listar({"ativo": True})

    async def listar_profissionais(self) -> list[dict[str, Any]]:
        profissionais = await self._usuario_service.listar(
            {"perfil": Perfil.profissional.value}
        )
        return [{"id": p["id"], "nome": p["nome"]} for p in profissionais]

    async def consultar_disponibilidade(
        self, profissional_id: str, servico_id: str, dia: date
    ) -> list[dict[str, Any]]:
        return await self._disponibilidade_service.slots_livres(
            profissional_id, servico_id, dia
        )

    async def listar_agendamentos(self) -> list[dict[str, Any]]:
        """Só os agendamentos do próprio cliente, mais recentes primeiro."""
        agendamentos = await self._agendamento_service.listar(
            cliente_id=self._cliente_id
        )
        return sorted(
            agendamentos, key=lambda a: a["data_hora_inicio"], reverse=True
        )

    async def criar(
        self, profissional_id: str, servico_id: str, data_hora_inicio: datetime
    ) -> dict[str, Any]:
        return await self._agendamento_service.criar(
            AgendamentoCreate(
                cliente_id=self._cliente_id,
                profissional_id=profissional_id,
                servico_id=servico_id,
                data_hora_inicio=data_hora_inicio,
            )
        )

    async def reagendar(
        self, agendamento_id: str, data_hora_inicio: datetime
    ) -> dict[str, Any]:
        await self._garantir_dono(agendamento_id)
        return await self._agendamento_service.reagendar(
            agendamento_id, data_hora_inicio
        )

    async def cancelar(self, agendamento_id: str) -> None:
        await self._garantir_dono(agendamento_id)
        await self._agendamento_service.cancelar(agendamento_id)

    async def _garantir_dono(self, agendamento_id: str) -> None:
        """Bloqueia IDOR: agendamento de outro cliente é 'inexistente' para este.

        Devolver NotFound (e não Forbidden) evita confirmar a existência do
        recurso a quem não é dono.
        """
        agendamento = await self._agendamento_service.buscar(agendamento_id)
        if agendamento["cliente_id"] != self._cliente_id:
            raise NotFoundError("Agendamento não encontrado.")
