# Roadmap — Xpress Code (produção)

Mapa de evolução do projeto para operar como produto de agendamento em produção.
Prioridades: **P0** (impeditivo — bug que causa prejuízo real), **P1** (necessário
para operar), **P2** (polimento/evolução).

Status: ⬜ pendente · 🟨 em andamento · ✅ concluído

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
| P2-15 | Booking self-service do cliente (web) | ⬜ (frontend) |
| P2-16 | Relatórios (faturamento, taxa de no-show) | ✅ |

---

## Direção do produto

- **Sistema completo/self-contained** — sem Google Calendar. O motor de
  agendamento e de disponibilidade é interno.
- **Notificações no próprio app** (in-app), além das externas.
- **Terceiros só para comunicação:** WhatsApp (IA respondendo com as
  disponibilidades via API Meta) e Brevo (confirmações por e-mail). O motor de
  disponibilidade interno (P0-3) alimenta a IA do WhatsApp.

## Log de evoluções

Ordem cronológica inversa (mais recente no topo).

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
