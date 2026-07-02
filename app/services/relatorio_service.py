"""Relatórios gerenciais: faturamento e no-show por período."""
from datetime import date
from typing import Any

from app.core.exceptions import ValidationError
from app.core.tempo import limites_do_dia
from app.models.agendamento import StatusAgendamento
from app.repositories.base import AbstractRepository


class RelatorioService:
    def __init__(
        self, agendamento_repo: AbstractRepository, servico_repo: AbstractRepository
    ) -> None:
        self._repo = agendamento_repo
        self._servico_repo = servico_repo

    async def resumo(self, inicio: date, fim: date) -> dict[str, Any]:
        if fim < inicio:
            raise ValidationError("A data final não pode ser anterior à inicial.")
        inicio_utc, _ = limites_do_dia(inicio)
        _, fim_utc = limites_do_dia(fim)
        agendamentos = await self._repo.list(
            {"data_hora_inicio": {"$gte": inicio_utc, "$lte": fim_utc}}
        )
        precos = {s["id"]: s.get("preco", 0.0) for s in await self._servico_repo.list()}

        concluidos = [
            a for a in agendamentos if a["status"] == StatusAgendamento.concluido.value
        ]
        no_shows = [
            a for a in agendamentos if a["status"] == StatusAgendamento.no_show.value
        ]
        cancelados = [
            a for a in agendamentos if a["status"] == StatusAgendamento.cancelado.value
        ]
        faturamento = sum(precos.get(a["servico_id"], 0.0) for a in concluidos)
        base = len(concluidos) + len(no_shows)
        taxa_no_show = len(no_shows) / base if base else 0.0

        return {
            "periodo": {"inicio": inicio, "fim": fim},
            "faturamento": round(faturamento, 2),
            "atendimentos_concluidos": len(concluidos),
            "no_shows": len(no_shows),
            "cancelamentos": len(cancelados),
            "taxa_no_show": round(taxa_no_show, 4),
        }
