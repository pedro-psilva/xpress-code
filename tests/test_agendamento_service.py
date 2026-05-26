from datetime import datetime

import pytest

from app.core.exceptions import ValidationError
from app.models.agendamento import AgendamentoCreate
from app.services.agendamento_service import AgendamentoService


async def _montar(make_repo):
    ag, sv, us = make_repo(), make_repo(), make_repo()
    servico = await sv.create(
        {"nome": "Corte", "preco": 40.0, "duracao_minutos": 30, "ativo": True}
    )
    cliente = await us.create({"nome": "Cli", "email": "c@e.com", "perfil": "cliente"})
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    return AgendamentoService(ag, sv, us), servico, cliente, prof


async def test_criar_agendamento_calcula_termino(make_repo):
    service, servico, cliente, prof = await _montar(make_repo)
    criado = await service.criar(
        AgendamentoCreate(
            cliente_id=cliente["id"],
            profissional_id=prof["id"],
            servico_id=servico["id"],
            data_hora_inicio=datetime(2026, 6, 1, 14, 0),
        )
    )
    assert criado["status"] == "agendado"
    assert criado["data_hora_fim"] == datetime(2026, 6, 1, 14, 30)


async def test_cancelar_muda_status(make_repo):
    service, servico, cliente, prof = await _montar(make_repo)
    criado = await service.criar(
        AgendamentoCreate(
            cliente_id=cliente["id"],
            profissional_id=prof["id"],
            servico_id=servico["id"],
            data_hora_inicio=datetime(2026, 6, 1, 14, 0),
        )
    )
    await service.cancelar(criado["id"])
    atualizado = await service.buscar(criado["id"])
    assert atualizado["status"] == "cancelado"


async def test_servico_inexistente_levanta_validation(make_repo):
    service, _servico, cliente, prof = await _montar(make_repo)
    with pytest.raises(ValidationError):
        await service.criar(
            AgendamentoCreate(
                cliente_id=cliente["id"],
                profissional_id=prof["id"],
                servico_id="inexistente",
                data_hora_inicio=datetime(2026, 6, 1, 14, 0),
            )
        )


async def test_cliente_inexistente_levanta_validation(make_repo):
    service, servico, _cliente, prof = await _montar(make_repo)
    with pytest.raises(ValidationError):
        await service.criar(
            AgendamentoCreate(
                cliente_id="inexistente",
                profissional_id=prof["id"],
                servico_id=servico["id"],
                data_hora_inicio=datetime(2026, 6, 1, 14, 0),
            )
        )
