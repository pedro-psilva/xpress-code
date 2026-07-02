"""Schemas da jornada de trabalho do profissional."""
import re

from pydantic import BaseModel, Field, field_validator, model_validator

_HHMM = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


class BlocoJornada(BaseModel):
    dia_semana: int = Field(..., ge=0, le=6, description="0=segunda ... 6=domingo")
    hora_inicio: str = Field(..., examples=["09:00"])
    hora_fim: str = Field(..., examples=["18:00"])

    @field_validator("hora_inicio", "hora_fim")
    @classmethod
    def _formato(cls, valor: str) -> str:
        if not _HHMM.match(valor):
            raise ValueError("Hora deve estar no formato HH:MM (00:00-23:59).")
        return valor

    @model_validator(mode="after")
    def _ordem(self) -> "BlocoJornada":
        if self.hora_fim <= self.hora_inicio:
            raise ValueError("hora_fim deve ser maior que hora_inicio.")
        return self


class JornadaUpsert(BaseModel):
    blocos: list[BlocoJornada] = Field(default_factory=list)


class JornadaOut(BaseModel):
    profissional_id: str
    blocos: list[BlocoJornada]
