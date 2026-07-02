"""Ferramentas de agenda expostas ao agente do WhatsApp.

Toda ação é vinculada ao cliente resolvido pelo telefone (identidade fixada no
servidor). O agente nunca escolhe de quem é a ação — este é o guard rail central
contra prompt injection e acesso a dados de terceiros. As mutações passam pelos
serviços de domínio, que já validam jornada, conflito e double-booking.
"""
from datetime import date, datetime
from typing import Any

from app.core.exceptions import NotFoundError
from app.core.tempo import formatar_local
from app.models.agendamento import AgendamentoCreate, StatusAgendamento
from app.models.usuario import Perfil
from app.services.agendamento_service import AgendamentoService
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService


class AgendaTools:
    def __init__(
        self,
        cliente: dict[str, Any],
        servico_service: ServicoService,
        usuario_service: UsuarioService,
        agendamento_service: AgendamentoService,
        disponibilidade_service: DisponibilidadeService,
    ) -> None:
        self._cliente = cliente
        self._servico_service = servico_service
        self._usuario_service = usuario_service
        self._agendamento_service = agendamento_service
        self._disponibilidade_service = disponibilidade_service

    async def listar_servicos(self) -> list[dict[str, Any]]:
        servicos = await self._servico_service.listar({"ativo": True})
        return [
            {
                "id": s["id"],
                "nome": s["nome"],
                "preco": s["preco"],
                "duracao_minutos": s["duracao_minutos"],
            }
            for s in servicos
        ]

    async def listar_profissionais(self) -> list[dict[str, Any]]:
        profissionais = await self._usuario_service.listar(
            {"perfil": Perfil.profissional.value}
        )
        return [{"id": p["id"], "nome": p["nome"]} for p in profissionais]

    async def consultar_disponibilidade(
        self, profissional_id: str, servico_id: str, dia: str
    ) -> list[str]:
        slots = await self._disponibilidade_service.slots_livres(
            profissional_id, servico_id, date.fromisoformat(dia)
        )
        return [formatar_local(slot["inicio"]) for slot in slots]

    async def criar_agendamento(
        self, profissional_id: str, servico_id: str, data_hora_inicio: str
    ) -> dict[str, Any]:
        criado = await self._agendamento_service.criar(
            AgendamentoCreate(
                cliente_id=self._cliente["id"],
                profissional_id=profissional_id,
                servico_id=servico_id,
                data_hora_inicio=datetime.fromisoformat(data_hora_inicio),
            )
        )
        return {"id": criado["id"], "quando": formatar_local(criado["data_hora_inicio"])}

    async def listar_meus_agendamentos(self) -> list[dict[str, Any]]:
        agendamentos = await self._agendamento_service.listar(
            cliente_id=self._cliente["id"]
        )
        return [
            {
                "id": a["id"],
                "quando": formatar_local(a["data_hora_inicio"]),
                "status": a["status"],
            }
            for a in agendamentos
            if a["status"] == StatusAgendamento.agendado.value
        ]

    async def cancelar_agendamento(self, agendamento_id: str) -> dict[str, Any]:
        await self._garantir_dono(agendamento_id)
        await self._agendamento_service.cancelar(agendamento_id)
        return {"cancelado": True}

    async def reagendar_agendamento(
        self, agendamento_id: str, data_hora_inicio: str
    ) -> dict[str, Any]:
        await self._garantir_dono(agendamento_id)
        atualizado = await self._agendamento_service.reagendar(
            agendamento_id, datetime.fromisoformat(data_hora_inicio)
        )
        return {
            "id": atualizado["id"],
            "quando": formatar_local(atualizado["data_hora_inicio"]),
        }

    async def _garantir_dono(self, agendamento_id: str) -> None:
        agendamento = await self._agendamento_service.buscar(agendamento_id)
        if agendamento["cliente_id"] != self._cliente["id"]:
            raise NotFoundError("Agendamento não encontrado.")
