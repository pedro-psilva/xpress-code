import pytest

from app.core.exceptions import ConflictError, NotFoundError
from app.models.usuario import UsuarioCreate
from app.services.usuario_service import UsuarioService


async def test_criar_usuario_armazena_hash_e_nao_senha(make_repo):
    service = UsuarioService(make_repo())
    criado = await service.criar(
        UsuarioCreate(nome="Ana", email="ana@ex.com", senha="senha123")
    )
    assert criado["id"]
    assert criado["perfil"] == "cliente"
    assert "senha" not in criado
    assert criado["senha_hash"] != "senha123"


async def test_criar_email_duplicado_levanta_conflict(make_repo):
    service = UsuarioService(make_repo())
    await service.criar(UsuarioCreate(nome="Ana", email="ana@ex.com", senha="senha123"))
    with pytest.raises(ConflictError):
        await service.criar(
            UsuarioCreate(nome="Outra", email="ana@ex.com", senha="outrasenha")
        )


async def test_buscar_inexistente_levanta_notfound(make_repo):
    service = UsuarioService(make_repo())
    with pytest.raises(NotFoundError):
        await service.buscar("inexistente")


async def test_remover_inexistente_levanta_notfound(make_repo):
    service = UsuarioService(make_repo())
    with pytest.raises(NotFoundError):
        await service.remover("inexistente")
