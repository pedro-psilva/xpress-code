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

CLIENTES_DEMO = [
    {"nome": "Lucas Andrade", "telefone": "5531988880001"},
    {"nome": "Rafael Oliveira", "telefone": "5531988880002"},
    {"nome": "Pedro Henrique Costa", "telefone": "5531988880003"},
    {"nome": "Matheus Rocha", "telefone": "5531988880004"},
    {"nome": "Bruno Carvalho", "telefone": "5531988880005"},
]

ASSINATURAS_DEMO = [
    {"cliente_telefone": "5531988880001", "plano_nome": "Flex",      "inclui_barba": False, "status": "ativa"},
    {"cliente_telefone": "5531988880002", "plano_nome": "Essencial", "inclui_barba": True,  "status": "ativa"},
    {"cliente_telefone": "5531988880003", "plano_nome": "UAU",       "inclui_barba": False, "status": "ativa"},
    {"cliente_telefone": "5531988880004", "plano_nome": "Flex",      "inclui_barba": True,  "status": "pendente"},
    {"cliente_telefone": "5531988880005", "plano_nome": "UAU",       "inclui_barba": True,  "status": "ativa"},
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


async def seed_clientes_demo(db) -> None:
    import secrets

    from app.core.security import hash_senha

    inseridos = 0
    for cliente in CLIENTES_DEMO:
        if await db["usuarios"].find_one({"telefone": cliente["telefone"]}):
            continue
        await db["usuarios"].insert_one(
            {
                "nome": cliente["nome"],
                "email": f"wa-{cliente['telefone']}@xpress.local",
                "telefone": cliente["telefone"],
                "perfil": "cliente",
                "senha_hash": hash_senha(secrets.token_hex(16)),
                "criado_em": datetime.now(timezone.utc),
            }
        )
        inseridos += 1
    print(
        f"Clientes demo: {inseridos} novo(s), "
        f"{len(CLIENTES_DEMO) - inseridos} ja existiam."
    )


async def seed_assinaturas_demo(db) -> None:
    from datetime import timedelta

    inseridos = 0
    for assinatura in ASSINATURAS_DEMO:
        cliente = await db["usuarios"].find_one(
            {"telefone": assinatura["cliente_telefone"]}
        )
        plano = await db["planos"].find_one({"nome": assinatura["plano_nome"]})
        if cliente is None or plano is None:
            continue
        cliente_id = str(cliente["_id"])
        plano_id = str(plano["_id"])
        if await db["assinaturas"].find_one(
            {"cliente_id": cliente_id, "plano_id": plano_id}
        ):
            continue
        agora = datetime.now(timezone.utc)
        proxima = (
            agora - timedelta(days=3)
            if assinatura["status"] == "pendente"
            else agora + timedelta(days=20)
        )
        await db["assinaturas"].insert_one(
            {
                "cliente_id": cliente_id,
                "plano_id": plano_id,
                "inclui_barba": assinatura["inclui_barba"],
                "status": assinatura["status"],
                "proxima_cobranca": proxima,
                "ultima_cobranca": None,
                "ultimo_link_pagamento": None,
            }
        )
        inseridos += 1
    print(
        f"Assinaturas demo: {inseridos} novo(s), "
        f"{len(ASSINATURAS_DEMO) - inseridos} ja existiam."
    )


async def main() -> None:
    await connect_to_mongo()
    db = get_database()
    await seed_admin(db)
    await seed_servicos(db)
    await seed_planos(db)
    await seed_clientes_demo(db)
    await seed_assinaturas_demo(db)
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
