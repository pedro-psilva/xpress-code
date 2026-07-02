from datetime import date, datetime

import pytest

from app.core.exceptions import NotFoundError
from app.models.agendamento import AgendamentoCreate
from app.models.jornada import BlocoJornada
from app.services.agenda_tools import AgendaTools
from app.services.agendamento_service import AgendamentoService
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.jornada_service import JornadaService
from app.services.notificacao_service import NotificacaoService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService

DIA = date(2099, 1, 5)


async def _montar(make_repo):
    ag, sv, us, jr, notif = (make_repo() for _ in range(5))
    jornada_service = JornadaService(jr, us)
    agendamento_service = AgendamentoService(
        ag, sv, us, jornada_service, NotificacaoService(notif)
    )
    disponibilidade_service = DisponibilidadeService(sv, ag, jornada_service, 15)
    servico = await sv.create(
        {"nome": "Corte", "preco": 40.0, "duracao_minutos": 30, "ativo": True}
    )
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    dono = await us.create({"nome": "Dono", "email": "d@e.com", "perfil": "cliente"})
    intruso = await us.create({"nome": "Intruso", "email": "i@e.com", "perfil": "cliente"})
    await jornada_service.definir(
        prof["id"],
        [BlocoJornada(dia_semana=DIA.weekday(), hora_inicio="09:00", hora_fim="18:00")],
    )
    tools = AgendaTools(
        dono,
        ServicoService(sv),
        UsuarioService(us),
        agendamento_service,
        disponibilidade_service,
    )
    return tools, agendamento_service, {"servico": servico, "prof": prof, "dono": dono, "intruso": intruso}


async def _agendar_para(ag_service, cliente_id, prof_id, servico_id, quando):
    return await ag_service.criar(
        AgendamentoCreate(
            cliente_id=cliente_id,
            profissional_id=prof_id,
            servico_id=servico_id,
            data_hora_inicio=quando,
        )
    )


async def test_criar_usa_o_cliente_do_telefone(make_repo):
    tools, ag_service, x = await _montar(make_repo)
    await tools.criar_agendamento(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0).isoformat()
    )
    do_dono = await ag_service.listar(cliente_id=x["dono"]["id"])
    do_intruso = await ag_service.listar(cliente_id=x["intruso"]["id"])
    assert len(do_dono) == 1
    assert len(do_intruso) == 0


async def test_listar_meus_so_do_dono(make_repo):
    tools, ag_service, x = await _montar(make_repo)
    await tools.criar_agendamento(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0).isoformat()
    )
    await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 11, 0),
    )
    meus = await tools.listar_meus_agendamentos()
    assert len(meus) == 1


async def test_cancelar_agendamento_de_outro_e_bloqueado(make_repo):
    tools, ag_service, x = await _montar(make_repo)
    alheio = await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 12, 0),
    )
    with pytest.raises(NotFoundError):
        await tools.cancelar_agendamento(alheio["id"])
    ainda = await ag_service.buscar(alheio["id"])
    assert ainda["status"] == "agendado"


async def test_reagendar_agendamento_de_outro_e_bloqueado(make_repo):
    tools, ag_service, x = await _montar(make_repo)
    alheio = await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 12, 0),
    )
    with pytest.raises(NotFoundError):
        await tools.reagendar_agendamento(
            alheio["id"], datetime(2099, 1, 5, 15, 0).isoformat()
        )


async def test_cancelar_do_proprio_dono_funciona(make_repo):
    tools, _ag_service, x = await _montar(make_repo)
    meu = await tools.criar_agendamento(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0).isoformat()
    )
    assert (await tools.cancelar_agendamento(meu["id"]))["cancelado"] is True


async def test_disponibilidade_lista_horarios(make_repo):
    tools, _ag_service, x = await _montar(make_repo)
    slots = await tools.consultar_disponibilidade(
        x["prof"]["id"], x["servico"]["id"], "2099-01-05"
    )
    assert len(slots) > 0
