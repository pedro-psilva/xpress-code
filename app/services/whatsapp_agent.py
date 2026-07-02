"""Agente conversacional do WhatsApp (provider-agnóstico).

Orquestra o loop de function-calling sobre o AgendaTools. Guard rails aqui:
whitelist de ferramentas, teto de iterações e tradução de erros de domínio em
mensagem para o modelo (nunca derruba o fluxo). A autorização por cliente vive
no AgendaTools.
"""
from typing import Any, Protocol

from app.core.exceptions import DomainError
from app.services.agenda_tools import AgendaTools

SYSTEM_PROMPT = (
    "Você é o assistente virtual da barbearia Xpress Code no WhatsApp. "
    "Ajude o cliente a ver horários livres e a agendar, remarcar ou cancelar. "
    "Use sempre as ferramentas para consultar e alterar a agenda; nunca invente "
    "horários, preços ou confirmações. Você só pode gerenciar os agendamentos "
    "deste cliente. Recuse pedidos fora do contexto de agendamento. Responda em "
    "português, de forma curta e cordial."
)

FERRAMENTAS: list[dict[str, Any]] = [
    {
        "nome": "listar_servicos",
        "descricao": "Lista os serviços disponíveis com preço e duração.",
        "parametros": {"type": "object", "properties": {}},
    },
    {
        "nome": "listar_profissionais",
        "descricao": "Lista os profissionais disponíveis.",
        "parametros": {"type": "object", "properties": {}},
    },
    {
        "nome": "consultar_disponibilidade",
        "descricao": "Lista horários livres de um profissional para um serviço num dia.",
        "parametros": {
            "type": "object",
            "properties": {
                "profissional_id": {"type": "string"},
                "servico_id": {"type": "string"},
                "dia": {"type": "string", "description": "Dia no formato YYYY-MM-DD"},
            },
            "required": ["profissional_id", "servico_id", "dia"],
        },
    },
    {
        "nome": "criar_agendamento",
        "descricao": "Agenda um horário para o cliente.",
        "parametros": {
            "type": "object",
            "properties": {
                "profissional_id": {"type": "string"},
                "servico_id": {"type": "string"},
                "data_hora_inicio": {"type": "string", "description": "ISO 8601"},
            },
            "required": ["profissional_id", "servico_id", "data_hora_inicio"],
        },
    },
    {
        "nome": "listar_meus_agendamentos",
        "descricao": "Lista os agendamentos ativos do cliente.",
        "parametros": {"type": "object", "properties": {}},
    },
    {
        "nome": "cancelar_agendamento",
        "descricao": "Cancela um agendamento do cliente pelo id.",
        "parametros": {
            "type": "object",
            "properties": {"agendamento_id": {"type": "string"}},
            "required": ["agendamento_id"],
        },
    },
    {
        "nome": "reagendar_agendamento",
        "descricao": "Remarca um agendamento do cliente para um novo horário.",
        "parametros": {
            "type": "object",
            "properties": {
                "agendamento_id": {"type": "string"},
                "data_hora_inicio": {"type": "string", "description": "ISO 8601"},
            },
            "required": ["agendamento_id", "data_hora_inicio"],
        },
    },
]


class LLM(Protocol):
    async def conversar(
        self,
        system: str,
        mensagens: list[dict[str, Any]],
        ferramentas: list[dict[str, Any]],
    ) -> dict[str, Any]:
        ...


class WhatsAppAgent:
    def __init__(self, llm: LLM, tools: AgendaTools, max_iteracoes: int = 6) -> None:
        self._llm = llm
        self._tools = tools
        self._max_iteracoes = max_iteracoes

    async def responder(
        self, historico: list[dict[str, Any]], mensagem: str
    ) -> str:
        mensagens = [*historico, {"role": "user", "content": mensagem}]
        for _ in range(self._max_iteracoes):
            resposta = await self._llm.conversar(SYSTEM_PROMPT, mensagens, FERRAMENTAS)
            chamadas = resposta.get("chamadas") or []
            if not chamadas:
                return resposta.get("texto") or "Desculpe, não entendi. Pode repetir?"
            mensagens.append(
                {"role": "assistant", "content": resposta.get("texto"), "chamadas": chamadas}
            )
            for chamada in chamadas:
                resultado = await self._executar(
                    chamada.get("nome", ""), chamada.get("args") or {}
                )
                mensagens.append(
                    {"role": "tool", "nome": chamada.get("nome"), "content": resultado}
                )
        return "Não consegui concluir agora. Pode tentar de novo?"

    async def _executar(self, nome: str, args: dict[str, Any]) -> dict[str, Any]:
        acoes = {
            "listar_servicos": self._tools.listar_servicos,
            "listar_profissionais": self._tools.listar_profissionais,
            "consultar_disponibilidade": self._tools.consultar_disponibilidade,
            "criar_agendamento": self._tools.criar_agendamento,
            "listar_meus_agendamentos": self._tools.listar_meus_agendamentos,
            "cancelar_agendamento": self._tools.cancelar_agendamento,
            "reagendar_agendamento": self._tools.reagendar_agendamento,
        }
        acao = acoes.get(nome)
        if acao is None:
            return {"erro": "ferramenta desconhecida"}
        try:
            return {"resultado": await acao(**args)}
        except DomainError as erro:
            return {"erro": erro.detail}
        except (ValueError, TypeError):
            return {"erro": "argumentos inválidos"}
