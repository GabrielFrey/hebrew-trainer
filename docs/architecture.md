# Biti Hebrew architecture

Biti Hebrew is a cross-platform Modern Hebrew learning system: short lessons, deterministic server grading, spaced repetition, ulpan-style conversation, and a native-speaker editorial pipeline. In English the product name is **Biti Hebrew** (`brand.name` in the `en` locale). Other locales keep Biti Ivrit / ביתי עברית. Code identifiers and the `biti-ivrit` branch are unchanged.

## Shape

Modular monolith. One FastAPI process owns auth, curriculum, grading, progress, SRS, gamification, tutor, editorial, and the content pipeline. Celery worker + beat run in the same codebase. Web (Next.js App Router) and mobile (Expo SDK 58) are clients of the same OpenAPI contract.

```
apps/web          Next.js 16 App Router, TypeScript strict, RTL-first
apps/mobile       Expo SDK 58, Expo Router, TypeScript strict
apps/api          FastAPI + SQLAlchemy + Alembic + Celery
packages/         hebrew-text, grading vectors, design-tokens, i18n, sdk
content/          published seed lessons, vocabulary, source records
infra/compose     Postgres, Redis, Keycloak, MinIO, API, worker, beat, web
```

The previous on-device trainer remains on `main` and is copied into `legacy/ivrit-s-nulya` on this branch only, as a reuse source (lexicon ideas, verb engine, keyboard, glass fallbacks). It is not the product.

## Modules

| Module | Responsibility | Authority |
| --- | --- | --- |
| auth | Demo (dev-only), OIDC Auth Code + PKCE | Server |
| users / profile | UI language, timezone, niqqud default, motivation | Server |
| curriculum | Tracks, levels, prerequisite graph, placement | Server |
| lessons | Immutable `LessonVersion` for published content | Published only |
| exercises / grading | Deterministic evaluation, diff spans, rule ids | Server only |
| progress | Attempts, completion threshold | Server |
| gamification | Append-only XP ledger, hearts, streaks, leagues | Server |
| srs | Fixed 1/3/7/14/30 day intervals | Server |
| audio | TTS provider interface + cache key | Honest unavailable without provider |
| speech | Optional assessment provider | Honest unavailable without provider |
| tutor | OpenAI-compatible adapter, RAG over published rows | Never awards XP |
| content-pipeline | Permitted adapters, weekly beat, validation | Never auto-publishes |
| editorial | Native-speaker approve/reject/rollback | Audited |
| notifications / outbox | Transactional events | Server |
| admin / observability | Health, metrics hooks, structured logs | No secrets/PII |

## Data invariants

1. Learners and RAG see **published** `LessonVersion` rows only.
2. Attempts point at an immutable version id.
3. Accepted answers are never included in lesson payloads before submission.
4. XP is inserted into an append-only ledger with uniqueness `(user_id, attempt_id, reason)`.
5. Hearts cannot go negative; spend is a compare-and-update.
6. Streaks are computed in the learner's IANA timezone.
7. Invalid, unlicensed, or failing-self-test drafts cannot be published.

## Clients

Web uses HttpOnly cookies + CSRF double-submit for cookie sessions, or a bearer token from demo login. Mobile stores the refresh token in SecureStore (unverified on device in this environment) and sends the access token as `Authorization`.

Hebrew UI islands always set `lang="he"` and `dir="rtl"`. The chrome follows the UI language (ru/en, LTR) with logical CSS. See [ADR 0003](adr/0003-rtl-and-bidi.md).

## Local vs Compose

This workspace has no Docker daemon. The API therefore supports a **documented SQLite local fallback** so the learning loop can run here. Compose files target PostgreSQL 16 + pgvector + Redis + Keycloak + MinIO. SQLite is forbidden when `BITI_ENV=production`.

## What is not invented

No iOS 27-only APIs, no fabricated Expo Glass APIs, no fake TTS, no fabricated pronunciation scores, no silent LLM. Missing providers return a typed `unavailable` capability.
