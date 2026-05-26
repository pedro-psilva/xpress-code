"""Schemas da entidade Usuário."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class Perfil(str, Enum):
    admin = "admin"
    profissional = "profissional"
    cliente = "cliente"


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=1, examples=["João da Silva"])
    email: EmailStr = Field(..., examples=["joao@exemplo.com"])
    telefone: str | None = Field(default=None, examples=["+55 31 90000-0000"])
    perfil: Perfil = Field(default=Perfil.cliente)


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6, examples=["senha123"])


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1)
    email: EmailStr | None = None
    telefone: str | None = None
    perfil: Perfil | None = None
    senha: str | None = Field(default=None, min_length=6)


class UsuarioOut(UsuarioBase):
    """Resposta pública — nunca expõe o hash da senha."""

    id: str = Field(..., examples=["665f1b2c4a3e2f0012345678"])
    criado_em: datetime
