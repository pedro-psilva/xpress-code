"""Schemas da entidade Agendamento.

É a entidade que relaciona cliente, profissional e serviço — o coração
transacional do domínio.
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class StatusAgendamento(str, Enum):
    agendado = "agendado"
    concluido = "concluido"
    cancelado = "cancelado"


class AgendamentoCreate(BaseModel):
    cliente_id: str = Field(..., examples=["665f1b2c4a3e2f0012345678"])
    profissional_id: str = Field(..., examples=["665f1b2c4a3e2f0087654321"])
    servico_id: str = Field(..., examples=["665f1b2c4a3e2f00aabbccdd"])
    data_hora_inicio: datetime = Field(..., examples=["2026-06-01T14:00:00"])


class AgendamentoOut(BaseModel):
    id: str = Field(..., examples=["665f1b2c4a3e2f00deadbeef"])
    cliente_id: str
    profissional_id: str
    servico_id: str
    data_hora_inicio: datetime
    data_hora_fim: datetime
    status: StatusAgendamento
