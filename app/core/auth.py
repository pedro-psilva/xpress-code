"""Dependências de autenticação e autorização (RBAC).

`get_current_user` valida o JWT do header Authorization: Bearer <token>.
`require_admin` restringe a rota ao perfil admin.
"""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decodificar_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise UnauthorizedError("Token de acesso ausente.")
    try:
        payload = decodificar_token(credentials.credentials)
    except JWTError:
        raise UnauthorizedError("Token inválido ou expirado.")
    return {"id": payload.get("sub"), "perfil": payload.get("perfil")}


def require_admin(usuario: dict = Depends(get_current_user)) -> dict:
    if usuario.get("perfil") != "admin":
        raise ForbiddenError("Acesso restrito a administradores.")
    return usuario


def require_staff(usuario: dict = Depends(get_current_user)) -> dict:
    if usuario.get("perfil") not in {"admin", "profissional"}:
        raise ForbiddenError("Acesso restrito a equipe da barbearia.")
    return usuario
