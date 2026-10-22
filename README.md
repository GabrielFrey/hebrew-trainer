# Biti Ivrit

Cross-platform Modern Hebrew from the first letter to everyday Israeli life. Short lessons, deterministic **server** grading, spaced repetition (1/3/7/14/30 days), ulpan-style conversation, and a native-speaker editorial gate.

The brand string is configurable (`BITI_BRAND` / i18n `brand.name`). Default: **Biti Ivrit** / ביתי עברית.

The previous on-device trainer stays intact on `main`. This branch (`biti-ivrit`) is a new monorepo. Useful logic from that trainer (verb tables, keyboard layout, glass fallbacks) was reused, not shipped as the product.

## What runs here

| Surface | Command | URL |
| --- | --- | --- |
| API | `apps/api/.venv/bin/uvicorn biti.main:app --app-dir apps/api --host 127.0.0.1 --port 43180` | http://127.0.0.1:43180/docs |
| Web | `npm --prefix apps/web run dev` | http://127.0.0.1:43181 |
| Mobile | `npm --prefix apps/mobile install && EXPO_PUBLIC_API_URL=http://127.0.0.1:43180 npx --prefix apps/mobile expo start --web --port 43182` | Expo / emulator |

Android emulator API URL: `http://10.0.2.2:43180`. iOS simulator: `http://127.0.0.1:43180`. Physical device: your LAN IP.

This workspace has **no Docker daemon**. Compose files are in `infra/compose/`. Locally the API uses **SQLite** (`BITI_DATABASE_URL=sqlite:///…`). SQLite is rejected when `BITI_ENV=production`.

## First-time setup

```bash
python3 -m venv apps/api/.venv
apps/api/.venv/bin/pip install -r apps/api/requirements.txt
cp .env.example .env
npm --prefix apps/web install
apps/api/.venv/bin/pytest apps/api/tests
```

Demo login is **development-only**. The process refuses to start if `BITI_DEMO_MODE=true` and `BITI_ENV=production`.

## Honest unavailable states

No TTS, speech, or LLM credentials are bundled.

- Audio routes report `capability: unavailable`. Listening items are not mandatory.
- Speech routes report `capability: unavailable`. No scores are invented.
- Tutor uses a static-rule fallback. It **never** awards XP or publishes.

Set `BITI_TTS_*`, `BITI_SPEECH_*`, or `BITI_LLM_BASE_URL` + `BITI_LLM_API_KEY` to enable those adapters.

## Hebrew input and fonts

- Web: OS Hebrew IME plus an in-app keyboard (finals ךםןףץ, optional niqqud palette). Lesson islands use `lang="he" dir="rtl"` and `<bdi>`.
- Mobile: OS Hebrew keyboard; `I18nManager.allowRTL(true)`. Device RTL chrome is unverified here.
- Fonts (SIL OFL via `next/font/google`): Noto Sans Hebrew, Frank Ruhl Libre, Source Serif 4. Cursive *ktav yad* webfont is **not** vendored yet — tracing uses a labeled print fallback.

## Editorial and weekly pipeline

```bash
# as editor (demo)
curl -s -X POST http://127.0.0.1:43180/auth/demo \
  -H 'content-type: application/json' \
  -d '{"ui_language":"en","display_name":"Editor","role":"editor"}'
curl -s -X POST http://127.0.0.1:43180/pipeline/run -H "Authorization: Bearer …"
```

Adapters: original frequency starter, Wiktionary (CC BY-SA + attribution), Academy homepage (terms review required), Project Ben-Yehuda index. Nothing auto-publishes. Native-speaker flag is required to publish.

Celery beat schedule is `BITI_PIPELINE_CRON` (default Monday 03:00 UTC). Redis is required for the worker; without Redis, trigger the pipeline from the API.

## Reset local data

```bash
rm -f data/local/*.sqlite
```

## Docs

- [Architecture](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Requirements matrix](docs/requirements-matrix.md)
- [Curriculum](docs/curriculum.md)
- [Versions](docs/versions.md)
- [Licensing](docs/content-licensing.md)
- [ADRs](docs/adr/)
- [Performance](docs/performance.md)
- [Color research and palette](docs/color-research.md) — tokens in `packages/design-tokens`; `python3 scripts/check_contrast.py` is the WCAG AA gate; `python3 scripts/render_biti_art.py` rebuilds the Biti icon and mascot rasters.

## Tests / CI

`apps/api/.venv/bin/pytest apps/api/tests` — grading vectors, answer non-leak, XP-once, AI-never-XP, seed ≥24 lessons, unpublishable drafts.

CI: `.github/workflows/ci.yml` (ruff, pytest, OpenAPI export, web lint/build, Playwright + axe). Native device jobs are not wired — marked unverified.

E2E locally: `npx playwright install chromium && npm run test:e2e` (API on :43180, web on :43181).
