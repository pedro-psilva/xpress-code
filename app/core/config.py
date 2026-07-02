"""Configuração da aplicação.

Todos os valores são lidos de variáveis de ambiente / arquivo .env
(carregado via python-dotenv pelo pydantic-settings). Nada de segredos
hardcoded no código-fonte.
"""
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "xpress_code"

    # API
    api_v1_prefix: str = "/api/v1"

    business_timezone: str = "America/Sao_Paulo"
    slot_step_minutos: int = 15
    cron_token: str = ""
    log_level: str = "INFO"

    # CORS — origens permitidas para clientes navegador (SPA web e Expo Web).
    # Apps React Native NATIVOS (iOS/Android) não enviam header Origin e não
    # sofrem CORS — só precisam alcançar a API pela rede (uvicorn --host 0.0.0.0).
    # Configurável via CORS_ORIGINS no .env (lista separada por vírgula).
    # NoDecode: impede o pydantic-settings de tentar fazer json.loads do valor
    # do .env; assim o validator abaixo recebe a string crua e a divide por vírgula.
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: str | list[str]) -> list[str]:
        """Aceita 'a,b,c' do .env e devolve ['a', 'b', 'c']."""
        if isinstance(value, str):
            return [origem.strip() for origem in value.split(",") if origem.strip()]
        return value

    # JWT
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    refresh_expire_minutes: int = 10080
    reset_expire_minutes: int = 30

    @field_validator("jwt_secret", mode="after")
    @classmethod
    def _jwt_secret_obrigatorio(cls, value: str) -> str:
        if not value:
            raise ValueError(
                "JWT_SECRET nao definido. Configure no .env (ver .env.example)."
            )
        if "troque" in value.lower():
            import sys

            print(
                "[!] AVISO: JWT_SECRET parece um valor de exemplo. "
                "Defina um segredo forte antes de subir em producao.",
                file=sys.stderr,
            )
        return value

    meta_graph_api_version: str = "v21.0"
    meta_phone_number_id: str = ""
    meta_access_token: str = ""
    meta_app_secret: str = ""
    meta_webhook_verify_token: str = ""

    brevo_api_key: str = ""
    brevo_sender_email: str = "no-reply@xpresscode.com.br"
    brevo_sender_name: str = "Barbearia Xpress Code"

    infinitepay_handle: str = ""
    infinitepay_redirect_url: str = ""
    infinitepay_webhook_token: str = ""
    public_api_url: str = "http://localhost:8000/api/v1"


settings = Settings()
