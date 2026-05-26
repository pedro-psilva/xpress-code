# Princípios SOLID aplicados

Este documento indica, para cada princípio, **onde** ele aparece no código e
**como** o projeto o atende. A arquitetura é dividida em camadas:
`routers` (HTTP) → `services` (regras de negócio) → `repositories` (persistência).

---

## S — Single Responsibility Principle (Responsabilidade Única)

**Onde:** `app/routers/*.py`, `app/services/*.py`, `app/repositories/*.py`.

**Como:** cada camada tem uma única razão para mudar. Os routers (ex.:
`app/routers/servicos.py`) apenas validam o contrato HTTP (Pydantic) e delegam;
toda regra de negócio vive nos serviços (ex.: `ServicoService` em
`app/services/servico_service.py` decide a remoção lógica `ativo=False`); o
acesso ao banco fica isolado em `MongoRepository`
(`app/repositories/mongo_repository.py`). Um exemplo claro é o cálculo de
`data_hora_fim` e a validação de relacionamento, que estão no
`AgendamentoService`, não na rota.

## O — Open/Closed Principle (Aberto/Fechado)

**Onde:** `app/repositories/base.py` (interface) e suas implementações
`MongoRepository` e `tests/conftest.py::FakeRepository`.

**Como:** o sistema está aberto à extensão e fechado à modificação. Foi possível
adicionar uma nova implementação de repositório (o `FakeRepository` em memória,
usado nos testes) **sem alterar uma linha** dos serviços que o consomem.
Adicionar uma nova entidade também significa criar novos módulos
(model/service/router) sem modificar os existentes.

## L — Liskov Substitution Principle (Substituição de Liskov)

**Onde:** `tests/conftest.py::FakeRepository` substituindo `MongoRepository`,
ambos derivados de `AbstractRepository`.

**Como:** os serviços recebem um `AbstractRepository`. Nos testes
(`tests/`), injetamos o `FakeRepository` no lugar do `MongoRepository` e os
serviços funcionam exatamente igual — o subtipo honra o contrato do tipo base
sem efeitos colaterais. Os 15 testes passando comprovam a substituibilidade.

## I — Interface Segregation Principle (Segregação de Interface)

**Onde:** `app/repositories/base.py` e `app/core/auth.py`.

**Como:** `AbstractRepository` expõe somente as operações essenciais de
persistência (`create`, `get_by_id`, `list`, `update`, `delete`) — nenhuma
implementação é forçada a depender de métodos que não usa. Na autorização, as
dependências são segregadas: `get_current_user` (apenas autenticação) e
`require_admin` (autorização por perfil) são funções distintas, e cada rota
depende só do que precisa.

## D — Dependency Inversion Principle (Inversão de Dependência)

**Onde:** `app/services/*.py` (dependem da abstração) e
`app/core/dependencies.py` (injeção das implementações concretas).

**Como:** os serviços dependem da abstração `AbstractRepository`, nunca do
driver do MongoDB diretamente. A ligação entre a abstração e a implementação
concreta (`MongoRepository` sobre uma coleção) acontece nos provedores de
`app/core/dependencies.py`, injetados nas rotas pelo mecanismo `Depends` do
FastAPI. Trocar o banco exigiria apenas uma nova implementação da interface.
