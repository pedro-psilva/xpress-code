from fastapi import APIRouter, Depends, status

from app.core.auth import require_admin
from app.core.dependencies import get_plano_service
from app.models.plano import PlanoCreate, PlanoOut
from app.services.plano_service import PlanoService

router = APIRouter(prefix="/planos", tags=["planos"])


@router.get("", response_model=list[PlanoOut], summary="Lista todos os planos do clube")
async def listar(service: PlanoService = Depends(get_plano_service)):
    return await service.listar()


@router.get("/{plano_id}", response_model=PlanoOut, summary="Busca um plano por ID")
async def buscar(plano_id: str, service: PlanoService = Depends(get_plano_service)):
    return await service.buscar(plano_id)


@router.post(
    "",
    response_model=PlanoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um novo plano (admin)",
    dependencies=[Depends(require_admin)],
)
async def criar(
    payload: PlanoCreate, service: PlanoService = Depends(get_plano_service)
):
    return await service.criar(payload)


@router.put(
    "/{plano_id}",
    response_model=PlanoOut,
    summary="Atualiza um plano integral (admin)",
    dependencies=[Depends(require_admin)],
)
async def atualizar(
    plano_id: str,
    payload: PlanoCreate,
    service: PlanoService = Depends(get_plano_service),
):
    return await service.atualizar(plano_id, payload)


@router.delete(
    "/{plano_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativa um plano — remoção lógica (admin)",
    dependencies=[Depends(require_admin)],
)
async def remover(plano_id: str, service: PlanoService = Depends(get_plano_service)):
    await service.desativar(plano_id)
