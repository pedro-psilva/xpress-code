"""Endpoints REST da jornada de trabalho do profissional."""
from fastapi import APIRouter, Depends

from app.core.auth import require_admin, require_staff
from app.core.dependencies import get_jornada_service
from app.core.exceptions import NotFoundError
from app.models.jornada import JornadaOut, JornadaUpsert
from app.services.jornada_service import JornadaService

router = APIRouter(prefix="/profissionais", tags=["jornadas"])


@router.put(
    "/{profissional_id}/jornada",
    response_model=JornadaOut,
    dependencies=[Depends(require_admin)],
    summary="Define a jornada de trabalho do profissional",
)
async def definir(
    profissional_id: str,
    payload: JornadaUpsert,
    service: JornadaService = Depends(get_jornada_service),
):
    return await service.definir(profissional_id, payload.blocos)


@router.get(
    "/{profissional_id}/jornada",
    response_model=JornadaOut,
    dependencies=[Depends(require_staff)],
    summary="Consulta a jornada de trabalho do profissional",
)
async def obter(
    profissional_id: str,
    service: JornadaService = Depends(get_jornada_service),
):
    jornada = await service.obter(profissional_id)
    if jornada is None:
        raise NotFoundError("Jornada não definida para este profissional.")
    return jornada
