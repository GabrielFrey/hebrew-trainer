# Requirements matrix

Status key: `done` · `partial` · `unverified` · `blocked` · `planned`

| ID | Requirement | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| A1 | Monorepo apps/web,mobile,api + packages + content + docs + compose | Repository layout | Tree listing | done |
| A2 | architecture, plan, matrix, ADRs, versions, licensing, curriculum | `docs/` | Review | done |
| A3 | Pin exact versions from official sources | `docs/versions.md` | Sources recorded 2026-10-22 | done |
| A4 | FastAPI + SQLAlchemy + Alembic | `apps/api` | pytest + `/health` | done (SQLite local; Postgres via Compose unverified) |
| A5 | Auth OIDC + demo-gated | `biti/auth.py` | Demo tests; OIDC unverified | partial |
| A6 | Design tokens + Hebrew typography | `packages/design-tokens`, web fonts | Visual in Chromium | partial (cursive OFL font not vendored) |
| A7 | Compose stack | `infra/compose` | File present; Docker daemon missing | unverified |
| A8 | CI lint/test/openapi | `.github/workflows/ci.yml` | Workflow present; GH runners unverified | partial |
| B1 | Web vertical flow | `apps/web` | Browser lesson loop | in progress |
| B2 | Mobile vertical flow | `apps/mobile` | Expo web; device unverified | in progress |
| B3 | Deterministic grading + modes | `biti/grading.py` + vectors | pytest vectors | done |
| B4 | Answers never leak | lesson serializer | pytest | done |
| B5 | XP once under retry | ledger unique | pytest concurrency | done |
| B6 | Audio honest unavailable | audio router + UI | no TTS key | done |
| C1 | 24 published lessons | `biti/seed.py` | seed validation | done |
| C2 | Prerequisite graph + bosses | curriculum + web path | API + UI | done |
| C3 | SRS 1/3/7/14/30 | `biti/srs.py` | pytest | done |
| C4 | Hearts / streak / league | gamification services | pytest | done |
| C5 | Alphabet + verb explorer | API + screens | web | done |
| C6 | Placement | `/placement` | web | done |
| D1 | Tutor adapter + fallback | `biti/tutor.py` | timeout/malformed tests | done (LLM key absent → fallback) |
| D2 | Published-only RAG | retrieval filter | pytest | done |
| D3 | Structured spans validated | tutor schema | pytest | done |
| D4 | AI never awards XP | code path | pytest | done |
| E1 | Permitted adapters | `biti/pipeline.py` | unit tests + optional live fetch | partial (live fetch depends on egress) |
| E2 | Editorial approve/publish | API + `/editorial` | API tests | done |
| E3 | No auto-publish | pipeline creates drafts | pytest | done |
| F1 | Offline replay | web IndexedDB queue | basic web queue; device SQLite unverified | partial |
| F2 | a11y WCAG 2.2 AA | semantic UI, lang=he | axe/Playwright unverified in CI | partial |
| F3 | RTL visual regression | Playwright | not run in this environment | unverified |
| F4 | Speech | capability endpoint | unavailable without provider | done (honest) |
| F5 | Native iOS/Android builds | Expo | not run | unverified |
| F6 | Perf budgets | `docs/performance.md` | not measured under load | partial |

Updated as milestones complete.
