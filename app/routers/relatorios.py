"""Endpoints de relatórios gerenciais (admin)."""
from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.auth import require_admin
from app.core.dependencies import get_relatorio_service
from app.models.relatorio import RelatorioResumo
from app.services.relatorio_service import RelatorioService

router = APIRouter(
    prefix="/relatorios",
    tags=["relatorios"],
    dependencies=[Depends(require_admin)],
)


@router.get(
    "/resumo",
    response_model=RelatorioResumo,
    summary="Resumo de faturamento e no-show no período",
)
async def resumo(
    inicio: date = Query(..., description="Dia inicial (YYYY-MM-DD)"),
    fim: date = Query(..., description="Dia final (YYYY-MM-DD)"),
    service: RelatorioService = Depends(get_relatorio_service),
):
    return await service.resumo(inicio, fim)
