# Implementation plan

Work stays on branch `biti-ivrit`. `main` is not modified.

## Milestone A — Foundation

- Monorepo layout, version pin file, ADRs, curriculum map, licensing register.
- FastAPI app with SQLAlchemy models, Alembic migration, demo-gated auth, OpenAPI.
- Shared `hebrew-text` (TS + Python), grading test vectors, design tokens, i18n dictionaries.
- Docker Compose, CI workflow, `.env.example`.
- Verify: unit tests, ruff, OpenAPI export, API `/health`.

## Milestone B — Vertical flow

- Web onboarding → first alphabet lesson → grammar lesson.
- Mobile client against the same API.
- Deterministic grading with normalization modes.
- XP ledger + progress persistence.
- Audio controls with honest unavailable (no TTS key).
- Verify: grading vectors, XP idempotency, answer non-leak, web lesson completion.

## Milestone C — Learning product

- Prerequisite graph and Aleph→Dalet path with boss nodes.
- ≥24 published lessons (6 script, 6 grammar/roots, 6 vocabulary, 6 conversation).
- SRS 1/3/7/14/30, hearts, streak, weekly league.
- Alphabet reference, verb explorer, placement diagnostic.
- Empty / loading / error / offline / unavailable states.

## Milestone D — AI tutor

- OpenAI-compatible adapter, published-only RAG.
- Structured feedback JSON, span validation, 3-level hints (hearts / XP multiplier).
- Level-bounded conversation partner.
- Timeouts, budgets, injection resistance, static fallback.
- Grading and XP never depend on the tutor.

## Milestone E — Content pipeline

- Real adapters for permitted sources only.
- Weekly Celery beat + manual trigger, single-run lock, dedupe, validation.
- Editorial panel: diff, comments, approve/reject, publish, rollback.
- Native-speaker approval required. No auto-publish.

## Milestone F — Hardening

- Offline event queue + replay.
- Concurrency and security tests.
- RTL / axe Playwright where the environment allows.
- Performance notes, speech provider hook, native-build notes.

## Local commands

```bash
# API (SQLite fallback)
python3 -m venv apps/api/.venv
apps/api/.venv/bin/pip install -r apps/api/requirements.txt
BITI_DEMO_MODE=true BITI_ENV=development \
  BITI_DATABASE_URL=sqlite:///./data/local/biti.sqlite \
  apps/api/.venv/bin/uvicorn biti.main:app --app-dir apps/api --host 127.0.0.1 --port 43180

# Web
npm --prefix apps/web install
NEXT_PUBLIC_API_URL=http://127.0.0.1:43180 npm --prefix apps/web run dev -- --port 43181 --hostname 127.0.0.1

# Mobile (Expo SDK 54)
npm --prefix apps/mobile install
EXPO_PUBLIC_API_URL=http://127.0.0.1:43180 npx --prefix apps/mobile expo start --web --port 43182

# Tests
apps/api/.venv/bin/pytest apps/api/tests
npm --prefix apps/web run lint
```

Emulator API URL: `http://10.0.2.2:43180` (Android) or `http://127.0.0.1:43180` (iOS simulator). Physical device: machine LAN IP, not localhost.
