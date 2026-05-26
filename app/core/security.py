"""Utilitários de segurança: hash de senha (bcrypt) e tokens JWT (jose).

Usa a lib `bcrypt` diretamente (evita a incompatibilidade conhecida do
passlib com bcrypt >= 4.1).
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))


def criar_access_token(subject: str, perfil: str) -> str:
    """Gera um JWT com o id do usuário (sub), o perfil e expiração."""
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "perfil": perfil, "exp": expira}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decodificar_token(token: str) -> dict:
    """Decodifica e valida o JWT. Lança jose.JWTError se inválido/expirado."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
