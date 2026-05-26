from datetime import datetime

import pytest

from app.core.exceptions import ConflictError, ValidationError
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


async def test_horario_sobreposto_mesmo_profissional_levanta_conflito(make_repo):
    service, servico, cliente, prof = await _montar(make_repo)
    # Corte de 30 min às 14:00 -> ocupa [14:00, 14:30)
    await service.criar(
        AgendamentoCreate(
            cliente_id=cliente["id"],
            profissional_id=prof["id"],
            servico_id=servico["id"],
            data_hora_inicio=datetime(2026, 6, 1, 14, 0),
        )
    )
    # Início às 14:15 cai dentro do intervalo anterior -> conflito.
    with pytest.raises(ConflictError):
        await service.criar(
            AgendamentoCreate(
                cliente_id=cliente["id"],
                profissional_id=prof["id"],
                servico_id=servico["id"],
                data_hora_inicio=datetime(2026, 6, 1, 14, 15),
            )
        )


async def test_horarios_adjacentes_mesmo_profissional_sao_permitidos(make_repo):
    service, servico, cliente, prof = await _montar(make_repo)
    await service.criar(
        AgendamentoCreate(
            cliente_id=cliente["id"],
            profissional_id=prof["id"],
            servico_id=servico["id"],
            data_hora_inicio=datetime(2026, 6, 1, 14, 0),
        )
    )
    # Começa exatamente quando o anterior termina (14:30) -> sem sobreposição.
    criado = await service.criar(
        AgendamentoCreate(
            cliente_id=cliente["id"],
            profissional_id=prof["id"],
            servico_id=servico["id"],
            data_hora_inicio=datetime(2026, 6, 1, 14, 30),
        )
    )
    assert criado["status"] == "agendado"
