"""Schemas de autenticação."""
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Auto-registro — cria sempre um usuário com perfil 'cliente'."""

    nome: str = Field(..., min_length=1, examples=["João da Silva"])
    email: EmailStr = Field(..., examples=["joao@exemplo.com"])
    senha: str = Field(..., min_length=6, examples=["senha123"])
    telefone: str | None = Field(default=None, examples=["+55 31 90000-0000"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["admin@xpress.com"])
    senha: str = Field(..., examples=["admin123"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    perfil: str
