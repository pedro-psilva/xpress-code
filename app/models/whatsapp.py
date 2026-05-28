from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class StatusConexao(str, Enum):
    desconectado = "close"
    conectando = "connecting"
    conectado = "open"


class InstanciaStatus(BaseModel):
    instancia: str
    estado: StatusConexao
    configurado: bool = Field(
        description="True se a integração tem credenciais no backend (.env)."
    )
    numero: str | None = None


class ConnectResponse(BaseModel):
    estado: StatusConexao
    qrcode_base64: str | None = Field(
        default=None,
        description="Data URI (image/png;base64,...) para renderizar o QR no app.",
    )


class WebhookPayload(BaseModel):
    """Recebido em /whatsapp/webhook a partir do Evolution. Apenas o que usamos."""

    event: str | None = None
    instance: str | None = None
    data: dict[str, Any] | None = None
