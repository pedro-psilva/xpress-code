"""Configuração da aplicação.

Todos os valores são lidos de variáveis de ambiente / arquivo .env
(carregado via python-dotenv pelo pydantic-settings). Nada de segredos
hardcoded no código-fonte — ver escopo.md §5 (Imutabilidade e Segurança).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # CORS — origens permitidas para o frontend (SPA)
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # JWT (usado a partir do M2)
    jwt_secret: str = "troque-este-valor"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60


settings = Settings()
