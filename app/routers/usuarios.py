"""Endpoints REST de Usuários."""
from fastapi import APIRouter, Depends, status

from app.core.auth import get_current_user, require_admin
from app.core.dependencies import get_usuario_service
from app.models.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get(
    "",
    response_model=list[UsuarioOut],
    summary="Lista todos os usuários (autenticado)",
    dependencies=[Depends(get_current_user)],
)
async def listar(service: UsuarioService = Depends(get_usuario_service)):
    return await service.listar()


@router.get(
    "/{usuario_id}",
    response_model=UsuarioOut,
    summary="Busca um usuário por ID (autenticado)",
    dependencies=[Depends(get_current_user)],
)
async def buscar(usuario_id: str, service: UsuarioService = Depends(get_usuario_service)):
    return await service.buscar(usuario_id)


@router.post(
    "",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um novo usuário (admin)",
    dependencies=[Depends(require_admin)],
)
async def criar(
    payload: UsuarioCreate, service: UsuarioService = Depends(get_usuario_service)
):
    return await service.criar(payload)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioOut,
    summary="Atualiza um usuário (admin)",
    dependencies=[Depends(require_admin)],
)
async def atualizar(
    usuario_id: str,
    payload: UsuarioUpdate,
    service: UsuarioService = Depends(get_usuario_service),
):
    return await service.atualizar(usuario_id, payload)


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove um usuário (admin)",
    dependencies=[Depends(require_admin)],
)
async def remover(usuario_id: str, service: UsuarioService = Depends(get_usuario_service)):
    await service.remover(usuario_id)
