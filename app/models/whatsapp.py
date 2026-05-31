from typing import Any

from pydantic import BaseModel, Field


class IntegracaoStatus(BaseModel):
    configurado: bool
    numero: str | None = None
    nome_verificado: str | None = None
    valido: bool = False


class WebhookPayload(BaseModel):
    object: str | None = None
    entry: list[dict[str, Any]] = Field(default_factory=list)
