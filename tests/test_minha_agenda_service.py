"""Testes da agenda self-service do cliente (P2-15).

Foco nos guard rails: o cliente só age sobre os próprios agendamentos e a
identidade nunca é escolhida pelo chamador (é fixada na construção do serviço,
como se viesse do token).
"""
from datetime import date, datetime

import pytest

from app.core.exceptions import NotFoundError
from app.core.tempo import para_utc
from app.models.agendamento import AgendamentoCreate
from app.models.jornada import BlocoJornada
from app.services.agendamento_service import AgendamentoService
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.jornada_service import JornadaService
from app.services.minha_agenda_service import MinhaAgendaService
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
    inativo = await sv.create(
        {"nome": "Antigo", "preco": 20.0, "duracao_minutos": 30, "ativo": False}
    )
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    dono = await us.create({"nome": "Dono", "email": "d@e.com", "perfil": "cliente"})
    intruso = await us.create({"nome": "Intruso", "email": "i@e.com", "perfil": "cliente"})
    await jornada_service.definir(
        prof["id"],
        [BlocoJornada(dia_semana=DIA.weekday(), hora_inicio="09:00", hora_fim="18:00")],
    )
    minha = MinhaAgendaService(
        cliente_id=dono["id"],
        servico_service=ServicoService(sv),
        usuario_service=UsuarioService(us),
        agendamento_service=agendamento_service,
        disponibilidade_service=disponibilidade_service,
    )
    ctx = {
        "servico": servico,
        "inativo": inativo,
        "prof": prof,
        "dono": dono,
        "intruso": intruso,
    }
    return minha, agendamento_service, ctx


async def _agendar_para(ag_service, cliente_id, prof_id, servico_id, quando):
    return await ag_service.criar(
        AgendamentoCreate(
            cliente_id=cliente_id,
            profissional_id=prof_id,
            servico_id=servico_id,
            data_hora_inicio=quando,
        )
    )


async def test_criar_fixa_o_cliente_do_token(make_repo):
    minha, ag_service, x = await _montar(make_repo)
    criado = await minha.criar(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0)
    )
    assert criado["cliente_id"] == x["dono"]["id"]
    do_intruso = await ag_service.listar(cliente_id=x["intruso"]["id"])
    assert do_intruso == []


async def test_listar_so_do_dono_ordenado_desc(make_repo):
    minha, ag_service, x = await _montar(make_repo)
    await minha.criar(x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0))
    await minha.criar(x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 14, 0))
    await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 16, 0),
    )
    meus = await minha.listar_agendamentos()
    assert len(meus) == 2
    assert all(a["cliente_id"] == x["dono"]["id"] for a in meus)
    assert meus[0]["data_hora_inicio"] > meus[1]["data_hora_inicio"]


async def test_catalogo_so_traz_servicos_ativos(make_repo):
    minha, _ag_service, x = await _montar(make_repo)
    servicos = await minha.listar_servicos()
    ids = {s["id"] for s in servicos}
    assert x["servico"]["id"] in ids
    assert x["inativo"]["id"] not in ids


async def test_profissionais_expoem_so_id_e_nome(make_repo):
    minha, _ag_service, x = await _montar(make_repo)
    profissionais = await minha.listar_profissionais()
    assert profissionais == [{"id": x["prof"]["id"], "nome": x["prof"]["nome"]}]


async def test_disponibilidade_lista_horarios(make_repo):
    minha, _ag_service, x = await _montar(make_repo)
    slots = await minha.consultar_disponibilidade(
        x["prof"]["id"], x["servico"]["id"], DIA
    )
    assert len(slots) > 0


async def test_cancelar_de_outro_e_bloqueado(make_repo):
    minha, ag_service, x = await _montar(make_repo)
    alheio = await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 12, 0),
    )
    with pytest.raises(NotFoundError):
        await minha.cancelar(alheio["id"])
    ainda = await ag_service.buscar(alheio["id"])
    assert ainda["status"] == "agendado"


async def test_reagendar_de_outro_e_bloqueado(make_repo):
    minha, ag_service, x = await _montar(make_repo)
    alheio = await _agendar_para(
        ag_service, x["intruso"]["id"], x["prof"]["id"], x["servico"]["id"],
        datetime(2099, 1, 5, 12, 0),
    )
    with pytest.raises(NotFoundError):
        await minha.reagendar(alheio["id"], datetime(2099, 1, 5, 15, 0))


async def test_cancelar_do_proprio_dono_funciona(make_repo):
    minha, ag_service, x = await _montar(make_repo)
    meu = await minha.criar(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0)
    )
    await minha.cancelar(meu["id"])
    depois = await ag_service.buscar(meu["id"])
    assert depois["status"] == "cancelado"


async def test_reagendar_do_proprio_dono_funciona(make_repo):
    minha, _ag_service, x = await _montar(make_repo)
    meu = await minha.criar(
        x["prof"]["id"], x["servico"]["id"], datetime(2099, 1, 5, 10, 0)
    )
    atualizado = await minha.reagendar(meu["id"], datetime(2099, 1, 5, 11, 0))
    assert atualizado["data_hora_inicio"] == para_utc(datetime(2099, 1, 5, 11, 0))
