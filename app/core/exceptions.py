"""Exceções de domínio.

Levantadas pela camada de serviço e traduzidas para respostas HTTP por um
handler global em app.main — mantém os routers e os serviços livres de
detalhes de protocolo (SRP).
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str, status_code: int | None = None) -> None:
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail)


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class ValidationError(DomainError):
    status_code = 422


class UnauthorizedError(DomainError):
    status_code = 401


class ForbiddenError(DomainError):
    status_code = 403
