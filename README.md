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

### Cliente oficial (Expo — Web/Android/iOS)

Em outro terminal, com a API no ar:

```bash
cd mobile
npm install
npm run web                   # SPA assíncrona em http://localhost:8081
```

Para alcançar do celular na LAN: `uvicorn ... --host 0.0.0.0` e ajustar
`EXPO_PUBLIC_API_URL` no `mobile/.env`. Detalhes em [mobile/README.md](./mobile/README.md).

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

## Integração WhatsApp (Cloud API oficial — Meta)

Usamos a **WhatsApp Cloud API** da Meta. Sem credenciais, os endpoints
`/whatsapp/*` respondem como "não configurado" e o webhook rejeita tudo —
o resto da API segue funcionando normalmente.

### Pré-requisitos (uma vez, fora do código)

1. Criar um app em [developers.facebook.com](https://developers.facebook.com) e
   adicionar o produto **WhatsApp**.
2. Em **API Setup**, copiar o `Phone Number ID` e gerar um **Access Token**
   (de teste para validar; permanente via System User para produção).
3. Em **App Settings → Basic**, copiar o `App Secret` (para validar a
   assinatura `X-Hub-Signature-256` dos webhooks).
4. Em **WhatsApp → Configuration → Webhook**:
   - **Callback URL:** `https://<seu-host-publico>/api/v1/whatsapp/webhook`
     (em dev, expor o uvicorn com `ngrok http 8000`).
   - **Verify Token:** o mesmo valor de `META_WEBHOOK_VERIFY_TOKEN` no `.env`.
   - **Subscrever** o campo `messages`.

### Variáveis

| Variável                     | Descrição                                          |
|------------------------------|----------------------------------------------------|
| `META_GRAPH_API_VERSION`     | Versão da Graph API (padrão `v21.0`)               |
| `META_PHONE_NUMBER_ID`       | ID do número de telefone no painel da Meta         |
| `META_ACCESS_TOKEN`          | Token Bearer para chamar a Graph API               |
| `META_APP_SECRET`            | App Secret usado para validar HMAC do webhook      |
| `META_WEBHOOK_VERIFY_TOKEN`  | Token combinado com a Meta no handshake do webhook |

## Integração Brevo (email transacional)

Sem `BREVO_API_KEY` o envio de email é silenciosamente ignorado (no-op).
Gere uma chave em https://app.brevo.com/settings/keys/api e configure
`BREVO_SENDER_EMAIL`/`BREVO_SENDER_NAME` para o remetente exibido.

| Variável             | Descrição                                  |
|----------------------|--------------------------------------------|
| `BREVO_API_KEY`      | Chave da API Brevo                         |
| `BREVO_SENDER_EMAIL` | Email do remetente das mensagens           |
| `BREVO_SENDER_NAME`  | Nome do remetente exibido para o cliente   |

## Integração InfinitePay (cobranças via link)

A InfinitePay Checkout não usa API key tradicional — o estabelecimento é
identificado pelo **handle (InfiniteTag)**, que aparece em
https://app.infinitepay.io/configuracoes. Sem `INFINITEPAY_HANDLE`, o
endpoint `POST /assinaturas/{id}/cobranca` devolve 503.

Para receber confirmação do pagamento, a `PUBLIC_API_URL` precisa ser uma
URL HTTPS pública (a InfinitePay vai bater em
`{PUBLIC_API_URL}/webhooks/infinitepay`). Em dev, use ngrok.

| Variável                   | Descrição                                          |
|----------------------------|----------------------------------------------------|
| `INFINITEPAY_HANDLE`       | InfiniteTag do estabelecimento                     |
| `INFINITEPAY_REDIRECT_URL` | Para onde o cliente é enviado após pagar (opcional)|
| `PUBLIC_API_URL`           | URL HTTPS pública da API (usada pelo webhook)      |

### Endpoints

| Método | Rota                          | Acesso | Descrição                              |
|--------|-------------------------------|--------|----------------------------------------|
| GET    | `/whatsapp/status`            | admin  | Verifica se as credenciais são válidas |
| GET    | `/whatsapp/webhook`           | 🔓     | Handshake de verificação da Meta       |
| POST   | `/whatsapp/webhook`           | 🔓 (HMAC) | Recebe mensagens; valida assinatura |

Mensagens recebidas são processadas por um bot conversacional que cadastra o
cliente pelo telefone (se for novo) e guia o agendamento passo a passo
(serviço → profissional → data → hora).
