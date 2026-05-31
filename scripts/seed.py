"""Popula o banco com dados iniciais (idempotente).

Uso (com a venv ativa e o Mongo no ar):
    python -m scripts.seed
"""
import asyncio
from datetime import datetime, timezone

from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.core.security import hash_senha

ADMIN_EMAIL = "admin@xpress.com"
ADMIN_SENHA = "admin123"

SERVICOS_BASE = [
    {"nome": "Corte", "preco": 40.00, "duracao_minutos": 30, "ativo": True},
    {"nome": "Barba", "preco": 30.00, "duracao_minutos": 20, "ativo": True},
    {"nome": "Corte + Barba", "preco": 65.00, "duracao_minutos": 50, "ativo": True},
    {"nome": "Acabamento", "preco": 20.00, "duracao_minutos": 15, "ativo": True},
    {"nome": "Sobrancelha", "preco": 15.00, "duracao_minutos": 10, "ativo": True},
    {"nome": "Pigmentação de barba", "preco": 50.00, "duracao_minutos": 40, "ativo": True},
    {"nome": "Hidratação capilar", "preco": 35.00, "duracao_minutos": 30, "ativo": True},
    {"nome": "Selagem", "preco": 90.00, "duracao_minutos": 60, "ativo": True},
    {"nome": "Relaxamento capilar", "preco": 80.00, "duracao_minutos": 60, "ativo": True},
    {"nome": "Platinado", "preco": 150.00, "duracao_minutos": 120, "ativo": True},
]

PLANOS_BASE = [
    {
        "nome": "UAU",
        "frequencia": "2x no mês (seg–qui)",
        "preco_corte": 70.00,
        "preco_corte_barba": 119.00,
        "desconto_extras": 0,
        "descricao": "Plano básico — manter o visual alinhado.",
        "ativo": True,
    },
    {
        "nome": "Flex",
        "frequencia": "1x por semana / 4x no mês (seg–qui)",
        "preco_corte": 149.00,
        "preco_corte_barba": 229.00,
        "desconto_extras": 5,
        "descricao": "Intermediário — visual sempre na régua o mês inteiro.",
        "ativo": True,
    },
    {
        "nome": "Essencial",
        "frequencia": "ilimitado (seg–qui)",
        "preco_corte": 229.00,
        "preco_corte_barba": 349.00,
        "desconto_extras": 10,
        "descricao": "Top — prioridade máxima e atendimentos sem limite.",
        "ativo": True,
    },
]


async def seed_admin(db) -> None:
    if await db["usuarios"].find_one({"email": ADMIN_EMAIL}):
        print(f"Admin ja existe: {ADMIN_EMAIL}")
        return
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


async def seed_servicos(db) -> None:
    inseridos = 0
    for servico in SERVICOS_BASE:
        if await db["servicos"].find_one({"nome": servico["nome"]}):
            continue
        await db["servicos"].insert_one(servico)
        inseridos += 1
    print(
        f"Servicos: {inseridos} novo(s), "
        f"{len(SERVICOS_BASE) - inseridos} ja existiam."
    )


async def seed_planos(db) -> None:
    inseridos = 0
    for plano in PLANOS_BASE:
        if await db["planos"].find_one({"nome": plano["nome"]}):
            continue
        await db["planos"].insert_one(plano)
        inseridos += 1
    print(
        f"Planos: {inseridos} novo(s), "
        f"{len(PLANOS_BASE) - inseridos} ja existiam."
    )


async def main() -> None:
    await connect_to_mongo()
    db = get_database()
    await seed_admin(db)
    await seed_servicos(db)
    await seed_planos(db)
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
