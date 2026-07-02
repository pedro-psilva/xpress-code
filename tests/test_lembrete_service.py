from datetime import timedelta

import pytest

from app.core.tempo import agora_utc
from app.services.lembrete_service import LembreteService
from app.services.notificacao_service import NotificacaoService


class _NotificacaoExternaFake:
    def __init__(self) -> None:
        self.chamadas = []

    async def enviar_lembrete(self, cliente, quando):
        self.chamadas.append((cliente["id"], quando))
        return {"email": False, "whatsapp": False}


@pytest.fixture
def cenario(make_repo):
    ag, us, notif_repo = make_repo(), make_repo(), make_repo()
    externa = _NotificacaoExternaFake()
    service = LembreteService(ag, us, NotificacaoService(notif_repo), externa)
    return service, ag, us, notif_repo, externa


async def _agendar(ag, us, quando):
    cliente = await us.create({"nome": "Cli", "email": "c@e.com", "perfil": "cliente"})
    await ag.create(
        {
            "cliente_id": cliente["id"],
            "profissional_id": "p1",
            "servico_id": "s1",
            "data_hora_inicio": quando,
            "data_hora_fim": quando + timedelta(minutes=30),
            "status": "agendado",
        }
    )
    return cliente


async def test_envia_lembrete_e_marca(cenario):
    service, ag, us, notif_repo, externa = cenario
    cliente = await _agendar(ag, us, agora_utc() + timedelta(hours=2))
    enviados = await service.processar(antecedencia_horas=24)
    assert enviados == 1
    assert len(await notif_repo.list({"usuario_id": cliente["id"]})) == 1
    assert len(externa.chamadas) == 1


async def test_idempotente_nao_reenvia(cenario):
    service, ag, us, _notif_repo, externa = cenario
    await _agendar(ag, us, agora_utc() + timedelta(hours=2))
    assert await service.processar() == 1
    assert await service.processar() == 0
    assert len(externa.chamadas) == 1
