from datetime import date, time, timedelta

from app.core.tempo import combinar_local
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.jornada_service import JornadaService
from app.models.jornada import BlocoJornada

DIA = date(2099, 1, 5)


async def _montar(make_repo, duracao=30, passo=15):
    sv, ag, jr, us = make_repo(), make_repo(), make_repo(), make_repo()
    prof = await us.create({"nome": "Prof", "email": "p@e.com", "perfil": "profissional"})
    servico = await sv.create(
        {"nome": "Corte", "preco": 40.0, "duracao_minutos": duracao, "ativo": True}
    )
    jornada_service = JornadaService(jr, us)
    await jornada_service.definir(
        prof["id"],
        [BlocoJornada(dia_semana=DIA.weekday(), hora_inicio="09:00", hora_fim="12:00")],
    )
    service = DisponibilidadeService(sv, ag, jornada_service, passo)
    return service, ag, servico, prof


async def test_slots_cobrem_a_jornada(make_repo):
    service, _ag, servico, prof = await _montar(make_repo)
    slots = await service.slots_livres(prof["id"], servico["id"], DIA)
    assert len(slots) == 11
    assert slots[0]["inicio"] == combinar_local(DIA, time(9, 0))
    assert slots[-1]["inicio"] == combinar_local(DIA, time(11, 30))


async def test_slot_ocupado_e_removido(make_repo):
    service, ag, servico, prof = await _montar(make_repo)
    inicio = combinar_local(DIA, time(9, 0))
    await ag.create(
        {
            "profissional_id": prof["id"],
            "data_hora_inicio": inicio,
            "data_hora_fim": inicio + timedelta(minutes=30),
            "status": "agendado",
        }
    )
    slots = await service.slots_livres(prof["id"], servico["id"], DIA)
    assert len(slots) == 9
    assert all(s["inicio"] >= combinar_local(DIA, time(9, 30)) for s in slots)


async def test_sem_jornada_no_dia_retorna_vazio(make_repo):
    service, _ag, servico, prof = await _montar(make_repo)
    outro_dia = date(2099, 1, 6)
    slots = await service.slots_livres(prof["id"], servico["id"], outro_dia)
    assert slots == []
