import pytest
from pydantic import ValidationError

from app.core.exceptions import NotFoundError
from app.models.plano import PlanoCreate
from app.services.plano_service import PlanoService


def _payload(**overrides):
    base = {
        "nome": "UAU",
        "frequencia": "2x no mês (seg–qui)",
        "preco_corte": 70.0,
        "preco_corte_barba": 119.0,
        "desconto_extras": 0,
    }
    base.update(overrides)
    return PlanoCreate(**base)


async def test_criar_plano_sucesso(make_repo):
    service = PlanoService(make_repo())
    criado = await service.criar(_payload())
    assert criado["id"]
    assert criado["nome"] == "UAU"
    assert criado["preco_corte"] == 70.0
    assert criado["ativo"] is True


async def test_desativar_marca_inativo(make_repo):
    service = PlanoService(make_repo())
    criado = await service.criar(_payload(nome="Flex", preco_corte=149.0, preco_corte_barba=229.0))
    await service.desativar(criado["id"])
    atualizado = await service.buscar(criado["id"])
    assert atualizado["ativo"] is False


async def test_buscar_inexistente_levanta_notfound(make_repo):
    service = PlanoService(make_repo())
    with pytest.raises(NotFoundError):
        await service.buscar("inexistente")


def test_validacao_barba_menor_que_corte_falha():
    with pytest.raises(ValidationError):
        _payload(preco_corte=200.0, preco_corte_barba=150.0)
