"""Regras de negócio da jornada de trabalho do profissional."""
from datetime import date, datetime, time
from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.core.tempo import combinar_local
from app.models.jornada import BlocoJornada
from app.repositories.base import AbstractRepository


def _hora(valor: str) -> time:
    return time(int(valor[:2]), int(valor[3:5]))


class JornadaService:
    def __init__(
        self, jornada_repo: AbstractRepository, usuario_repo: AbstractRepository
    ) -> None:
        self._repo = jornada_repo
        self._usuario_repo = usuario_repo

    async def definir(
        self, profissional_id: str, blocos: list[BlocoJornada]
    ) -> dict[str, Any]:
        profissional = await self._usuario_repo.get_by_id(profissional_id)
        if profissional is None:
            raise NotFoundError("Profissional não encontrado.")
        if profissional.get("perfil") not in {"profissional", "admin"}:
            raise ValidationError(
                "Jornada só pode ser definida para perfil profissional ou admin."
            )
        blocos_doc = [bloco.model_dump() for bloco in blocos]
        existente = await self._repo.list({"profissional_id": profissional_id})
        if existente:
            return await self._repo.update(existente[0]["id"], {"blocos": blocos_doc})
        return await self._repo.create(
            {"profissional_id": profissional_id, "blocos": blocos_doc}
        )

    async def obter(self, profissional_id: str) -> dict[str, Any] | None:
        encontrados = await self._repo.list({"profissional_id": profissional_id})
        return encontrados[0] if encontrados else None

    async def intervalos_do_dia(
        self, profissional_id: str, dia: date
    ) -> list[tuple[datetime, datetime]]:
        jornada = await self.obter(profissional_id)
        if not jornada:
            return []
        intervalos = []
        for bloco in jornada["blocos"]:
            if bloco["dia_semana"] != dia.weekday():
                continue
            inicio = combinar_local(dia, _hora(bloco["hora_inicio"]))
            fim = combinar_local(dia, _hora(bloco["hora_fim"]))
            intervalos.append((inicio, fim))
        return sorted(intervalos)
