import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.exceptions import DomainError
from app.models.agendamento import AgendamentoCreate
from app.models.usuario import Perfil, UsuarioCreate
from app.models.whatsapp import IntegracaoStatus
from app.services.agenda_tools import AgendaTools
from app.services.agendamento_service import AgendamentoService
from app.services.disponibilidade_service import DisponibilidadeService
from app.services.gemini_client import GeminiClient
from app.services.servico_service import ServicoService
from app.services.usuario_service import UsuarioService
from app.services.whatsapp_agent import WhatsAppAgent
from app.services.whatsapp_client import WhatsAppClient

CONVERSA_TTL = timedelta(minutes=15)
REGEX_DATA = re.compile(r"^(\d{2})/(\d{2})$")
REGEX_HORA = re.compile(r"^(\d{2}):(\d{2})$")


class WhatsAppService:
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        client: WhatsAppClient,
        usuario_service: UsuarioService,
        servico_service: ServicoService,
        agendamento_service: AgendamentoService,
        disponibilidade_service: DisponibilidadeService,
        gemini_client: GeminiClient,
    ) -> None:
        self._db = db
        self._client = client
        self._usuario_service = usuario_service
        self._servico_service = servico_service
        self._agendamento_service = agendamento_service
        self._disponibilidade_service = disponibilidade_service
        self._gemini = gemini_client
        self._conversas = db["conversas_whatsapp"]
        self._usuarios = db["usuarios"]

    async def status(self) -> IntegracaoStatus:
        if not self._client.configurado:
            return IntegracaoStatus(configurado=False, valido=False)
        info = await self._client.info_numero()
        if info is None:
            return IntegracaoStatus(configurado=True, valido=False)
        return IntegracaoStatus(
            configurado=True,
            valido=True,
            numero=info.get("display_phone_number"),
            nome_verificado=info.get("verified_name"),
        )

    async def processar_webhook(self, payload: dict[str, Any]) -> None:
        if payload.get("object") != "whatsapp_business_account":
            return
        for entry in payload.get("entry") or []:
            for change in entry.get("changes") or []:
                if change.get("field") != "messages":
                    continue
                value = change.get("value") or {}
                for msg in value.get("messages") or []:
                    await self._tratar_mensagem(msg)

    async def _tratar_mensagem(self, msg: dict[str, Any]) -> None:
        telefone = msg.get("from")
        texto = _extrair_texto(msg)
        if not telefone or not texto:
            return
        resposta = await self._processar_mensagem(telefone, texto.strip())
        if resposta:
            await self._client.enviar_texto(telefone, resposta)

    # ---------- Bot ----------

    async def _processar_mensagem(self, telefone: str, texto: str) -> str:
        cliente = await self._achar_cliente(telefone)
        if cliente is not None and self._gemini.configurado:
            return await self._processar_com_ia(telefone, texto, cliente)
        return await self._processar_fsm(telefone, texto)

    async def _processar_com_ia(
        self, telefone: str, texto: str, cliente: dict[str, Any]
    ) -> str:
        if not await self._dentro_do_limite(telefone):
            return (
                "Recebi muitas mensagens em pouco tempo. "
                "Aguarde um instante e tente de novo. 🙏"
            )
        pergunta = texto.strip()[:1000]
        historico = await self._carregar_historico(telefone)
        tools = AgendaTools(
            cliente,
            self._servico_service,
            self._usuario_service,
            self._agendamento_service,
            self._disponibilidade_service,
        )
        agente = WhatsAppAgent(self._gemini, tools)
        try:
            resposta = await agente.responder(historico, pergunta)
        except DomainError as err:
            resposta = f"Não consegui concluir: {err.detail}"
        await self._salvar_historico(telefone, historico, pergunta, resposta)
        return resposta

    async def _dentro_do_limite(self, telefone: str) -> bool:
        agora = datetime.now(timezone.utc)
        conv = await self._conversas.find_one({"telefone": telefone}) or {}
        inicio = conv.get("janela_inicio")
        count = conv.get("janela_count", 0)
        if inicio is None or agora - inicio > timedelta(minutes=1):
            inicio, count = agora, 0
        count += 1
        await self._conversas.update_one(
            {"telefone": telefone},
            {
                "$set": {
                    "janela_inicio": inicio,
                    "janela_count": count,
                    "expira_em": agora + CONVERSA_TTL,
                }
            },
            upsert=True,
        )
        return count <= settings.whatsapp_msg_limite_min

    async def _carregar_historico(self, telefone: str) -> list[dict[str, Any]]:
        conv = await self._carregar_conversa(telefone)
        return (conv or {}).get("historico", [])

    async def _salvar_historico(
        self, telefone: str, historico: list[dict[str, Any]], pergunta: str, resposta: str
    ) -> None:
        novo = [
            *historico,
            {"role": "user", "content": pergunta},
            {"role": "assistant", "content": resposta},
        ][-20:]
        await self._conversas.update_one(
            {"telefone": telefone},
            {
                "$set": {
                    "historico": novo,
                    "expira_em": datetime.now(timezone.utc) + CONVERSA_TTL,
                }
            },
            upsert=True,
        )

    async def _processar_fsm(self, telefone: str, texto: str) -> str:
        comando = texto.lower()
        if comando in {"cancelar", "menu", "voltar", "0"}:
            await self._reset_conversa(telefone)
            return await self._mensagem_menu(telefone)

        conversa = await self._carregar_conversa(telefone)
        cliente = await self._achar_cliente(telefone)

        if cliente is None:
            return await self._fluxo_cadastro(telefone, texto, conversa)

        passo = (conversa or {}).get("passo") or "inicio"
        dados = (conversa or {}).get("dados", {})

        if passo == "inicio":
            return await self._handle_inicio(telefone, comando, cliente)
        if passo == "escolher_servico":
            return await self._handle_escolher_servico(telefone, comando, dados)
        if passo == "escolher_profissional":
            return await self._handle_escolher_profissional(telefone, comando, dados)
        if passo == "escolher_data":
            return await self._handle_escolher_data(telefone, comando, dados)
        if passo == "escolher_hora":
            return await self._handle_escolher_hora(telefone, comando, dados)
        if passo == "confirmar":
            return await self._handle_confirmar(telefone, comando, dados, cliente)

        await self._reset_conversa(telefone)
        return await self._mensagem_menu(telefone)

    async def _fluxo_cadastro(
        self, telefone: str, texto: str, conversa: dict[str, Any] | None
    ) -> str:
        passo = (conversa or {}).get("passo")
        if passo != "aguardando_nome":
            await self._salvar_conversa(telefone, "aguardando_nome", {})
            return (
                "Olá! 👋 Sou o assistente da *Xpress Code*.\n"
                "Antes de marcar seu horário, como podemos te chamar?"
            )
        nome = texto.strip()
        if len(nome) < 2:
            return "Por favor, me envie um nome válido (mínimo 2 letras)."
        await self._criar_cliente(telefone, nome)
        await self._salvar_conversa(telefone, "inicio", {})
        return (
            f"Prazer, *{nome}*! Cadastrado por aqui. ✂️\n\n"
            + await self._mensagem_menu(telefone)
        )

    async def _handle_inicio(self, telefone: str, texto: str, cliente: dict) -> str:
        if texto in {"1", "agendar"}:
            servicos = await self._servicos_ativos()
            if not servicos:
                return "Não temos serviços disponíveis no momento. 😕"
            await self._salvar_conversa(telefone, "escolher_servico", {})
            return _menu_lista("Qual serviço você quer?", [s["nome"] for s in servicos])
        return await self._mensagem_menu(telefone, saudacao=f"Olá, {cliente['nome']}!")

    async def _handle_escolher_servico(self, telefone: str, texto: str, dados: dict) -> str:
        servicos = await self._servicos_ativos()
        indice = _parse_indice(texto, len(servicos))
        if indice is None:
            return _menu_lista(
                "Não entendi. Escolha um número da lista:",
                [s["nome"] for s in servicos],
            )
        dados["servico_id"] = servicos[indice]["id"]
        dados["servico_nome"] = servicos[indice]["nome"]
        profissionais = await self._profissionais()
        if not profissionais:
            await self._reset_conversa(telefone)
            return "Nenhum profissional cadastrado no momento. 😕"
        await self._salvar_conversa(telefone, "escolher_profissional", dados)
        return _menu_lista(
            "Com qual profissional?", [u["nome"] for u in profissionais]
        )

    async def _handle_escolher_profissional(self, telefone: str, texto: str, dados: dict) -> str:
        profissionais = await self._profissionais()
        indice = _parse_indice(texto, len(profissionais))
        if indice is None:
            return _menu_lista(
                "Não entendi. Escolha um número:", [u["nome"] for u in profissionais]
            )
        dados["profissional_id"] = profissionais[indice]["id"]
        dados["profissional_nome"] = profissionais[indice]["nome"]
        await self._salvar_conversa(telefone, "escolher_data", dados)
        return "Em qual dia? Responda no formato *DD/MM* (ex: 30/05)."

    async def _handle_escolher_data(self, telefone: str, texto: str, dados: dict) -> str:
        data = _parse_data(texto)
        if data is None:
            return "Data inválida. Use *DD/MM* (ex: 30/05). Não pode ser uma data passada."
        dados["data"] = data.isoformat()
        await self._salvar_conversa(telefone, "escolher_hora", dados)
        return "Em qual horário? Responda no formato *HH:MM* (ex: 14:30)."

    async def _handle_escolher_hora(self, telefone: str, texto: str, dados: dict) -> str:
        hora = _parse_hora(texto)
        if hora is None:
            return "Horário inválido. Use *HH:MM* (ex: 14:30)."
        data = datetime.fromisoformat(dados["data"]).replace(
            hour=hora[0], minute=hora[1]
        )
        dados["data_hora_inicio"] = data.isoformat()
        await self._salvar_conversa(telefone, "confirmar", dados)
        return (
            "Vou confirmar:\n"
            f"• Serviço: *{dados['servico_nome']}*\n"
            f"• Profissional: *{dados['profissional_nome']}*\n"
            f"• Quando: *{data.strftime('%d/%m às %H:%M')}*\n\n"
            "Responda *SIM* para confirmar ou *CANCELAR* para refazer."
        )

    async def _handle_confirmar(
        self, telefone: str, texto: str, dados: dict, cliente: dict
    ) -> str:
        if texto not in {"sim", "s", "confirmar", "ok"}:
            return "Para confirmar responda *SIM*. Para refazer responda *CANCELAR*."
        try:
            payload = AgendamentoCreate(
                cliente_id=cliente["id"],
                profissional_id=dados["profissional_id"],
                servico_id=dados["servico_id"],
                data_hora_inicio=datetime.fromisoformat(dados["data_hora_inicio"]),
            )
            await self._agendamento_service.criar(payload)
        except DomainError as err:
            await self._reset_conversa(telefone)
            return f"Não consegui agendar: {err.detail}\nResponda *MENU* para tentar de novo."
        await self._reset_conversa(telefone)
        return (
            "✅ Agendado! Te aguardamos no horário marcado.\n"
            "Para outro horário, responda *AGENDAR*."
        )

    # ---------- Helpers ----------

    async def _mensagem_menu(self, _telefone: str, saudacao: str | None = None) -> str:
        base = saudacao or "Olá! 👋"
        return (
            f"{base}\n\n"
            "Como posso ajudar?\n"
            "1️⃣  Agendar um horário\n\n"
            "Digite *1* (ou _agendar_) para começar. A qualquer momento envie "
            "*MENU* ou *CANCELAR* para recomeçar."
        )

    async def _carregar_conversa(self, telefone: str) -> dict[str, Any] | None:
        conv = await self._conversas.find_one({"telefone": telefone})
        if conv and conv.get("expira_em") and conv["expira_em"] < datetime.now(timezone.utc):
            await self._conversas.delete_one({"telefone": telefone})
            return None
        return conv

    async def _salvar_conversa(
        self, telefone: str, passo: str, dados: dict[str, Any]
    ) -> None:
        await self._conversas.update_one(
            {"telefone": telefone},
            {
                "$set": {
                    "passo": passo,
                    "dados": dados,
                    "expira_em": datetime.now(timezone.utc) + CONVERSA_TTL,
                }
            },
            upsert=True,
        )

    async def _reset_conversa(self, telefone: str) -> None:
        await self._conversas.delete_one({"telefone": telefone})

    async def _achar_cliente(self, telefone: str) -> dict[str, Any] | None:
        doc = await self._usuarios.find_one(
            {"telefone": telefone, "perfil": Perfil.cliente.value}
        )
        if doc is None:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc

    async def _criar_cliente(self, telefone: str, nome: str) -> dict[str, Any]:
        # Email fake e senha aleatória — o cliente que vem pelo WhatsApp não
        # precisa logar no app web. Ele se cadastra depois se quiser.
        payload = UsuarioCreate(
            nome=nome,
            email=f"wa-{telefone}@bot.xpresscode.com.br",
            senha=secrets.token_hex(16),
            telefone=telefone,
            perfil=Perfil.cliente,
        )
        return await self._usuario_service.criar(payload)

    async def _servicos_ativos(self) -> list[dict[str, Any]]:
        return await self._servico_service.listar({"ativo": True})

    async def _profissionais(self) -> list[dict[str, Any]]:
        return await self._usuario_service.listar({"perfil": Perfil.profissional.value})


def _extrair_texto(msg: dict[str, Any]) -> str | None:
    if not msg:
        return None
    if msg.get("type") == "text":
        return (msg.get("text") or {}).get("body")
    return None


def _parse_indice(texto: str, total: int) -> int | None:
    try:
        n = int(texto)
    except ValueError:
        return None
    if 1 <= n <= total:
        return n - 1
    return None


def _parse_data(texto: str):
    m = REGEX_DATA.match(texto)
    if not m:
        return None
    dia, mes = int(m.group(1)), int(m.group(2))
    hoje = datetime.now().date()
    try:
        data = datetime(hoje.year, mes, dia).date()
    except ValueError:
        return None
    if data < hoje:
        return None
    return data


def _parse_hora(texto: str) -> tuple[int, int] | None:
    m = REGEX_HORA.match(texto)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if 0 <= h <= 23 and 0 <= mi <= 59:
        return h, mi
    return None


def _menu_lista(titulo: str, itens: list[str]) -> str:
    linhas = "\n".join(f"{i + 1}. {nome}" for i, nome in enumerate(itens))
    return f"{titulo}\n\n{linhas}\n\nResponda com o número."
