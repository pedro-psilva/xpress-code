from fastapi import APIRouter, Depends, status

from app.core.auth import require_admin, require_staff
from app.core.dependencies import get_assinatura_service
from app.models.assinatura import (
    AssinaturaCreate,
    AssinaturaOut,
    AssinaturaStatusUpdate,
    CobrancaResponse,
)
from app.services.assinatura_service import AssinaturaService

router = APIRouter(prefix="/assinaturas", tags=["assinaturas"])


@router.get(
    "",
    response_model=list[AssinaturaOut],
    summary="Lista todas as assinaturas (equipe)",
    dependencies=[Depends(require_staff)],
)
async def listar(service: AssinaturaService = Depends(get_assinatura_service)):
    return await service.listar()


@router.get(
    "/{assinatura_id}",
    response_model=AssinaturaOut,
    summary="Busca uma assinatura por ID (equipe)",
    dependencies=[Depends(require_staff)],
)
async def buscar(
    assinatura_id: str,
    service: AssinaturaService = Depends(get_assinatura_service),
):
    return await service.buscar(assinatura_id)


@router.post(
    "",
    response_model=AssinaturaOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma assinatura (admin)",
    dependencies=[Depends(require_admin)],
)
async def criar(
    payload: AssinaturaCreate,
    service: AssinaturaService = Depends(get_assinatura_service),
):
    return await service.criar(payload)


@router.patch(
    "/{assinatura_id}/status",
    response_model=AssinaturaOut,
    summary="Altera o status da assinatura (admin)",
    dependencies=[Depends(require_admin)],
)
async def atualizar_status(
    assinatura_id: str,
    payload: AssinaturaStatusUpdate,
    service: AssinaturaService = Depends(get_assinatura_service),
):
    return await service.atualizar_status(assinatura_id, payload.status)


@router.delete(
    "/{assinatura_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma assinatura (admin)",
    dependencies=[Depends(require_admin)],
)
async def remover(
    assinatura_id: str,
    service: AssinaturaService = Depends(get_assinatura_service),
):
    await service.remover(assinatura_id)


@router.post(
    "/{assinatura_id}/cobranca",
    response_model=CobrancaResponse,
    summary="Gera um link de cobranca e envia por email/WhatsApp (admin)",
    dependencies=[Depends(require_admin)],
)
async def gerar_cobranca(
    assinatura_id: str,
    service: AssinaturaService = Depends(get_assinatura_service),
):
    return await service.gerar_cobranca(assinatura_id)
