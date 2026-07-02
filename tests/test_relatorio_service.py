from datetime import date

import pytest

from app.core.exceptions import ValidationError
from app.core.tempo import combinar_local
from app.services.relatorio_service import RelatorioService

DIA = date(2026, 6, 1)


@pytest.fixture
def cenario(make_repo):
    return RelatorioService(make_repo(), make_repo()), make_repo


async def _agendar(ag, servico_id, status):
    from datetime import time

    inicio = combinar_local(DIA, time(10, 0))
    await ag.create(
        {
            "servico_id": servico_id,
            "profissional_id": "p1",
            "cliente_id": "c1",
            "data_hora_inicio": inicio,
            "data_hora_fim": inicio,
            "status": status,
        }
    )


async def test_resumo_calcula_faturamento_e_no_show(make_repo):
    ag, sv = make_repo(), make_repo()
    servico = await sv.create(
        {"nome": "Corte", "preco": 50.0, "duracao_minutos": 30, "ativo": True}
    )
    await _agendar(ag, servico["id"], "concluido")
    await _agendar(ag, servico["id"], "concluido")
    await _agendar(ag, servico["id"], "no_show")
    await _agendar(ag, servico["id"], "cancelado")
    service = RelatorioService(ag, sv)

    resumo = await service.resumo(DIA, DIA)
    assert resumo["faturamento"] == 100.0
    assert resumo["atendimentos_concluidos"] == 2
    assert resumo["no_shows"] == 1
    assert resumo["cancelamentos"] == 1
    assert resumo["taxa_no_show"] == round(1 / 3, 4)


async def test_resumo_sem_dados_zera(make_repo):
    service = RelatorioService(make_repo(), make_repo())
    resumo = await service.resumo(DIA, DIA)
    assert resumo["faturamento"] == 0.0
    assert resumo["taxa_no_show"] == 0.0


async def test_resumo_periodo_invertido_levanta_validation(make_repo):
    service = RelatorioService(make_repo(), make_repo())
    with pytest.raises(ValidationError):
        await service.resumo(date(2026, 6, 10), date(2026, 6, 1))
