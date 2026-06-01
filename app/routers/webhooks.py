from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.core.dependencies import get_assinatura_service
from app.services.assinatura_service import AssinaturaService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post(
    "/infinitepay",
    summary="Recebe confirmacao de pagamento da InfinitePay (publico, com token)",
)
async def infinitepay(
    payload: dict[str, Any],
    token: str | None = Query(default=None),
    service: AssinaturaService = Depends(get_assinatura_service),
):
    esperado = settings.infinitepay_webhook_token
    if esperado and token != esperado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Token invalido."
        )
    await service.processar_webhook_pagamento(payload)
    return {"ok": True}
