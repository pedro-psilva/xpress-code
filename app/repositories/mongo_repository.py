"""Implementação concreta de repositório sobre o MongoDB (Motor).

Implementa a interface AbstractRepository (DIP): os serviços dependem da
abstração, não desta classe. Cuida da conversão entre `_id` (ObjectId) do
Mongo e o campo `id` (string) usado na camada de aplicação.
"""
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.repositories.base import AbstractRepository


def _to_object_id(value: str) -> ObjectId | None:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _serialize(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


class MongoRepository(AbstractRepository):
    def __init__(self, collection: AsyncIOMotorCollection) -> None:
        self._collection = collection

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        try:
            result = await self._collection.insert_one(data)
        except DuplicateKeyError as exc:
            raise ConflictError(
                "O registro conflita com outro já existente."
            ) from exc
        doc = await self._collection.find_one({"_id": result.inserted_id})
        return _serialize(doc)  # type: ignore[return-value]

    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        oid = _to_object_id(id)
        if oid is None:
            return None
        return _serialize(await self._collection.find_one({"_id": oid}))

    async def list(
        self,
        filters: dict[str, Any] | None = None,
        skip: int = 0,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        cursor = self._collection.find(filters or {})
        if skip:
            cursor = cursor.skip(skip)
        if limit is not None:
            cursor = cursor.limit(limit)
        return [_serialize(doc) async for doc in cursor]  # type: ignore[misc]

    async def update(self, id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        oid = _to_object_id(id)
        if oid is None:
            return None
        result = await self._collection.update_one({"_id": oid}, {"$set": data})
        if result.matched_count == 0:
            return None
        return _serialize(await self._collection.find_one({"_id": oid}))

    async def delete(self, id: str) -> bool:
        oid = _to_object_id(id)
        if oid is None:
            return False
        result = await self._collection.delete_one({"_id": oid})
        return result.deleted_count > 0
