import httpx

from app.core.config import settings


class WhatsAppClient:
    def __init__(self) -> None:
        self.phone_number_id = settings.meta_phone_number_id
        self.access_token = settings.meta_access_token
        self.api_version = settings.meta_graph_api_version
        self.base_url = f"https://graph.facebook.com/{self.api_version}"

    @property
    def configurado(self) -> bool:
        return bool(self.access_token and self.phone_number_id)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def info_numero(self) -> dict | None:
        if not self.configurado:
            return None
        try:
            async with httpx.AsyncClient(timeout=10) as cli:
                r = await cli.get(
                    f"{self.base_url}/{self.phone_number_id}",
                    headers=self._headers(),
                    params={"fields": "display_phone_number,verified_name"},
                )
                if r.status_code == 200:
                    return r.json()
        except httpx.HTTPError:
            return None
        return None

    async def enviar_texto(self, telefone: str, texto: str) -> None:
        body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": telefone,
            "type": "text",
            "text": {"preview_url": False, "body": texto},
        }
        try:
            async with httpx.AsyncClient(timeout=15) as cli:
                await cli.post(
                    f"{self.base_url}/{self.phone_number_id}/messages",
                    headers=self._headers(),
                    json=body,
                )
        except httpx.HTTPError:
            pass
