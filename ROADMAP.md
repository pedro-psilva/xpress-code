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
| P1-6 | Lembretes automáticos (scheduler) | ⬜ |
| P1-7 | Hardening: rate limiting + proteções de borda | ✅ |
| P1-8 | Paginação nas listagens | ⬜ |
| P1-9 | Observabilidade (logs estruturados + error tracking) | ⬜ |
| P1-10 | CI (GitHub Actions: pytest + lint) | ⬜ |
| P1-11 | Auth completa (reset de senha, refresh token, seed seguro) | ⬜ |

## P2 — Polimento / evolução

| # | Item | Status |
|---|------|--------|
| P2-12 | Reagendamento de agendamentos | ⬜ |
| P2-13 | Estratégia de backup do MongoDB | ⬜ |
| P2-14 | Health check do deploy usar `/health/db` | ⬜ |
| P2-15 | Booking self-service do cliente (web) | ⬜ |
| P2-16 | Relatórios (faturamento, taxa de no-show) | ⬜ |

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
