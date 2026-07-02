import pytest

from app.core.exceptions import DomainError
from app.services.whatsapp_agent import WhatsAppAgent


class _FakeTools:
    def __init__(self):
        self.chamou = []

    async def listar_servicos(self):
        self.chamou.append("listar_servicos")
        return [{"id": "1", "nome": "Corte"}]

    async def listar_profissionais(self):
        return []

    async def consultar_disponibilidade(self, **kwargs):
        return []

    async def criar_agendamento(self, **kwargs):
        return {"id": "a1"}

    async def listar_meus_agendamentos(self):
        return []

    async def cancelar_agendamento(self, agendamento_id):
        raise DomainError("Agendamento não encontrado.", status_code=404)

    async def reagendar_agendamento(self, **kwargs):
        return {}


class _FakeLLM:
    def __init__(self, respostas):
        self.respostas = list(respostas)
        self.chamadas = 0

    async def conversar(self, system, mensagens, ferramentas):
        self.chamadas += 1
        return self.respostas.pop(0) if self.respostas else {"texto": "fim"}


class _LoopLLM:
    def __init__(self):
        self.chamadas = 0

    async def conversar(self, system, mensagens, ferramentas):
        self.chamadas += 1
        return {"chamadas": [{"nome": "listar_servicos", "args": {}}]}


async def test_retorna_texto_quando_nao_ha_chamada():
    agent = WhatsAppAgent(_FakeLLM([{"texto": "Olá!"}]), _FakeTools())
    assert await agent.responder([], "oi") == "Olá!"


async def test_executa_ferramenta_e_depois_responde():
    tools = _FakeTools()
    llm = _FakeLLM(
        [
            {"chamadas": [{"nome": "listar_servicos", "args": {}}]},
            {"texto": "Temos Corte."},
        ]
    )
    resposta = await WhatsAppAgent(llm, tools).responder([], "quais servicos?")
    assert resposta == "Temos Corte."
    assert "listar_servicos" in tools.chamou


async def test_ferramenta_desconhecida_nao_quebra():
    llm = _FakeLLM(
        [
            {"chamadas": [{"nome": "rm_rf", "args": {}}]},
            {"texto": "ok"},
        ]
    )
    assert await WhatsAppAgent(llm, _FakeTools()).responder([], "hack") == "ok"


async def test_erro_de_dominio_nao_derruba_o_fluxo():
    llm = _FakeLLM(
        [
            {"chamadas": [{"nome": "cancelar_agendamento", "args": {"agendamento_id": "x"}}]},
            {"texto": "Não encontrei esse agendamento."},
        ]
    )
    resposta = await WhatsAppAgent(llm, _FakeTools()).responder([], "cancela")
    assert resposta == "Não encontrei esse agendamento."


async def test_teto_de_iteracoes_encerra():
    llm = _LoopLLM()
    resposta = await WhatsAppAgent(llm, _FakeTools(), max_iteracoes=4).responder([], "loop")
    assert "tentar de novo" in resposta
    assert llm.chamadas == 4
