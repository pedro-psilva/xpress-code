import httpx

from app.core.config import settings


class WhatsAppClient:
    """Wrapper HTTP da Evolution API. Não levanta exceção quando a integração
    não está configurada — quem usa decide o que fazer (devolver 503, etc.)."""

    def __init__(self) -> None:
        self.base_url = settings.whatsapp_api_url.rstrip("/")
        self.api_key = settings.whatsapp_api_key
        self.instance = settings.whatsapp_instance_name
        self.webhook_url = settings.whatsapp_webhook_url

    @property
    def configurado(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict[str, str]:
        return {"apikey": self.api_key, "Content-Type": "application/json"}

    async def status(self) -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=10) as cli:
                r = await cli.get(
                    f"{self.base_url}/instance/connectionState/{self.instance}",
                    headers=self._headers(),
                )
                if r.status_code == 200:
                    return r.json()
        except httpx.HTTPError:
            return None
        return None

    async def criar_instancia(self) -> dict:
        body = {
            "instanceName": self.instance,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS",
            "webhook": {
                "url": self.webhook_url,
                "byEvents": False,
                "events": ["MESSAGES_UPSERT"],
            },
        }
        async with httpx.AsyncClient(timeout=30) as cli:
            r = await cli.post(
                f"{self.base_url}/instance/create",
                headers=self._headers(),
                json=body,
            )
            return r.json()

    async def conectar(self) -> dict:
        async with httpx.AsyncClient(timeout=30) as cli:
            r = await cli.get(
                f"{self.base_url}/instance/connect/{self.instance}",
                headers=self._headers(),
            )
            return r.json()

    async def desconectar(self) -> None:
        async with httpx.AsyncClient(timeout=15) as cli:
            await cli.delete(
                f"{self.base_url}/instance/logout/{self.instance}",
                headers=self._headers(),
            )

    async def enviar_texto(self, telefone: str, texto: str) -> None:
        body = {"number": telefone, "text": texto}
        try:
            async with httpx.AsyncClient(timeout=15) as cli:
                await cli.post(
                    f"{self.base_url}/message/sendText/{self.instance}",
                    headers=self._headers(),
                    json=body,
                )
        except httpx.HTTPError:
            # Falha de envio não derruba o webhook (Evolution reentrega se erro 5xx).
            pass
