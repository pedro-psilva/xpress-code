"""Agenda self-service do cliente — prefixo `/me` (P2-15).

Superfície voltada ao próprio cliente autenticado (qualquer perfil serve; o caso
de uso é o perfil `cliente`). Diferente de `/agendamentos` (equipe), aqui a
identidade é fixada pelo token: o cliente só enxerga e mexe nos próprios
agendamentos, e nunca informa `cliente_id`. O backend deste router é o que
destrava o booking self-service no app (frontend).
"""
from datetime import date

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import get_current_user
from app.core.dependencies import get_minha_agenda_service
from app.models.agendamento import (
    AgendamentoClienteCreate,
    AgendamentoOut,
    AgendamentoReagendar,
)
from app.models.disponibilidade import SlotDisponivel
from app.models.servico import ServicoOut
from app.models.usuario import ProfissionalPublico
from app.services.minha_agenda_service import MinhaAgendaService

router = APIRouter(
    prefix="/me",
    tags=["minha-agenda"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/servicos",
    response_model=list[ServicoOut],
    summary="Catálogo de serviços ativos disponíveis para agendar",
)
async def listar_servicos(
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.listar_servicos()


@router.get(
    "/profissionais",
    response_model=list[ProfissionalPublico],
    summary="Lista os profissionais (id e nome) para o cliente escolher",
)
async def listar_profissionais(
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.listar_profissionais()


@router.get(
    "/disponibilidade",
    response_model=list[SlotDisponivel],
    summary="Horários livres de um profissional para um serviço num dia",
)
async def disponibilidade(
    profissional_id: str = Query(...),
    servico_id: str = Query(...),
    dia: date = Query(..., description="Dia local (YYYY-MM-DD)"),
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.consultar_disponibilidade(profissional_id, servico_id, dia)


@router.get(
    "/agendamentos",
    response_model=list[AgendamentoOut],
    summary="Lista os meus agendamentos (mais recentes primeiro)",
)
async def meus_agendamentos(
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.listar_agendamentos()


@router.post(
    "/agendamentos",
    response_model=AgendamentoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Agenda para mim mesmo (cliente fixado pelo token)",
)
async def agendar(
    payload: AgendamentoClienteCreate,
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.criar(
        payload.profissional_id, payload.servico_id, payload.data_hora_inicio
    )


@router.post(
    "/agendamentos/{agendamento_id}/reagendar",
    response_model=AgendamentoOut,
    summary="Reagenda um agendamento meu",
)
async def reagendar(
    agendamento_id: str,
    payload: AgendamentoReagendar,
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    return await service.reagendar(agendamento_id, payload.data_hora_inicio)


@router.delete(
    "/agendamentos/{agendamento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancela um agendamento meu",
)
async def cancelar(
    agendamento_id: str,
    service: MinhaAgendaService = Depends(get_minha_agenda_service),
):
    await service.cancelar(agendamento_id)
