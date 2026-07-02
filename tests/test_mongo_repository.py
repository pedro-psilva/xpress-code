"""Testes do MongoRepository sem depender de um MongoDB real."""
import pytest
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.repositories.mongo_repository import MongoRepository


class _ColecaoQueDuplica:
    async def insert_one(self, data):
        raise DuplicateKeyError("E11000 duplicate key error")


async def test_create_traduz_duplicidade_para_conflito():
    repo = MongoRepository(_ColecaoQueDuplica())
    with pytest.raises(ConflictError):
        await repo.create({"profissional_id": "p1", "data_hora_inicio": "x"})
