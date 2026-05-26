"""Cria um usuário admin inicial (idempotente).

Uso (com a venv ativa e o Mongo no ar):
    python -m scripts.seed
"""
import asyncio
from datetime import datetime, timezone

from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.core.security import hash_senha

ADMIN_EMAIL = "admin@xpress.com"
ADMIN_SENHA = "admin123"


async def main() -> None:
    await connect_to_mongo()
    db = get_database()
    if await db["usuarios"].find_one({"email": ADMIN_EMAIL}):
        print(f"Admin já existe: {ADMIN_EMAIL}")
    else:
        await db["usuarios"].insert_one(
            {
                "nome": "Administrador",
                "email": ADMIN_EMAIL,
                "telefone": None,
                "perfil": "admin",
                "senha_hash": hash_senha(ADMIN_SENHA),
                "criado_em": datetime.now(timezone.utc),
            }
        )
        print(f"Admin criado: {ADMIN_EMAIL} / senha: {ADMIN_SENHA}")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
