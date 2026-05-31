from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class StatusAssinatura(str, Enum):
    ativa = "ativa"
    pendente = "pendente"
    inativa = "inativa"


class AssinaturaBase(BaseModel):
    cliente_id: str = Field(..., min_length=1)
    plano_id: str = Field(..., min_length=1)
    inclui_barba: bool = False
    status: StatusAssinatura = StatusAssinatura.ativa


class AssinaturaCreate(AssinaturaBase):
    pass


class AssinaturaStatusUpdate(BaseModel):
    status: StatusAssinatura


class AssinaturaOut(AssinaturaBase):
    id: str
    proxima_cobranca: datetime | None = None
    ultima_cobranca: datetime | None = None
    ultimo_link_pagamento: str | None = None


class CobrancaResponse(BaseModel):
    link: str
    enviado_email: bool
    enviado_whatsapp: bool
