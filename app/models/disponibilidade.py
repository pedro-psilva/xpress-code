"""Schema de horário livre para agendamento."""
from datetime import datetime

from pydantic import BaseModel


class SlotDisponivel(BaseModel):
    inicio: datetime
    fim: datetime
