import pytest

from app.core.exceptions import DomainError, NotFoundError
from app.models.assinatura import AssinaturaCreate, StatusAssinatura
from app.models.plano import PlanoCreate
from app.models.usuario import Perfil, UsuarioCreate
from app.services.assinatura_service import AssinaturaService
from app.services.plano_service import PlanoService
from app.services.usuario_service import UsuarioService


class _FakeNotification:
    async def enviar_cobranca(self, cliente, plano_nome, valor, link):
        return {"email": False, "whatsapp": False}


class _FakeInfinitePayOff:
    configurado = False

    async def criar_link(self, *_a, **_kw):
        return None


class _FakeInfinitePayOn:
    configurado = True

    async def criar_link(self, order_nsu, descricao, valor):
        return {"url": f"https://pay.fake/{order_nsu}"}


def _payload_plano(**over):
    base = {
        "nome": "Flex",
        "frequencia": "4x/mes",
        "preco_corte": 149.0,
        "preco_corte_barba": 229.0,
    }
    base.update(over)
    return PlanoCreate(**base)


def _payload_usuario(**over):
    base = {
        "nome": "Cliente Teste",
        "email": f"cliente_{over.get('telefone', 'x')}@bot.xpresscode.com.br",
        "senha": "senha123",
        "telefone": "5531900000000",
        "perfil": Perfil.cliente,
    }
    base.update(over)
    return UsuarioCreate(**base)


async def _criar_cenario(make_repo, infinitepay):
    usuario_service = UsuarioService(make_repo())
    plano_service = PlanoService(make_repo())
    cliente = await usuario_service.criar(_payload_usuario())
    plano = await plano_service.criar(_payload_plano())
    service = AssinaturaService(
        repository=make_repo(),
        usuario_service=usuario_service,
        plano_service=plano_service,
        infinitepay=infinitepay,
        notification=_FakeNotification(),
    )
    return service, cliente, plano


async def test_criar_assinatura_sucesso(make_repo):
    service, cliente, plano = await _criar_cenario(make_repo, _FakeInfinitePayOff())
    criada = await service.criar(
        AssinaturaCreate(cliente_id=cliente["id"], plano_id=plano["id"])
    )
    assert criada["id"]
    assert criada["status"] == StatusAssinatura.ativa.value
    assert criada["proxima_cobranca"] is not None


async def test_criar_assinatura_cliente_inexistente_levanta_notfound(make_repo):
    service, _, plano = await _criar_cenario(make_repo, _FakeInfinitePayOff())
    with pytest.raises(NotFoundError):
        await service.criar(
            AssinaturaCreate(cliente_id="inexistente", plano_id=plano["id"])
        )


async def test_criar_assinatura_plano_inexistente_levanta_notfound(make_repo):
    service, cliente, _ = await _criar_cenario(make_repo, _FakeInfinitePayOff())
    with pytest.raises(NotFoundError):
        await service.criar(
            AssinaturaCreate(cliente_id=cliente["id"], plano_id="inexistente")
        )


async def test_gerar_cobranca_sem_infinitepay_levanta_domain(make_repo):
    service, cliente, plano = await _criar_cenario(make_repo, _FakeInfinitePayOff())
    criada = await service.criar(
        AssinaturaCreate(cliente_id=cliente["id"], plano_id=plano["id"])
    )
    with pytest.raises(DomainError) as excinfo:
        await service.gerar_cobranca(criada["id"])
    assert excinfo.value.status_code == 503


async def test_gerar_cobranca_sucesso_marca_pendente(make_repo):
    service, cliente, plano = await _criar_cenario(make_repo, _FakeInfinitePayOn())
    criada = await service.criar(
        AssinaturaCreate(cliente_id=cliente["id"], plano_id=plano["id"])
    )
    resp = await service.gerar_cobranca(criada["id"])
    assert resp.link.startswith("https://pay.fake/")
    atualizada = await service.buscar(criada["id"])
    assert atualizada["status"] == StatusAssinatura.pendente.value
    assert atualizada["ultimo_link_pagamento"] == resp.link


async def test_webhook_pagamento_marca_ativa(make_repo):
    service, cliente, plano = await _criar_cenario(make_repo, _FakeInfinitePayOn())
    criada = await service.criar(
        AssinaturaCreate(cliente_id=cliente["id"], plano_id=plano["id"])
    )
    await service.atualizar_status(criada["id"], StatusAssinatura.pendente)
    await service.processar_webhook_pagamento(
        {"order_nsu": f"sub-{criada['id']}-1234567890"}
    )
    atualizada = await service.buscar(criada["id"])
    assert atualizada["status"] == StatusAssinatura.ativa.value


async def test_webhook_pagamento_payload_invalido_ignora(make_repo):
    service, _, _ = await _criar_cenario(make_repo, _FakeInfinitePayOn())
    await service.processar_webhook_pagamento({"order_nsu": "lixo"})
    await service.processar_webhook_pagamento({})


async def test_remover_inexistente_levanta_notfound(make_repo):
    service, _, _ = await _criar_cenario(make_repo, _FakeInfinitePayOff())
    with pytest.raises(NotFoundError):
        await service.remover("inexistente")
