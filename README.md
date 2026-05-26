# Xpress Code — Sistema de Gestão de Barbearia

SaaS de gestão para barbearias: agendamentos, catálogo de serviços e usuários.
Trabalho Prático Semestral — *Arquitetura de Aplicações Web (2026.1)*.

## Stack

- **Backend:** Python 3.11+ / FastAPI
- **Banco:** MongoDB (via Docker)
- **Frontend:** React (SPA assíncrona) — *em construção*
- **Auth:** JWT + RBAC — *em construção*

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

# 4. Rodar a API
uvicorn app.main:app --reload
```

## Documentação da API (Swagger)

Com a API no ar, acesse a documentação interativa em:

- **Swagger UI:** http://localhost:8000/docs
- **OpenAPI JSON:** http://localhost:8000/openapi.json

Para validar a infraestrutura: `GET /health` e `GET /health/db`.

## Endpoints

Prefixo base: `/api/v1`.

### Serviços
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/servicos`        | Lista os serviços |
| GET    | `/servicos/{id}`   | Busca por ID |
| POST   | `/servicos`        | Cria um serviço |
| PUT    | `/servicos/{id}`   | Atualização integral |
| DELETE | `/servicos/{id}`   | Remoção lógica (`ativo=false`) |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/usuarios`        | Lista os usuários |
| GET    | `/usuarios/{id}`   | Busca por ID |
| POST   | `/usuarios`        | Cria um usuário |
| PUT    | `/usuarios/{id}`   | Atualiza um usuário |
| DELETE | `/usuarios/{id}`   | Remove um usuário |

### Agendamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/agendamentos`        | Lista (filtros: `cliente_id`, `profissional_id`, `data`) |
| GET    | `/agendamentos/{id}`   | Busca por ID |
| POST   | `/agendamentos`        | Cria (valida cliente/profissional/serviço; calcula término) |
| DELETE | `/agendamentos/{id}`   | Cancela (status → `cancelado`) |

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
