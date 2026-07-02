"""Disparo de lembretes de agendamento (para cron externo)."""
import hmac

from fastapi import APIRouter, Depends, Header, Query

from app.core.config import settings
from app.core.dependencies import get_lembrete_service
from app.core.exceptions import DomainError, UnauthorizedError
from app.services.lembrete_service import LembreteService

router = APIRouter(prefix="/lembretes", tags=["lembretes"])


@router.post("/processar", summary="Envia lembretes dos agendamentos próximos")
async def processar(
    antecedencia_horas: int = Query(24, ge=1, le=168),
    x_cron_token: str | None = Header(default=None),
    service: LembreteService = Depends(get_lembrete_service),
):
    if not settings.cron_token:
        raise DomainError(
            "Lembretes não configurados (defina CRON_TOKEN).", status_code=503
        )
    if x_cron_token is None or not hmac.compare_digest(
        x_cron_token, settings.cron_token
    ):
        raise UnauthorizedError("Token de cron inválido.")
    enviados = await service.processar(antecedencia_horas)
    return {"enviados": enviados}
