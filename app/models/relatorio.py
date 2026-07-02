"""Schemas de relatórios gerenciais."""
from datetime import date

from pydantic import BaseModel


class PeriodoRelatorio(BaseModel):
    inicio: date
    fim: date


class RelatorioResumo(BaseModel):
    periodo: PeriodoRelatorio
    faturamento: float
    atendimentos_concluidos: int
    no_shows: int
    cancelamentos: int
    taxa_no_show: float
