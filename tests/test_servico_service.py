import pytest

from app.core.exceptions import NotFoundError
from app.models.servico import ServicoCreate
from app.services.servico_service import ServicoService


async def test_criar_servico_sucesso(make_repo):
    service = ServicoService(make_repo())
    criado = await service.criar(
        ServicoCreate(nome="Corte", preco=40.0, duracao_minutos=30)
    )
    assert criado["id"]
    assert criado["nome"] == "Corte"
    assert criado["ativo"] is True


async def test_desativar_marca_inativo(make_repo):
    service = ServicoService(make_repo())
    criado = await service.criar(
        ServicoCreate(nome="Barba", preco=20.0, duracao_minutos=15)
    )
    await service.desativar(criado["id"])
    atualizado = await service.buscar(criado["id"])
    assert atualizado["ativo"] is False


async def test_buscar_inexistente_levanta_notfound(make_repo):
    service = ServicoService(make_repo())
    with pytest.raises(NotFoundError):
        await service.buscar("inexistente")


async def test_atualizar_inexistente_levanta_notfound(make_repo):
    service = ServicoService(make_repo())
    with pytest.raises(NotFoundError):
        await service.atualizar(
            "inexistente", ServicoCreate(nome="X", preco=1.0, duracao_minutos=10)
        )
