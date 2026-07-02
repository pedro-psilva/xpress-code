import pytest

from app.services.usuario_service import UsuarioService


@pytest.fixture
def usuarios(make_repo):
    return UsuarioService(make_repo())


async def _semear(service, quantidade):
    from app.models.usuario import Perfil, UsuarioCreate

    for i in range(quantidade):
        await service.criar(
            UsuarioCreate(
                nome=f"U{i}",
                email=f"u{i}@e.com",
                senha="senha123",
                perfil=Perfil.cliente,
            )
        )


async def test_limit_restringe_quantidade(usuarios):
    await _semear(usuarios, 5)
    pagina = await usuarios.listar(limit=2)
    assert len(pagina) == 2


async def test_skip_avanca_pagina(usuarios):
    await _semear(usuarios, 5)
    todos = await usuarios.listar()
    pulados = await usuarios.listar(skip=3)
    assert len(todos) == 5
    assert len(pulados) == 2


async def test_sem_paginacao_retorna_tudo(usuarios):
    await _semear(usuarios, 3)
    assert len(await usuarios.listar()) == 3
