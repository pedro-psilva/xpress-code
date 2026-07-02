"""Adaptador do Google Gemini para o contrato LLM do agente do WhatsApp.

Traduz a lista de mensagens neutra (user/assistant/tool) e as ferramentas para
o formato do google-genai e de volta. Sem GEMINI_API_KEY, `configurado` é False
e o agente não é usado.
"""
from typing import Any

from app.core.config import settings


class GeminiClient:
    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key
        self._model = settings.gemini_model
        self._cliente = None

    @property
    def configurado(self) -> bool:
        return bool(self._api_key)

    def _obter_cliente(self):
        if self._cliente is None:
            from google import genai

            self._cliente = genai.Client(api_key=self._api_key)
        return self._cliente

    async def conversar(
        self,
        system: str,
        mensagens: list[dict[str, Any]],
        ferramentas: list[dict[str, Any]],
    ) -> dict[str, Any]:
        from google.genai import types

        tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name=f["nome"],
                    description=f["descricao"],
                    parameters=f["parametros"],
                )
                for f in ferramentas
            ]
        )
        config = types.GenerateContentConfig(
            system_instruction=system,
            tools=[tool],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        )
        contents = _para_contents(mensagens, types)
        resposta = await self._obter_cliente().aio.models.generate_content(
            model=self._model, contents=contents, config=config
        )
        return _extrair_resposta(resposta)


def _para_contents(mensagens: list[dict[str, Any]], types) -> list[Any]:
    contents = []
    for msg in mensagens:
        papel = msg["role"]
        if papel == "user":
            contents.append(
                types.Content(role="user", parts=[types.Part(text=msg["content"])])
            )
        elif papel == "assistant":
            partes = []
            if msg.get("content"):
                partes.append(types.Part(text=msg["content"]))
            for chamada in msg.get("chamadas") or []:
                partes.append(
                    types.Part(
                        function_call=types.FunctionCall(
                            name=chamada["nome"], args=chamada.get("args") or {}
                        )
                    )
                )
            contents.append(types.Content(role="model", parts=partes))
        elif papel == "tool":
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=msg["nome"], response={"resultado": msg["content"]}
                            )
                        )
                    ],
                )
            )
    return contents


def _extrair_resposta(resposta: Any) -> dict[str, Any]:
    chamadas = []
    textos = []
    candidatos = getattr(resposta, "candidates", None) or []
    for candidato in candidatos:
        conteudo = getattr(candidato, "content", None)
        for parte in getattr(conteudo, "parts", None) or []:
            chamada = getattr(parte, "function_call", None)
            if chamada is not None:
                chamadas.append(
                    {"nome": chamada.name, "args": dict(chamada.args or {})}
                )
            elif getattr(parte, "text", None):
                textos.append(parte.text)
    return {"texto": "".join(textos) or None, "chamadas": chamadas}
