"""Endpoints das notificações in-app do usuário logado."""
from fastapi import APIRouter, Depends, Query, status

from app.core.auth import get_current_user
from app.core.dependencies import get_notificacao_service
from app.models.notificacao import NotificacaoOut
from app.services.notificacao_service import NotificacaoService

router = APIRouter(prefix="/notificacoes", tags=["notificacoes"])


@router.get(
    "",
    response_model=list[NotificacaoOut],
    summary="Lista as notificações do usuário logado",
)
async def listar(
    apenas_nao_lidas: bool = Query(False),
    limite: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(get_current_user),
    service: NotificacaoService = Depends(get_notificacao_service),
):
    return await service.listar(
        usuario["id"], apenas_nao_lidas, skip=offset, limit=limite
    )


@router.get(
    "/nao-lidas/contagem",
    summary="Conta as notificações não lidas (badge)",
)
async def contagem(
    usuario: dict = Depends(get_current_user),
    service: NotificacaoService = Depends(get_notificacao_service),
):
    return {"nao_lidas": await service.contar_nao_lidas(usuario["id"])}


@router.post(
    "/{notificacao_id}/lida",
    response_model=NotificacaoOut,
    summary="Marca uma notificação como lida",
)
async def marcar_lida(
    notificacao_id: str,
    usuario: dict = Depends(get_current_user),
    service: NotificacaoService = Depends(get_notificacao_service),
):
    return await service.marcar_lida(notificacao_id, usuario["id"])


@router.post(
    "/lidas",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Marca todas as notificações como lidas",
)
async def marcar_todas(
    usuario: dict = Depends(get_current_user),
    service: NotificacaoService = Depends(get_notificacao_service),
):
    await service.marcar_todas_lidas(usuario["id"])
