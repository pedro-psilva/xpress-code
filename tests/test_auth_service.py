import pytest

from app.core.exceptions import UnauthorizedError
from app.core.security import hash_senha, verificar_senha
from app.services.auth_service import AuthService


class _NotificacaoFake:
    def __init__(self) -> None:
        self.reset_token = None

    async def enviar_reset_senha(self, cliente, token):
        self.reset_token = token
        return True


async def _com_usuario(make_repo, notif=None):
    repo = make_repo()
    await repo.create(
        {"email": "admin@ex.com", "senha_hash": hash_senha("senha123"), "perfil": "admin"}
    )
    return AuthService(repo, notif or _NotificacaoFake()), repo


async def test_autenticar_credenciais_validas(make_repo):
    service, _ = await _com_usuario(make_repo)
    access, refresh, perfil = await service.autenticar("admin@ex.com", "senha123")
    assert access and refresh and perfil == "admin"


async def test_autenticar_senha_errada(make_repo):
    service, _ = await _com_usuario(make_repo)
    with pytest.raises(UnauthorizedError):
        await service.autenticar("admin@ex.com", "errada")


async def test_autenticar_usuario_inexistente(make_repo):
    service = AuthService(make_repo(), _NotificacaoFake())
    with pytest.raises(UnauthorizedError):
        await service.autenticar("naoexiste@ex.com", "senha123")


async def test_refresh_gera_novo_access(make_repo):
    service, _ = await _com_usuario(make_repo)
    _access, refresh, _perfil = await service.autenticar("admin@ex.com", "senha123")
    assert await service.renovar(refresh)


async def test_refresh_rejeita_access_token(make_repo):
    service, _ = await _com_usuario(make_repo)
    access, _refresh, _perfil = await service.autenticar("admin@ex.com", "senha123")
    with pytest.raises(UnauthorizedError):
        await service.renovar(access)


async def test_reset_fluxo_completo(make_repo):
    notif = _NotificacaoFake()
    service, repo = await _com_usuario(make_repo, notif)
    await service.solicitar_reset("admin@ex.com")
    assert notif.reset_token
    await service.redefinir_senha(notif.reset_token, "novasenha")
    usuario = (await repo.list({"email": "admin@ex.com"}))[0]
    assert verificar_senha("novasenha", usuario["senha_hash"])


async def test_reset_email_inexistente_nao_vaza(make_repo):
    notif = _NotificacaoFake()
    service, _ = await _com_usuario(make_repo, notif)
    await service.solicitar_reset("naoexiste@ex.com")
    assert notif.reset_token is None


async def test_redefinir_rejeita_token_que_nao_e_reset(make_repo):
    service, _ = await _com_usuario(make_repo)
    _access, refresh, _perfil = await service.autenticar("admin@ex.com", "senha123")
    with pytest.raises(UnauthorizedError):
        await service.redefinir_senha(refresh, "novasenha")
