# Xpress Code — Sistema de Gestão de Barbearia

SaaS de gestão para barbearias: agendamentos, catálogo de serviços e usuários.

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

As listagens de usuários e agendamentos aceitam paginação via `limite`
(1–200, padrão 50) e `offset` (padrão 0).

### Autenticação
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST   | `/auth/register` | 🔓 | Auto-registro (cria `cliente`) |
| POST   | `/auth/login`    | 🔓 | Retorna `access_token` + `refresh_token` |
| POST   | `/auth/refresh`  | 🔓 | Troca o `refresh_token` por um novo `access_token` |
| POST   | `/auth/esqueci-senha` | 🔓 | Envia e-mail de redefinição (200 mesmo se o e-mail não existir) |
| POST   | `/auth/redefinir-senha` | 🔓 | Redefine a senha com o token recebido |

Os tokens são tipados (`access`/`refresh`/`reset`); um não é aceito no lugar do
outro. Todos os endpoints de auth têm rate limiting.

### Serviços
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/servicos`        | 🔓 | Lista os serviços |
| GET    | `/servicos/{id}`   | 🔓 | Busca por ID |
| POST   | `/servicos`        | admin | Cria um serviço |
| PUT    | `/servicos/{id}`   | admin | Atualização integral |
| DELETE | `/servicos/{id}`   | admin | Remoção lógica (`ativo=false`) |

O serviço aceita `profissionais_ids` (lista): quando preenchida, só esses
profissionais podem ser agendados para ele; vazia significa qualquer profissional.

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
| GET    | `/agendamentos`             | autenticado | Lista (filtros: `cliente_id`, `profissional_id`, `data`) |
| GET    | `/agendamentos/{id}`        | autenticado | Busca por ID |
| POST   | `/agendamentos`             | autenticado | Cria (valida cliente/profissional/serviço, jornada e conflito; calcula término) |
| DELETE | `/agendamentos/{id}`        | autenticado | Cancela (status → `cancelado`) |
| POST   | `/agendamentos/{id}/concluir` | autenticado | Marca como concluído |
| POST   | `/agendamentos/{id}/no-show`  | autenticado | Registra que o cliente não compareceu |

Horários são interpretados no timezone do negócio (`BUSINESS_TIMEZONE`,
padrão `America/Sao_Paulo`) e armazenados em UTC. O mesmo profissional não pode
ter dois agendamentos ativos sobrepostos — garantido também por índice único no
banco.

### Jornada do profissional
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| PUT    | `/profissionais/{id}/jornada` | admin | Define os blocos semanais de trabalho |
| GET    | `/profissionais/{id}/jornada` | autenticado (staff) | Consulta a jornada |

Cada bloco tem `dia_semana` (0=segunda … 6=domingo), `hora_inicio` e `hora_fim`
(`HH:MM`). Agendamentos fora da jornada definida são rejeitados.

### Disponibilidade
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/disponibilidade` | autenticado (staff) | Lista horários livres (`profissional_id`, `servico_id`, `dia`) |

Calcula os slots a partir da jornada menos os agendamentos ativos, respeitando a
duração do serviço, o vínculo serviço↔profissional e o passo `SLOT_STEP_MINUTOS`
(padrão 15). É o motor consumido pelo app e pela IA do WhatsApp.

### Notificações in-app
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/notificacoes`                  | autenticado | Lista as notificações do usuário logado (`apenas_nao_lidas`, `limite`, `offset`) |
| GET    | `/notificacoes/nao-lidas/contagem` | autenticado | Contagem para o badge |
| POST   | `/notificacoes/{id}/lida`        | autenticado | Marca uma como lida (só o dono) |
| POST   | `/notificacoes/lidas`            | autenticado | Marca todas como lidas |

Criar e cancelar um agendamento gera automaticamente uma notificação para o
cliente.

### Lembretes
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST   | `/lembretes/processar` | header `X-Cron-Token` | Envia lembretes dos agendamentos próximos (`antecedencia_horas`, padrão 24) |

Endpoint idempotente pensado para um cron externo (ex.: máquina agendada do
Fly, GitHub Actions schedule ou serviço de cron) que envia o header
`X-Cron-Token` igual a `CRON_TOKEN`. Cada lembrete dispara notificação in-app +
e-mail (Brevo) + WhatsApp, uma única vez por agendamento.

## Testes

Testes unitários da camada de serviço (pytest), sem depender do MongoDB:

```bash
pytest
```

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
