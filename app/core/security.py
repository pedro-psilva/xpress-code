"""Utilitários de segurança de senha (bcrypt).

Usa a lib `bcrypt` diretamente (evita a incompatibilidade conhecida do
passlib com bcrypt >= 4.1). A geração/verificação de JWT chega no M2.
"""
import bcrypt


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
