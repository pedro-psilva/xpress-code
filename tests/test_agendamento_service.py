from datetime import datetime, timedelta, timezone

import pytest

from app.core.exceptions import ConflictError, ValidationError
from app.models.agendamento import AgendamentoCreate
from app.models.jornada import BlocoJornada
from app.services.agendamento_service import AgendamentoService
from app.services.jornada_service import JornadaService


async def _montar(make_repo):
    ag, sv, us, jr = make_repo(), make_repo(), make_repo(), make_repo()
    servico = await sv.create(
        {"nome": "Corte", "preco": 40.0, "duracao_minutos": 30, "ativo": True}
    )
    cliente = await us.create({"nome": "Cli", "email": "c@e.com", "perfil": "cliente"})
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    jornada_service = JornadaService(jr, us)
    service = AgendamentoService(ag, sv, us, jornada_service)
    return service, servico, cliente, prof, jornada_service


def _payload(cliente, prof, servico, quando):
    return AgendamentoCreate(
        cliente_id=cliente["id"],
        profissional_id=prof["id"],
        servico_id=servico["id"],
        data_hora_inicio=quando,
    )


async def test_criar_agendamento_calcula_termino(make_repo):
    service, servico, cliente, prof, _ = await _montar(make_repo)
    criado = await service.criar(
        _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0))
    )
    assert criado["status"] == "agendado"
    assert criado["data_hora_inicio"].tzinfo == timezone.utc
    assert criado["data_hora_fim"] - criado["data_hora_inicio"] == timedelta(minutes=30)


async def test_cancelar_muda_status(make_repo):
    service, servico, cliente, prof, _ = await _montar(make_repo)
    criado = await service.criar(
        _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0))
    )
    await service.cancelar(criado["id"])
    atualizado = await service.buscar(criado["id"])
    assert atualizado["status"] == "cancelado"


async def test_servico_inexistente_levanta_validation(make_repo):
    service, _servico, cliente, prof, _ = await _montar(make_repo)
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
    service, servico, _cliente, prof, _ = await _montar(make_repo)
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
    service, servico, cliente, prof, _ = await _montar(make_repo)
    await service.criar(_payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0)))
    with pytest.raises(ConflictError):
        await service.criar(
            _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 15))
        )


async def test_horarios_adjacentes_mesmo_profissional_sao_permitidos(make_repo):
    service, servico, cliente, prof, _ = await _montar(make_repo)
    await service.criar(_payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0)))
    criado = await service.criar(
        _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 30))
    )
    assert criado["status"] == "agendado"


async def test_agendamento_dentro_da_jornada_e_permitido(make_repo):
    service, servico, cliente, prof, jornada_service = await _montar(make_repo)
    await jornada_service.definir(
        prof["id"],
        [BlocoJornada(dia_semana=0, hora_inicio="09:00", hora_fim="18:00")],
    )
    criado = await service.criar(
        _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0))
    )
    assert criado["status"] == "agendado"


async def test_agendamento_fora_da_jornada_levanta_validation(make_repo):
    service, servico, cliente, prof, jornada_service = await _montar(make_repo)
    await jornada_service.definir(
        prof["id"],
        [BlocoJornada(dia_semana=0, hora_inicio="09:00", hora_fim="12:00")],
    )
    with pytest.raises(ValidationError):
        await service.criar(
            _payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0))
        )


async def test_profissional_nao_vinculado_ao_servico_levanta_validation(make_repo):
    ag, sv, us, jr = make_repo(), make_repo(), make_repo(), make_repo()
    outro = await us.create({"nome": "Outro", "email": "o@e.com", "perfil": "profissional"})
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    cliente = await us.create({"nome": "Cli", "email": "c@e.com", "perfil": "cliente"})
    servico = await sv.create(
        {
            "nome": "Corte",
            "preco": 40.0,
            "duracao_minutos": 30,
            "ativo": True,
            "profissionais_ids": [outro["id"]],
        }
    )
    service = AgendamentoService(ag, sv, us, JornadaService(jr, us))
    with pytest.raises(ValidationError):
        await service.criar(_payload(cliente, prof, servico, datetime(2026, 6, 1, 14, 0)))
