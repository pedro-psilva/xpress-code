"""Endpoint de disponibilidade: horários livres por profissional/serviço/dia."""
from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.auth import require_staff
from app.core.dependencies import get_disponibilidade_service
from app.models.disponibilidade import SlotDisponivel
from app.services.disponibilidade_service import DisponibilidadeService

router = APIRouter(
    prefix="/disponibilidade",
    tags=["disponibilidade"],
    dependencies=[Depends(require_staff)],
)


@router.get(
    "",
    response_model=list[SlotDisponivel],
    summary="Lista horários livres de um profissional para um serviço num dia",
)
async def listar(
    profissional_id: str = Query(...),
    servico_id: str = Query(...),
    dia: date = Query(..., description="Dia local (YYYY-MM-DD)"),
    service: DisponibilidadeService = Depends(get_disponibilidade_service),
):
    return await service.slots_livres(profissional_id, servico_id, dia)
