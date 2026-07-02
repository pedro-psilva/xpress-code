"""Schemas de notificação in-app."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class TipoNotificacao(str, Enum):
    confirmacao = "confirmacao"
    lembrete = "lembrete"
    cancelamento = "cancelamento"
    reagendamento = "reagendamento"


class NotificacaoOut(BaseModel):
    id: str
    usuario_id: str
    tipo: TipoNotificacao
    titulo: str
    mensagem: str
    lida: bool
    criado_em: datetime
    agendamento_id: str | None = None
