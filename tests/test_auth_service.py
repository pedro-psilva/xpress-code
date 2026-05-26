import pytest

from app.core.exceptions import UnauthorizedError
from app.core.security import hash_senha
from app.services.auth_service import AuthService


async def _com_usuario(make_repo):
    repo = make_repo()
    await repo.create(
        {"email": "admin@ex.com", "senha_hash": hash_senha("senha123"), "perfil": "admin"}
    )
    return AuthService(repo)


async def test_autenticar_credenciais_validas(make_repo):
    service = await _com_usuario(make_repo)
    token, perfil = await service.autenticar("admin@ex.com", "senha123")
    assert token
    assert perfil == "admin"


async def test_autenticar_senha_errada(make_repo):
    service = await _com_usuario(make_repo)
    with pytest.raises(UnauthorizedError):
        await service.autenticar("admin@ex.com", "errada")


async def test_autenticar_usuario_inexistente(make_repo):
    service = AuthService(make_repo())
    with pytest.raises(UnauthorizedError):
        await service.autenticar("naoexiste@ex.com", "senha123")
