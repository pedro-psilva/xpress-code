"""Interface abstrata de repositório (DIP / ISP).

Os serviços dependem desta abstração, nunca do driver do MongoDB diretamente.
"""
from abc import ABC, abstractmethod
from typing import Any


class AbstractRepository(ABC):
    @abstractmethod
    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        ...

    @abstractmethod
    async def get_by_id(self, id: str) -> dict[str, Any] | None:
        ...

    @abstractmethod
    async def list(self, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def update(self, id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        ...

    @abstractmethod
    async def delete(self, id: str) -> bool:
        ...
