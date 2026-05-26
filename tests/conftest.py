"""Fixtures de teste.

FakeRepository é uma implementação em memória de AbstractRepository. Como os
serviços dependem da abstração (DIP), conseguimos testá-los sem MongoDB —
e o fato de o fake substituir o repositório real sem quebrar nada evidencia
o LSP.
"""
from typing import Any

import pytest

from app.repositories.base import AbstractRepository


class FakeRepository(AbstractRepository):
    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}
        self._seq = 0

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        self._seq += 1
        _id = str(self._seq)
        doc = dict(data)
        doc["id"] = _id
        self._data[_id] = doc
        return dict(doc)

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        doc = self._data.get(id)
        return dict(doc) if doc else None

    async def list(self, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        resultado = []
        for doc in self._data.values():
            if filters and not _matches(doc, filters):
                continue
            resultado.append(dict(doc))
        return resultado

    async def update(self, id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        if id not in self._data:
            return None
        self._data[id].update(data)
        return dict(self._data[id])

    async def delete(self, id: str) -> bool:
        return self._data.pop(id, None) is not None


def _matches(doc: dict[str, Any], filters: dict[str, Any]) -> bool:
    for chave, valor in filters.items():
        if isinstance(valor, dict):  # filtros de operador (ex.: range) — ignorados no fake
            continue
        if doc.get(chave) != valor:
            return False
    return True


@pytest.fixture
def make_repo():
    """Fábrica de repositórios fake independentes."""
    return lambda: FakeRepository()
