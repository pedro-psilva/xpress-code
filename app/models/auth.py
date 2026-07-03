"""Schemas de autenticação."""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=254, examples=["admin@xpress.com"])
    senha: str = Field(..., max_length=128, examples=["admin123"])


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    perfil: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class EsqueciSenhaRequest(BaseModel):
    email: EmailStr = Field(..., max_length=254)


class RedefinirSenhaRequest(BaseModel):
    token: str
    nova_senha: str = Field(..., min_length=6, max_length=128)
