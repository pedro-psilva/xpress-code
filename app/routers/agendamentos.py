"""Endpoints REST de Agendamentos."""
from datetime import date

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import require_staff
from app.core.dependencies import get_agendamento_service
from app.models.agendamento import AgendamentoCreate, AgendamentoOut
from app.services.agendamento_service import AgendamentoService

router = APIRouter(
    prefix="/agendamentos",
    tags=["agendamentos"],
    dependencies=[Depends(require_staff)],
)


@router.get(
    "",
    response_model=list[AgendamentoOut],
    summary="Lista agendamentos (com filtros opcionais)",
)
async def listar(
    cliente_id: str | None = Query(default=None),
    profissional_id: str | None = Query(default=None),
    data: date | None = Query(default=None, description="Filtra pelo dia (YYYY-MM-DD)"),
    service: AgendamentoService = Depends(get_agendamento_service),
):
    return await service.listar(cliente_id, profissional_id, data)


@router.get(
    "/{agendamento_id}",
    response_model=AgendamentoOut,
    summary="Busca um agendamento por ID",
)
async def buscar(
    agendamento_id: str,
    service: AgendamentoService = Depends(get_agendamento_service),
):
    return await service.buscar(agendamento_id)


@router.post(
    "",
    response_model=AgendamentoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um agendamento",
)
async def criar(
    payload: AgendamentoCreate,
    service: AgendamentoService = Depends(get_agendamento_service),
):
    return await service.criar(payload)


@router.delete(
    "/{agendamento_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancela um agendamento",
)
async def cancelar(
    agendamento_id: str,
    service: AgendamentoService = Depends(get_agendamento_service),
):
    await service.cancelar(agendamento_id)


@router.post(
    "/{agendamento_id}/concluir",
    response_model=AgendamentoOut,
    summary="Marca o atendimento como concluído (entra no balanço)",
)
async def concluir(
    agendamento_id: str,
    service: AgendamentoService = Depends(get_agendamento_service),
):
    return await service.concluir(agendamento_id)


@router.post(
    "/{agendamento_id}/no-show",
    response_model=AgendamentoOut,
    summary="Registra que o cliente não compareceu",
)
async def no_show(
    agendamento_id: str,
    service: AgendamentoService = Depends(get_agendamento_service),
):
    return await service.marcar_no_show(agendamento_id)
