"""Schemas da entidade Serviço."""
from pydantic import BaseModel, Field


class ServicoBase(BaseModel):
    nome: str = Field(..., min_length=1, examples=["Corte masculino"])
    preco: float = Field(..., ge=0, examples=[45.0])
    duracao_minutos: int = Field(..., gt=0, examples=[30])
    ativo: bool = Field(default=True)


class ServicoCreate(ServicoBase):
    """Corpo para criação (POST) e atualização integral (PUT)."""


class ServicoOut(ServicoBase):
    id: str = Field(..., examples=["665f1b2c4a3e2f0012345678"])
