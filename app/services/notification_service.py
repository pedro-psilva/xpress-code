from app.services.brevo_client import BrevoClient
from app.services.whatsapp_client import WhatsAppClient


class NotificationService:
    def __init__(self, brevo: BrevoClient, whatsapp: WhatsAppClient) -> None:
        self._brevo = brevo
        self._whatsapp = whatsapp

    async def enviar_cobranca(
        self,
        cliente: dict,
        plano_nome: str,
        valor_reais: float,
        link_pagamento: str,
    ) -> dict[str, bool]:
        assunto = f"Cobranca do seu plano {plano_nome} - Xpress Code"
        texto = (
            f"Ola, {cliente.get('nome', 'cliente')}!\n\n"
            f"Sua mensalidade do plano {plano_nome} (R$ {valor_reais:.2f}) esta disponivel.\n"
            f"Pagamento (Pix ou cartao): {link_pagamento}\n\n"
            "Obrigado!\nXpress Code"
        )
        html = (
            f"<p>Olá, <strong>{cliente.get('nome', 'cliente')}</strong>!</p>"
            f"<p>Sua mensalidade do plano <strong>{plano_nome}</strong> "
            f"(R$ {valor_reais:.2f}) está disponível.</p>"
            f"<p><a href=\"{link_pagamento}\">Pagar agora (Pix ou cartão)</a></p>"
            "<p>Obrigado!<br>Xpress Code</p>"
        )
        email_enviado = False
        whatsapp_enviado = False

        email = (cliente.get("email") or "").lower()
        if email and not email.startswith("wa-"):
            email_enviado = await self._brevo.enviar(
                destinatario_email=email,
                destinatario_nome=cliente.get("nome", ""),
                assunto=assunto,
                html=html,
                texto=texto,
            )

        telefone = cliente.get("telefone")
        if telefone and self._whatsapp.configurado:
            await self._whatsapp.enviar_texto(telefone, texto)
            whatsapp_enviado = True

        return {"email": email_enviado, "whatsapp": whatsapp_enviado}

    async def enviar_reset_senha(self, cliente: dict, token: str) -> bool:
        email = (cliente.get("email") or "").lower()
        if not email or email.startswith("wa-"):
            return False
        assunto = "Redefinição de senha - Xpress Code"
        texto = (
            f"Ola, {cliente.get('nome', 'cliente')}!\n\n"
            f"Use este codigo para redefinir sua senha: {token}\n"
            "Se voce nao pediu isso, ignore este e-mail.\nXpress Code"
        )
        html = (
            f"<p>Olá, <strong>{cliente.get('nome', 'cliente')}</strong>!</p>"
            "<p>Use este código para redefinir sua senha:</p>"
            f"<p><code>{token}</code></p>"
            "<p>Se você não pediu isso, ignore este e-mail.<br>Xpress Code</p>"
        )
        return await self._brevo.enviar(
            destinatario_email=email,
            destinatario_nome=cliente.get("nome", ""),
            assunto=assunto,
            html=html,
            texto=texto,
        )

    async def enviar_lembrete(self, cliente: dict, quando: str) -> dict[str, bool]:
        assunto = "Lembrete do seu agendamento - Xpress Code"
        texto = (
            f"Ola, {cliente.get('nome', 'cliente')}!\n\n"
            f"Este e um lembrete do seu agendamento em {quando}.\n"
            "Ate la!\nXpress Code"
        )
        html = (
            f"<p>Olá, <strong>{cliente.get('nome', 'cliente')}</strong>!</p>"
            f"<p>Lembrete do seu agendamento em <strong>{quando}</strong>.</p>"
            "<p>Até lá!<br>Xpress Code</p>"
        )
        email_enviado = False
        whatsapp_enviado = False

        email = (cliente.get("email") or "").lower()
        if email and not email.startswith("wa-"):
            email_enviado = await self._brevo.enviar(
                destinatario_email=email,
                destinatario_nome=cliente.get("nome", ""),
                assunto=assunto,
                html=html,
                texto=texto,
            )

        telefone = cliente.get("telefone")
        if telefone and self._whatsapp.configurado:
            await self._whatsapp.enviar_texto(telefone, texto)
            whatsapp_enviado = True

        return {"email": email_enviado, "whatsapp": whatsapp_enviado}
