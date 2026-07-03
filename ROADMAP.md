# Roadmap — Xpress Code (produção)

Mapa de evolução do projeto para operar como produto de agendamento em produção.
Prioridades: **P0** (impeditivo — bug que causa prejuízo real), **P1** (necessário
para operar), **P2** (polimento/evolução).

Status: ⬜ pendente · 🟨 em andamento · ✅ concluído · ❌ descartado

## P0 — Núcleo crítico (antes de qualquer cliente usar)

| # | Item | Status |
|---|------|--------|
| P0-1 | Prevenir double-booking com garantia atômica (índice único parcial) | ✅ |
| P0-2 | Modelar jornada de trabalho do profissional | ✅ |
| P0-3 | Endpoint de disponibilidade (horários livres) | ✅ |
| P0-4 | Vincular serviços a profissionais | ✅ |
| P0-5 | Tratamento de timezone nos agendamentos | ✅ |

## P1 — Necessário para operar de verdade

| # | Item | Status |
|---|------|--------|
| P1-6 | Lembretes automáticos (via cron externo) | ✅ |
| P1-7 | Hardening: rate limiting + proteções de borda | ✅ |
| P1-8 | Paginação nas listagens | ✅ |
| P1-9 | Observabilidade (logs + handler global de erro) | ✅ |
| P1-10 | CI (GitHub Actions: pytest + lint) | ✅ |
| P1-11 | Auth completa (reset de senha, refresh token, seed seguro) | ✅ |
| P1-17 | Notificações in-app (central de notificações) | ✅ |
| P1-18 | Bot WhatsApp com IA (Gemini) + CRUD com guard rails | ✅ |

## P2 — Polimento / evolução

| # | Item | Status |
|---|------|--------|
| P2-12 | Reagendamento de agendamentos | ✅ |
| P2-13 | Estratégia de backup do MongoDB (documentada) | ✅ |
| P2-14 | Health check (`/health` liveness, `/health/db` 503) | ✅ |
| ~~P2-15~~ | ~~Booking self-service do cliente (web)~~ — **descartado** (o cliente não tem conta) | ❌ |
| P2-16 | Relatórios (faturamento, taxa de no-show) — backend + tela admin | ✅ |

---

## Direção do produto

- **Sistema completo/self-contained** — sem Google Calendar. O motor de
  agendamento e de disponibilidade é interno.
- **O cliente não tem conta e nunca acessa o app.** Ele é uma *entidade
  gerenciada* — um registro (nome/telefone) criado pela equipe (`POST
  /usuarios`) ou automaticamente pelo bot do WhatsApp (identificado pelo
  telefone). Não há auto-registro nem login de cliente; o app é exclusivo da
  equipe (admin/profissional). Por isso o booking self-service (P2-15) foi
  descartado.
- **Notificações no próprio app** (in-app), além das externas.
- **Terceiros só para comunicação:** WhatsApp (IA respondendo com as
  disponibilidades via API Meta) e Brevo (confirmações por e-mail). O motor de
  disponibilidade interno (P0-3) alimenta a IA do WhatsApp.

## Log de evoluções

Ordem cronológica inversa (mais recente no topo).

### 2026-07-02 — Editor de jornada de trabalho no app

- **Jornada (frontend):** tela `Jornadas` (admin) no app Expo para configurar os
  blocos de atendimento de cada profissional (`GET`/`PUT
  /profissionais/{id}/jornada`). Fecha uma lacuna operacional: o backend da
  jornada (P0-2) existia sem UI, então não havia como definir horários pelo app
  — e agendamentos eram recusados por "fora da jornada".
- Seletor de profissional carrega a jornada atual (404 = sem blocos), edição de
  blocos (dia da semana + início/fim), adicionar/remover e salvar. Componente
  `TimeInput` reutilizável; link de navegação só para admin.

### 2026-07-02 — Tela de relatórios no app (P2-16 frontend)

- **P2-16 (frontend):** tela `Relatórios` (admin) no app Expo consumindo
  `GET /relatorios/resumo`: seletor de período (padrão últimos 30 dias) e
  cartões de faturamento, atendimentos concluídos, taxa de no-show,
  faltas e cancelamentos.
- Componente `DateInput` reutilizável (web usa `<input type="date">`; nativo,
  `TextInput`) e link de navegação exibido só para admin (header + menu mobile).
- Datas de período formatadas sem `new Date` (evita deslocar o dia em fuso
  negativo). Fecha o P2-16 (backend já estava pronto).

### 2026-07-02 — Booking self-service: API `/me` do cliente (P2-15 backend)

- **P2-15 (backend):** superfície HTTP `/me` para o próprio cliente autenticado
  agendar sozinho, destravando o booking self-service no app. Camadas:
  - `MinhaAgendaService` — agenda escopada ao `cliente_id` do token; catálogo de
    serviços ativos, profissionais (só id+nome), disponibilidade e CRUD dos
    próprios agendamentos. Reaproveita os mesmos guard rails de `AgendaTools`
    (bot do WhatsApp): posse verificada em cancelar/reagendar (IDOR → NotFound).
  - Router `minha_agenda` (`/me/servicos`, `/me/profissionais`,
    `/me/disponibilidade`, `/me/agendamentos` [GET/POST], `.../reagendar`,
    `.../{id}` DELETE), guardado por `get_current_user`.
  - `AgendamentoClienteCreate` (payload sem `cliente_id`) e `ProfissionalPublico`
    (projeção que não vaza e-mail/telefone de terceiros).
- **Guard rails:** identidade fixada no servidor (id vem do token, nunca do
  corpo); mutações passam pelos serviços de domínio (jornada, conflito,
  double-booking). Endpoints da equipe (`/agendamentos`, `/disponibilidade`)
  seguem restritos a staff — o cliente usa só `/me`.
- **Pendência:** a página pública/guest de auto-agendamento no app Expo continua
  sendo trabalho de frontend; o backend agora dá suporte completo.
- **Testes:** 81 passando (+9 de `MinhaAgendaService`).

### 2026-07-01 — Bot WhatsApp com IA (Gemini) + guard rails

- **P1-18:** agente Gemini (function-calling) no WhatsApp que consulta a agenda
  e faz CRUD de agendamentos do cliente. Camadas:
  - `AgendaTools` — ferramentas vinculadas ao cliente do telefone; posse
    verificada em cancelar/reagendar (IDOR bloqueado).
  - `WhatsAppAgent` — loop provider-agnóstico com whitelist de ferramentas,
    teto de iterações e erros de domínio tratados.
  - `GeminiClient` — adaptador google-genai (sem chave → fallback FSM).
  - `WhatsAppService` — rate limit por telefone, histórico com TTL, input cap.
- **Guard rails:** identidade fixada no servidor, mutações via serviços de
  domínio, sem execução de código arbitrário pela IA.
- **Pendências:** `GeminiClient` (adaptador da API) não tem teste de rede — a
  lógica de agente/ferramentas/guard rails é 100% testada com fakes.
- **Testes:** 72 passando.

### 2026-07-01 — P2 de backend (reagendamento, relatórios, operação)

- **P2-12 (reagendamento):** `POST /agendamentos/{id}/reagendar`.
- **P2-16 (relatórios):** `GET /relatorios/resumo` (faturamento + no-show).
- **P2-14 (health):** `/health` para liveness do Fly; `/health/db` devolve 503
  quando o Mongo cai (para monitores). Decisão: não gatilhar liveness no banco.
- **P2-13 (backup):** documentado no README (Atlas automático ou mongodump).
- **P2-15 (booking self-service web):** pendente — é trabalho de **frontend** no
  app Expo (página pública de auto-agendamento). O backend já dá suporte:
  `/auth/register`, `/disponibilidade` e `POST /agendamentos`. Requer decisão de
  produto (fluxo público/guest) antes de implementar.
- **Testes:** 58 passando.

### 2026-07-01 — Observabilidade + auth completa (P1 concluído)

- **P1-9 (observabilidade):** logging por `LOG_LEVEL`, `RequestLogMiddleware` e
  handler global de 500 que não vaza stack trace.
- **P1-11 (auth):** refresh token (`POST /auth/refresh`), reset de senha por
  e-mail (`esqueci-senha`/`redefinir-senha`, sem enumeração), tokens tipados
  (access/refresh/reset) com `get_current_user` exigindo `access`. Seed seguro
  já feito no P1-7.
- **Pendências de hardening futuro:** refresh é stateless (sem revogação); token
  de reset é válido até expirar (não é single-use). Aceitável por ora.
- **Testes:** 52 passando (+ E2E HTTP do fluxo de auth e checagens de segurança).
- **P1 100% concluído.**

### 2026-07-01 — Notificações in-app + lembretes

- **P1-17 (notificações in-app):** entidade Notificacao escopada ao usuário
  (lista, contagem, marcar lida) com proteção IDOR; agendamento gera
  confirmação/cancelamento automaticamente.
- **P1-6 (lembretes):** `POST /lembretes/processar` protegido por `CRON_TOKEN`
  (comparação timing-safe), idempotente, envia in-app + Brevo + WhatsApp para
  agendamentos próximos. Disparo via cron externo (evita o problema do Fly
  escalando a zero com scheduler in-process).
- **Testes:** 47 passando (+ E2E HTTP de notificações/IDOR e do cron de lembretes).

### 2026-07-01 — P1 em andamento (CI + paginação)

- **P1-10 (CI):** GitHub Actions rodando `compileall` + `pytest` em Python
  3.11/3.12 em push na main e em PRs.
- **P1-8 (paginação):** `AbstractRepository.list` com `skip`/`limit`; rotas
  `GET /usuarios` e `/agendamentos` com `limite` (1–200) e `offset`.
- **Testes:** 39 passando.

### 2026-07-01 — Núcleo de agendamento (P0 completo)

- **P0-5 (timezone):** cliente Mongo `tz_aware` (UTC); módulo `app/core/tempo`
  converte entre o timezone do negócio e UTC; agendamentos normalizam entrada.
- **P0-2 (jornada):** entidade Jornada (blocos semanais) + `PUT/GET
  /profissionais/{id}/jornada`; agendamento rejeita horário fora da jornada.
- **P0-4 (serviço↔profissional):** `Servico.profissionais_ids`; agendamento
  rejeita profissional que não faz o serviço.
- **P0-3 (disponibilidade):** `GET /disponibilidade` gera slots livres a partir
  da jornada menos agendamentos, respeitando duração/vínculo/passo. Motor que
  alimenta o app e a IA do WhatsApp.
- **Testes:** 36 passando (unitários + E2E HTTP do endpoint de disponibilidade).

### 2026-07-01 — Limpeza + P0-1 + hardening de borda

- **Limpeza:** removido resíduo acadêmico (`SOLID.md`, cabeçalho "Trabalho
  Prático Semestral", comentários `M0/M1/M2`, referências a `escopo.md` /
  `ROTEIRO_APRESENTACAO.md`). Só docs/comentários — sem mudança de comportamento.
- **P0-1 (double-booking atômico):** índice único parcial em
  `agendamentos (profissional_id, data_hora_inicio)` para status `agendado`;
  `MongoRepository.create` traduz `DuplicateKeyError` → `ConflictError`. Teste
  novo em `tests/test_mongo_repository.py`.
- **P1-7 (hardening):** rate limiting (slowapi) em `/auth/login` (10/min) e
  `/auth/register` (5/min); `SecurityHeadersMiddleware` (nosniff, X-Frame-Options
  DENY, Referrer-Policy, HSTS); `BodySizeLimitMiddleware` (1 MB → 413);
  `scripts/seed.py` sem senha hardcoded (usa `SEED_ADMIN_SENHA` ou gera aleatória).
- **Testes:** suíte tornada hermética (JWT_SECRET no `conftest`). 30 passando.
- **Pendências de hardening para escala:** limiter é em memória (por processo) —
  trocar por backend Redis quando houver mais de uma instância.
</content>
</invoke>
