"""Regras de negócio de autenticação."""
from typing import Any

from app.core.exceptions import UnauthorizedError
from app.core.security import criar_access_token, verificar_senha
from app.repositories.base import AbstractRepository


class AuthService:
    def __init__(self, repository: AbstractRepository) -> None:
        self._repo = repository

    async def autenticar(self, email: str, senha: str) -> tuple[str, str]:
        """Valida as credenciais e devolve (access_token, perfil)."""
        usuarios = await self._repo.list({"email": email})
        if not usuarios or not verificar_senha(senha, usuarios[0]["senha_hash"]):
            raise UnauthorizedError("E-mail ou senha inválidos.")
        usuario = usuarios[0]
        token = criar_access_token(subject=usuario["id"], perfil=usuario["perfil"])
        return token, usuario["perfil"]
