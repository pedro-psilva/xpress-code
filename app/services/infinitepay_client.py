import httpx

from app.core.config import settings

INFINITEPAY_LINKS_URL = "https://api.checkout.infinitepay.io/links"
INFINITEPAY_CHECK_URL = "https://api.checkout.infinitepay.io/payment_check"


class InfinitePayClient:
    def __init__(self) -> None:
        self.handle = settings.infinitepay_handle
        self.redirect_url = settings.infinitepay_redirect_url
        base_webhook = f"{settings.public_api_url.rstrip('/')}/webhooks/infinitepay"
        if settings.infinitepay_webhook_token:
            self.webhook_url = f"{base_webhook}?token={settings.infinitepay_webhook_token}"
        else:
            self.webhook_url = base_webhook

    @property
    def configurado(self) -> bool:
        return bool(self.handle)

    async def criar_link(
        self,
        order_nsu: str,
        descricao: str,
        valor_reais: float,
    ) -> dict | None:
        if not self.configurado:
            return None
        body = {
            "handle": self.handle,
            "redirect_url": self.redirect_url or self.webhook_url,
            "webhook_url": self.webhook_url,
            "order_nsu": order_nsu,
            "items": [
                {
                    "name": descricao,
                    "quantity": 1,
                    "price": int(round(valor_reais * 100)),
                }
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=15) as cli:
                r = await cli.post(INFINITEPAY_LINKS_URL, json=body)
                if r.status_code in (200, 201):
                    return r.json()
        except httpx.HTTPError:
            return None
        return None

    async def consultar(self, order_nsu: str, transaction_nsu: str, slug: str) -> dict | None:
        if not self.configurado:
            return None
        body = {
            "handle": self.handle,
            "order_nsu": order_nsu,
            "transaction_nsu": transaction_nsu,
            "slug": slug,
        }
        try:
            async with httpx.AsyncClient(timeout=10) as cli:
                r = await cli.post(INFINITEPAY_CHECK_URL, json=body)
                if r.status_code == 200:
                    return r.json()
        except httpx.HTTPError:
            return None
        return None
