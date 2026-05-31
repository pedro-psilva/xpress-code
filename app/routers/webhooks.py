from typing import Any

from fastapi import APIRouter, Depends

from app.core.dependencies import get_assinatura_service
from app.services.assinatura_service import AssinaturaService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post(
    "/infinitepay",
    summary="Recebe confirmacao de pagamento da InfinitePay (publico)",
)
async def infinitepay(
    payload: dict[str, Any],
    service: AssinaturaService = Depends(get_assinatura_service),
):
    await service.processar_webhook_pagamento(payload)
    return {"ok": True}
