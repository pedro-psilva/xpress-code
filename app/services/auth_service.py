"""Regras de negócio de autenticação."""
from jose import JWTError

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    criar_access_token,
    criar_refresh_token,
    criar_reset_token,
    decodificar_token,
    hash_senha,
    verificar_senha,
)
from app.repositories.base import AbstractRepository
from app.services.notification_service import NotificationService


class AuthService:
    def __init__(
        self, repository: AbstractRepository, notification_service: NotificationService
    ) -> None:
        self._repo = repository
        self._notification = notification_service

    async def autenticar(self, email: str, senha: str) -> tuple[str, str, str]:
        usuarios = await self._repo.list({"email": email})
        if not usuarios or not verificar_senha(senha, usuarios[0]["senha_hash"]):
            raise UnauthorizedError("E-mail ou senha inválidos.")
        usuario = usuarios[0]
        access = criar_access_token(subject=usuario["id"], perfil=usuario["perfil"])
        refresh = criar_refresh_token(subject=usuario["id"])
        return access, refresh, usuario["perfil"]

    async def renovar(self, refresh_token: str) -> str:
        payload = self._decodificar(refresh_token, "refresh")
        usuario = await self._repo.get_by_id(payload["sub"])
        if usuario is None:
            raise UnauthorizedError("Token inválido ou expirado.")
        return criar_access_token(subject=usuario["id"], perfil=usuario["perfil"])

    async def solicitar_reset(self, email: str) -> None:
        usuarios = await self._repo.list({"email": email})
        if not usuarios:
            return
        usuario = usuarios[0]
        await self._notification.enviar_reset_senha(
            usuario, criar_reset_token(subject=usuario["id"])
        )

    async def redefinir_senha(self, token: str, nova_senha: str) -> None:
        payload = self._decodificar(token, "reset")
        atualizado = await self._repo.update(
            payload["sub"], {"senha_hash": hash_senha(nova_senha)}
        )
        if atualizado is None:
            raise UnauthorizedError("Token inválido ou expirado.")

    def _decodificar(self, token: str, tipo: str) -> dict:
        try:
            payload = decodificar_token(token)
        except JWTError:
            raise UnauthorizedError("Token inválido ou expirado.")
        if payload.get("type") != tipo:
            raise UnauthorizedError("Token inválido ou expirado.")
        return payload
