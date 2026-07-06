"""Endpoints de autenticação."""
from fastapi import APIRouter, Depends, Request, status

from app.core.auth import get_current_user
from app.core.dependencies import get_auth_service
from app.core.rate_limit import limiter
from app.models.auth import (
    AccessTokenResponse,
    EsqueciSenhaRequest,
    LoginRequest,
    RedefinirSenhaRequest,
    RefreshRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login — retorna um token JWT",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    access, refresh, perfil = await service.autenticar(payload.email, payload.senha)
    return TokenResponse(access_token=access, refresh_token=refresh, perfil=perfil)


@router.post(
    "/refresh",
    response_model=AccessTokenResponse,
    summary="Renova o access token a partir do refresh token",
)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    payload: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
):
    return AccessTokenResponse(access_token=await service.renovar(payload.refresh_token))


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoga os refresh tokens ativos do usuário (logout)",
)
async def logout(
    usuario: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(usuario["id"])


@router.post(
    "/esqueci-senha",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Solicita redefinição de senha (envia e-mail se a conta existir)",
)
@limiter.limit("5/minute")
async def esqueci_senha(
    request: Request,
    payload: EsqueciSenhaRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.solicitar_reset(payload.email)


@router.post(
    "/redefinir-senha",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Redefine a senha usando o token recebido por e-mail",
)
@limiter.limit("5/minute")
async def redefinir_senha(
    request: Request,
    payload: RedefinirSenhaRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.redefinir_senha(payload.token, payload.nova_senha)
