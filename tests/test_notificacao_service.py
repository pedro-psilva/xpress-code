import pytest

from app.core.exceptions import NotFoundError
from app.models.notificacao import TipoNotificacao
from app.services.notificacao_service import NotificacaoService


@pytest.fixture
def service(make_repo):
    return NotificacaoService(make_repo())


async def _criar(service, usuario_id="u1"):
    return await service.criar(
        usuario_id, TipoNotificacao.confirmacao, "Título", "Mensagem"
    )


async def test_criar_nasce_nao_lida(service):
    notif = await _criar(service)
    assert notif["lida"] is False
    assert notif["tipo"] == "confirmacao"


async def test_listar_isola_por_usuario(service):
    await _criar(service, "u1")
    await _criar(service, "u2")
    assert len(await service.listar("u1")) == 1


async def test_apenas_nao_lidas_e_contagem(service):
    n1 = await _criar(service, "u1")
    await _criar(service, "u1")
    await service.marcar_lida(n1["id"], "u1")
    assert await service.contar_nao_lidas("u1") == 1
    assert len(await service.listar("u1", apenas_nao_lidas=True)) == 1


async def test_marcar_lida_de_outro_usuario_nao_vaza(service):
    notif = await _criar(service, "dono")
    with pytest.raises(NotFoundError):
        await service.marcar_lida(notif["id"], "intruso")


async def test_marcar_todas_lidas(service):
    await _criar(service, "u1")
    await _criar(service, "u1")
    assert await service.marcar_todas_lidas("u1") == 2
    assert await service.contar_nao_lidas("u1") == 0
