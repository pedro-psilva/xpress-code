"""Endpoints REST de Serviços."""
from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_servico_service
from app.models.servico import ServicoCreate, ServicoOut
from app.services.servico_service import ServicoService

router = APIRouter(prefix="/servicos", tags=["servicos"])


@router.get("", response_model=list[ServicoOut], summary="Lista todos os serviços")
async def listar(service: ServicoService = Depends(get_servico_service)):
    return await service.listar()


@router.get("/{servico_id}", response_model=ServicoOut, summary="Busca um serviço por ID")
async def buscar(servico_id: str, service: ServicoService = Depends(get_servico_service)):
    return await service.buscar(servico_id)


@router.post(
    "",
    response_model=ServicoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um novo serviço",
)
async def criar(
    payload: ServicoCreate, service: ServicoService = Depends(get_servico_service)
):
    return await service.criar(payload)


@router.put("/{servico_id}", response_model=ServicoOut, summary="Atualiza um serviço (integral)")
async def atualizar(
    servico_id: str,
    payload: ServicoCreate,
    service: ServicoService = Depends(get_servico_service),
):
    return await service.atualizar(servico_id, payload)


@router.delete(
    "/{servico_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativa um serviço (remoção lógica)",
)
async def remover(servico_id: str, service: ServicoService = Depends(get_servico_service)):
    await service.desativar(servico_id)
