"""Schemas da entidade Usuário."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class Perfil(str, Enum):
    admin = "admin"
    profissional = "profissional"
    cliente = "cliente"


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=120, examples=["João da Silva"])
    email: EmailStr = Field(..., max_length=254, examples=["joao@exemplo.com"])
    telefone: str | None = Field(default=None, max_length=30, examples=["+55 31 90000-0000"])
    perfil: Perfil = Field(default=Perfil.cliente)


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6, max_length=128, examples=["senha123"])


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = Field(default=None, max_length=254)
    telefone: str | None = Field(default=None, max_length=30)
    perfil: Perfil | None = None
    senha: str | None = Field(default=None, min_length=6, max_length=128)


class UsuarioOut(UsuarioBase):
    """Resposta pública — nunca expõe o hash da senha."""

    id: str = Field(..., examples=["665f1b2c4a3e2f0012345678"])
    criado_em: datetime
