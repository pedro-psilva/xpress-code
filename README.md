# Xpress Code — Sistema de Gestão de Barbearia

SaaS de gestão para barbearias: agendamentos, catálogo de serviços e usuários.

## Stack

- **Backend:** Python 3.11+ / FastAPI
- **Banco:** MongoDB (local via Docker; Atlas em produção)
- **Frontend:** Expo (React Native) — app universal Web/Android/iOS em `mobile/`
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

## Deploy / Hospedagem (produção)

> Instantâneo da infra em jun/2026. Custo de serviço: R$ 0/mês (tudo em free
> tier) + ~R$ 40/ano do domínio.

### URLs públicas

| O quê | URL |
|-------|-----|
| API (FastAPI) | https://api.xpresscode.com.br |
| App (Expo Web) | https://app.xpresscode.com.br (também `xpresscode.com.br` e `www.`) |
| Repositório | https://github.com/pedro-psilva/xpress-code (privado, branch `main`) |

### Onde cada peça roda

| Componente | Hospedagem | Detalhes |
|------------|-----------|----------|
| Backend FastAPI | **OCI Always Free** | VM `xpress-code-api`, IP `163.176.162.160`, Ubuntu 22.04, shape `VM.Standard.E2.1.Micro` (1 OCPU / 1 GB RAM + 2 GB swap), AD-1 São Paulo |
| Container do backend | **Docker** na VM | `xpress-code-api`, `--restart unless-stopped`, ouvindo só em `127.0.0.1:8000` |
| Reverse proxy / HTTPS | **Caddy** na VM | `/etc/caddy/Caddyfile`, TLS automático (Let's Encrypt), security headers (HSTS preload, X-Frame DENY, nosniff) |
| Banco | **MongoDB Atlas M0** (free) | Cluster `Cluster0`, região AWS-SP, user `xpress_api`, IP whitelist só com `163.176.162.160/32` |
| App (Expo Web) | **Vercel** | Build do diretório `mobile/` |
| DNS | **Registro.br** | `api` A→IP da VM · `app`/`www` CNAME→`cname.vercel-dns.com` · apex A→`76.76.21.21` |
| Firewall | **UFW + OCI Security List** | Só 22/80/443 inbound |

> O `fly.toml` na raiz é artefato de uma tentativa anterior no Fly.io e **não
> reflete a hospedagem atual** (backend migrou para a VM OCI). As variáveis de
> ambiente de produção ficam no `docker run` do container na VM — **não no Fly**.

### Como fazer deploy

- **Backend:** `ssh` na VM → `cd /home/ubuntu/xpress-code` → `git pull` → rebuild
  e re-run do container Docker com os env vars de produção.
- **App web:** `cd mobile && vercel --prod --yes`.
- **Seed do banco:** `MONGO_URI=<atlas_uri> python -m scripts.seed` (idempotente).

Para inspecionar os env vars atuais do container sem alterá-los:
`sudo docker inspect xpress-code-api | grep -A1 Env`.

### ⛔ Pendências de acesso/deploy

Ainda não feito — depende de acesso SSH à VM Oracle, que hoje não temos:

1. **Acesso SSH à VM** (pré-requisito dos itens abaixo)
   - [ ] Colocar a chave `.pem` da instância OCI em `~/.ssh/` (perm. `600`)
   - [ ] Confirmar usuário+host: `ubuntu@163.176.162.160` (Ubuntu) ou `opc@…` (Oracle Linux)
   - [ ] Testar: `ssh -i ~/.ssh/oci-xpresscode.pem ubuntu@163.176.162.160 "echo ok"`
2. **Mapear como o backend roda na VM** (pra montar o deploy certo)
   - [ ] `systemctl status | grep -i uvicorn` ou `docker ps` — systemd ou container?
   - [ ] Localizar o diretório do projeto e o `.env`
   - [ ] Revisar `/etc/caddy/Caddyfile` (confirma o proxy reverso)
3. **`BREVO_API_KEY` em produção** (sem ela, o envio de email é no-op)
   - [ ] Gerar no Brevo: *SMTP & API → API Keys → Generate*
   - [ ] Setar no `.env` do serviço **na VM** (não no Fly): `BREVO_API_KEY`,
     `BREVO_SENDER_EMAIL=no-reply@xpresscode.com.br`,
     `BREVO_SENDER_NAME=Barbearia Xpress Code`
   - [ ] Reiniciar o serviço e testar (ex.: fluxo de esqueci-senha)
4. **Automatizar o deploy** (depois de resolver o item 2)
   - [ ] Workflow do GitHub Actions com deploy via SSH após o CI passar na `main`
   - [ ] Secret `SSH_PRIVATE_KEY` + host em *Settings → Secrets → Actions*

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
| POST   | `/agendamentos/{id}/reagendar` | autenticado | Remarca (valida jornada e conflito) |
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

### Relatórios
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET    | `/relatorios/resumo` | admin | Faturamento e taxa de no-show no período (`inicio`, `fim`) |

Faturamento soma o preço dos atendimentos concluídos; a taxa de no-show é
`no_shows / (concluídos + no_shows)` no período.

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

### Bot com IA (Google Gemini)

Com `GEMINI_API_KEY` configurada, o bot passa a ser conduzido por um agente
Gemini (function-calling) que consulta a agenda e faz o CRUD de agendamentos do
cliente em linguagem natural. Sem a chave, o bot usa o fluxo determinístico
acima (fallback).

**Guard rails de segurança:**
- A identidade do cliente vem do número de WhatsApp (resolvida no servidor);
  a IA nunca escolhe de quem é a ação — bloqueia acesso a dados de terceiros.
- Cancelar/remarcar verificam posse do agendamento (bloqueia IDOR mesmo sob
  prompt injection).
- Whitelist de ferramentas, teto de iterações por mensagem, limite de tamanho
  da mensagem e rate limiting por telefone (`WHATSAPP_MSG_LIMITE_MIN`/min).
- Todas as mutações passam pelos serviços de domínio (jornada, conflito,
  double-booking, vínculo serviço↔profissional).

| Variável                  | Descrição                                    |
|---------------------------|----------------------------------------------|
| `GEMINI_API_KEY`          | Chave da API do Google Gemini (vazio = bot determinístico) |
| `GEMINI_MODEL`            | Modelo Gemini (padrão `gemini-2.0-flash`)    |
| `WHATSAPP_MSG_LIMITE_MIN` | Máx. de mensagens por telefone por minuto    |

## Operação (health e backup)

- **Liveness:** o Fly monitora `GET /health` (sempre 200 se o processo está no
  ar). Não gatilhamos o liveness no banco de propósito — uma instabilidade
  momentânea do Mongo não deve derrubar/reiniciar a máquina em cascata.
- **Readiness/monitoração:** `GET /health/db` faz `ping` no Mongo e devolve
  **503** se o banco estiver indisponível — use-o em monitores externos.

### Backup do MongoDB

- **Produção (recomendado):** MongoDB Atlas com *backups automáticos* (snapshots
  contínuos + retenção configurável). É a opção de menor esforço e mais segura.
- **Alternativa (self-hosted):** `mongodump` agendado (cron diário) enviando o
  dump para armazenamento externo. Restauração com `mongorestore`:

  ```bash
  mongodump  --uri "$MONGO_URI" --db "$MONGO_DB_NAME" --archive=backup-$(date +%F).gz --gzip
  mongorestore --uri "$MONGO_URI" --gzip --archive=backup-2026-07-01.gz
  ```
