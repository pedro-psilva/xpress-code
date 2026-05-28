"""Endpoints de integração WhatsApp via Evolution API.

O /webhook é o único endpoint público — recebe as mensagens entregues
pela Evolution. Os demais (status/connect/desconectar) são restritos a admin.
"""
from fastapi import APIRouter, Depends, status

from app.core.auth import require_admin
from app.core.dependencies import get_whatsapp_service
from app.models.whatsapp import ConnectResponse, InstanciaStatus, WebhookPayload
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.get(
    "/instance/status",
    response_model=InstanciaStatus,
    summary="Status atual da instância WhatsApp",
    dependencies=[Depends(require_admin)],
)
async def status_instancia(service: WhatsAppService = Depends(get_whatsapp_service)):
    return await service.status_instancia()


@router.post(
    "/instance/connect",
    response_model=ConnectResponse,
    summary="Cria/conecta a instância e devolve o QR code para parear",
    dependencies=[Depends(require_admin)],
)
async def conectar_instancia(service: WhatsAppService = Depends(get_whatsapp_service)):
    return await service.conectar_instancia()


@router.delete(
    "/instance",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desconecta a instância (logout)",
    dependencies=[Depends(require_admin)],
)
async def desconectar_instancia(service: WhatsAppService = Depends(get_whatsapp_service)):
    await service.desconectar_instancia()


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Recebe eventos da Evolution API (sem autenticação)",
)
async def webhook(
    payload: WebhookPayload,
    service: WhatsAppService = Depends(get_whatsapp_service),
):
    await service.processar_webhook(payload.model_dump())
    return {"ok": True}
