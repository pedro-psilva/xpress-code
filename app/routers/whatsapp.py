import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi import status as http_status
from fastapi.responses import PlainTextResponse, Response

from app.core.auth import require_admin
from app.core.config import settings
from app.core.dependencies import get_whatsapp_service
from app.models.whatsapp import IntegracaoStatus
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.get(
    "/status",
    response_model=IntegracaoStatus,
    summary="Status da integração com a WhatsApp Cloud API",
    dependencies=[Depends(require_admin)],
)
async def status(service: WhatsAppService = Depends(get_whatsapp_service)):
    return await service.status()


@router.get(
    "/webhook",
    summary="Handshake de verificação do webhook (Meta)",
    response_class=PlainTextResponse,
)
async def verificar_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode != "subscribe" or hub_verify_token != settings.meta_webhook_verify_token:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Verify token inválido.")
    return PlainTextResponse(hub_challenge)


@router.post(
    "/webhook",
    summary="Recebe eventos da Cloud API",
    status_code=http_status.HTTP_200_OK,
)
async def webhook(
    request: Request,
    service: WhatsAppService = Depends(get_whatsapp_service),
):
    corpo = await request.body()
    assinatura = request.headers.get("x-hub-signature-256")
    if not _assinatura_valida(corpo, assinatura):
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Assinatura inválida.")
    try:
        payload = json.loads(corpo or b"{}")
    except json.JSONDecodeError:
        return Response(status_code=http_status.HTTP_204_NO_CONTENT)
    await service.processar_webhook(payload)
    return {"ok": True}


def _assinatura_valida(corpo: bytes, assinatura: str | None) -> bool:
    segredo = settings.meta_app_secret
    if not segredo:
        return True
    if not assinatura or not assinatura.startswith("sha256="):
        return False
    esperado = hmac.new(segredo.encode(), corpo, hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperado, assinatura.removeprefix("sha256="))
