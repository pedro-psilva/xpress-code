"""Exceções de domínio.

Levantadas pela camada de serviço e traduzidas para respostas HTTP por um
handler global em app.main — mantém os routers e os serviços livres de
detalhes de protocolo (SRP).
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str) -> None:
        self.detail = detail
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
