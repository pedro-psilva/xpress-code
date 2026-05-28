"""Configuração da aplicação.

Todos os valores são lidos de variáveis de ambiente / arquivo .env
(carregado via python-dotenv pelo pydantic-settings). Nada de segredos
hardcoded no código-fonte — ver escopo.md §5 (Imutabilidade e Segurança).
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

    # JWT (usado a partir do M2)
    jwt_secret: str = "troque-este-valor"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60


settings = Settings()
