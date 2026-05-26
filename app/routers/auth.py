"""Endpoints de autenticação."""
from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_auth_service, get_usuario_service
from app.models.auth import LoginRequest, RegisterRequest, TokenResponse
from app.models.usuario import Perfil, UsuarioCreate, UsuarioOut
from app.services.auth_service import AuthService
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Auto-registro de usuário (perfil cliente)",
)
async def register(
    payload: RegisterRequest,
    service: UsuarioService = Depends(get_usuario_service),
):
    usuario = UsuarioCreate(
        nome=payload.nome,
        email=payload.email,
        senha=payload.senha,
        telefone=payload.telefone,
        perfil=Perfil.cliente,
    )
    return await service.criar(usuario)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login — retorna um token JWT",
)
async def login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    token, perfil = await service.autenticar(payload.email, payload.senha)
    return TokenResponse(access_token=token, perfil=perfil)
