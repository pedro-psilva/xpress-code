import httpx

from app.core.config import settings

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


class BrevoClient:
    def __init__(self) -> None:
        self.api_key = settings.brevo_api_key
        self.sender_email = settings.brevo_sender_email
        self.sender_name = settings.brevo_sender_name

    @property
    def configurado(self) -> bool:
        return bool(self.api_key)

    async def enviar(
        self,
        destinatario_email: str,
        destinatario_nome: str,
        assunto: str,
        html: str,
        texto: str,
    ) -> bool:
        if not self.configurado:
            return False
        body = {
            "sender": {"email": self.sender_email, "name": self.sender_name},
            "to": [{"email": destinatario_email, "name": destinatario_nome}],
            "subject": assunto,
            "htmlContent": html,
            "textContent": texto,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as cli:
                r = await cli.post(
                    BREVO_URL,
                    headers={"api-key": self.api_key, "Content-Type": "application/json"},
                    json=body,
                )
                return r.status_code in (200, 201)
        except httpx.HTTPError:
            return False
