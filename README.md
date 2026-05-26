# Xpress Code — Sistema de Gestão de Barbearia

SaaS de gestão para barbearias: agendamentos, catálogo de serviços e usuários.
Trabalho Prático Semestral — *Arquitetura de Aplicações Web (2026.1)*.

## Stack

- **Backend:** Python 3.11+ / FastAPI
- **Banco:** MongoDB (via Docker)
- **Frontend:** React + Vite + Tailwind CSS (SPA com React Router e Axios)
- **Auth:** JWT (login/registro) + RBAC (perfis `admin` / `profissional` / `cliente`)

## Pré-requisitos

- Python 3.11+
- Docker + Docker Compose

## Como executar (localmente)

```bash
# 1. Subir o MongoDB
docker-compose up -d

# 2. Criar o ambiente virtual e instalar dependências
py -m venv .venv              # Windows (use 'python3' no Linux/macOS)
.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate   # Linux/macOS
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env        # Windows  (cp no Linux/macOS)

# 4. (Opcional) Criar o usuário admin inicial — necessário para ações de admin
py -m scripts.seed            # cria admin@xpress.com / senha: admin123

# 5. Rodar a API
uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`.

### Frontend (SPA React)

Em outro terminal, com a API no ar:

```bash
cd frontend
npm install
copy .env.example .env        # opcional (usa http://localhost:8000/api/v1 por padrão)
npm run dev
```

A interface fica em `http://localhost:5173`. A navegação entre as telas
(lista → detalhe → formulário) é assíncrona, sem recarregar a página.

## Documentação da API (Swagger)

Com a API no ar, acesse a documentação interativa em:

- **Swagger UI:** http://localhost:8000/docs
- **OpenAPI JSON:** http://localhost:8000/openapi.json

Para validar a infraestrutura: `GET /health` e `GET /health/db`.

## Autenticação e perfis (RBAC)

A API usa **JWT**. Faça login e envie o token no header
`Authorization: Bearer <token>`. Há três perfis: `admin`, `profissional` e
`cliente`. O auto-registro cria sempre `cliente`; perfis privilegiados são
criados por um admin (ou via `scripts/seed.py`).

Legenda de acesso: **🔓 público** · **autenticado** (qualquer perfil logado) · **admin** (só administradores).

## Endpoints

Prefixo base: `/api/v1`.

### Autenticação
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST   | `/auth/register` | 🔓 | Auto-registro (cria `cliente`) |
| POST   | `/auth/login`    | 🔓 | Retorna o token JWT |

### Serviços
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/servicos`        | 🔓 | Lista os serviços |
| GET    | `/servicos/{id}`   | 🔓 | Busca por ID |
| POST   | `/servicos`        | admin | Cria um serviço |
| PUT    | `/servicos/{id}`   | admin | Atualização integral |
| DELETE | `/servicos/{id}`   | admin | Remoção lógica (`ativo=false`) |

### Usuários
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/usuarios`        | autenticado | Lista os usuários |
| GET    | `/usuarios/{id}`   | autenticado | Busca por ID |
| POST   | `/usuarios`        | admin | Cria um usuário (qualquer perfil) |
| PUT    | `/usuarios/{id}`   | admin | Atualiza um usuário |
| DELETE | `/usuarios/{id}`   | admin | Remove um usuário |

### Agendamentos
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/agendamentos`        | autenticado | Lista (filtros: `cliente_id`, `profissional_id`, `data`) |
| GET    | `/agendamentos/{id}`   | autenticado | Busca por ID |
| POST   | `/agendamentos`        | autenticado | Cria (valida cliente/profissional/serviço; calcula término) |
| DELETE | `/agendamentos/{id}`   | autenticado | Cancela (status → `cancelado`) |

## Testes

Testes unitários da camada de serviço (pytest), sem depender do MongoDB:

```bash
pytest
```

## Princípios SOLID

A aplicação dos princípios está documentada em [SOLID.md](./SOLID.md).

## Variáveis de ambiente

Veja [.env.example](./.env.example). Principais:

| Variável            | Descrição                          | Exemplo                       |
|---------------------|------------------------------------|-------------------------------|
| `MONGO_URI`         | String de conexão do MongoDB       | `mongodb://localhost:27017`   |
| `MONGO_DB_NAME`     | Nome do banco                      | `xpress_code`                 |
| `API_V1_PREFIX`     | Prefixo dos endpoints da API       | `/api/v1`                     |
| `JWT_SECRET`        | Segredo de assinatura do JWT       | *(definir valor forte)*       |
| `JWT_EXPIRE_MINUTES`| Expiração do token (minutos)       | `60`                          |

> Nenhum segredo é versionado: o `.env` está no `.gitignore`.
