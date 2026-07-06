"""Utilitários de segurança: hash de senha (bcrypt) e tokens JWT (jose).

Usa a lib `bcrypt` diretamente (evita a incompatibilidade conhecida do
passlib com bcrypt >= 4.1).
"""
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))


def _assinar(claims: dict, minutos: int) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    payload = {**claims, "exp": expira}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def criar_access_token(subject: str, perfil: str) -> str:
    return _assinar(
        {"sub": subject, "perfil": perfil, "type": "access"},
        settings.jwt_expire_minutes,
    )


def criar_refresh_token(subject: str, version: int = 0) -> str:
    return _assinar(
        {"sub": subject, "type": "refresh", "ver": version},
        settings.refresh_expire_minutes,
    )


def criar_reset_token(subject: str, jti: str) -> str:
    return _assinar(
        {"sub": subject, "type": "reset", "jti": jti},
        settings.reset_expire_minutes,
    )


def gerar_jti() -> str:
    return secrets.token_urlsafe(16)


def decodificar_token(token: str) -> dict:
    """Decodifica e valida o JWT. Lança jose.JWTError se inválido/expirado."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
