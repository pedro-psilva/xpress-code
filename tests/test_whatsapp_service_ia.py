import pytest

from app.core.config import settings
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.jornada_service import JornadaService
from app.services.notificacao_service import NotificacaoService
from app.services.agendamento_service import AgendamentoService
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService
from app.services.whatsapp_service import WhatsAppService


class _FakeCollection:
    def __init__(self):
        self.docs = []

    def _match(self, doc, query):
        return all(doc.get(k) == v for k, v in query.items())

    async def find_one(self, query):
        for d in self.docs:
            if self._match(d, query):
                return dict(d)
        return None

    async def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if self._match(d, query):
                d.update(update.get("$set", {}))
                return
        if upsert:
            novo = dict(query)
            novo.update(update.get("$set", {}))
            self.docs.append(novo)

    async def delete_one(self, query):
        self.docs = [d for d in self.docs if not self._match(d, query)]


class _FakeDB:
    def __init__(self):
        self._cols = {}

    def __getitem__(self, nome):
        return self._cols.setdefault(nome, _FakeCollection())


class _GeminiFake:
    def __init__(self, configurado=True):
        self.configurado = configurado
        self.chamadas = 0

    async def conversar(self, system, mensagens, ferramentas):
        self.chamadas += 1
        return {"texto": "Resposta da IA", "chamadas": []}


class _ClientFake:
    async def enviar_texto(self, telefone, texto):
        return True


def _servico(db, make_repo, gemini):
    return WhatsAppService(
        db=db,
        client=_ClientFake(),
        usuario_service=UsuarioService(make_repo()),
        servico_service=ServicoService(make_repo()),
        agendamento_service=AgendamentoService(
            make_repo(), make_repo(), make_repo(),
            JornadaService(make_repo(), make_repo()),
            NotificacaoService(make_repo()),
        ),
        disponibilidade_service=DisponibilidadeService(
            make_repo(), make_repo(), JornadaService(make_repo(), make_repo()), 15
        ),
        gemini_client=gemini,
    )


TELEFONE = "5531999990000"


def _seed_cliente(db):
    db["usuarios"].docs.append(
        {"_id": "u1", "telefone": TELEFONE, "perfil": "cliente", "nome": "Ana"}
    )


async def test_cliente_existente_usa_a_ia(make_repo):
    db = _FakeDB()
    _seed_cliente(db)
    gemini = _GeminiFake(configurado=True)
    service = _servico(db, make_repo, gemini)
    resposta = await service._processar_mensagem(TELEFONE, "oi")
    assert resposta == "Resposta da IA"
    assert gemini.chamadas == 1


async def test_rate_limit_bloqueia_excesso(make_repo, monkeypatch):
    monkeypatch.setattr(settings, "whatsapp_msg_limite_min", 2)
    db = _FakeDB()
    _seed_cliente(db)
    service = _servico(db, make_repo, _GeminiFake(configurado=True))
    assert await service._processar_mensagem(TELEFONE, "1") == "Resposta da IA"
    assert await service._processar_mensagem(TELEFONE, "2") == "Resposta da IA"
    terceira = await service._processar_mensagem(TELEFONE, "3")
    assert "muitas mensagens" in terceira.lower()


async def test_sem_gemini_nao_usa_ia(make_repo):
    db = _FakeDB()
    _seed_cliente(db)
    gemini = _GeminiFake(configurado=False)
    service = _servico(db, make_repo, gemini)
    resposta = await service._processar_mensagem(TELEFONE, "oi")
    assert gemini.chamadas == 0
    assert resposta != "Resposta da IA"
