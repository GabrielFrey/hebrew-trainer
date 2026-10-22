# Requirements matrix

Status key: `done` · `partial` · `unverified` · `blocked` · `planned`

| ID | Requirement | Implementation | Verification | Status |
| --- | --- | --- | --- | --- |
| A1 | Monorepo apps/web,mobile,api + packages + content + docs + compose | Repository layout | Tree listing | done |
| A2 | architecture, plan, matrix, ADRs, versions, licensing, curriculum | `docs/` | Review | done |
| A3 | Pin exact versions from official sources | `docs/versions.md` | Sources recorded 2026-10-22 | done |
| A4 | FastAPI + SQLAlchemy + Alembic | `apps/api` | pytest 23 passed + `/health` | done (SQLite local; Postgres via Compose unverified) |
| A5 | Auth OIDC + demo-gated | `biti/auth.py` | Demo tests; OIDC unverified | partial |
| A6 | Design tokens + Hebrew typography | `packages/design-tokens`, web fonts | Visual in Chromium | partial (cursive OFL font not vendored) |
| A7 | Compose stack | `infra/compose` | File present; Docker daemon missing | unverified |
| A8 | CI lint/test/openapi/e2e | `.github/workflows/ci.yml` | Workflow present; GH runners unverified | partial |
| B1 | Web vertical flow | `apps/web` | Playwright 1,3,5,6,7,15 + axe: 8 passed locally 2026-10-22 | done (GH runners unverified) |
| B2 | Mobile vertical flow | `apps/mobile` | expo-doctor 20/20 (SDK 58); `tsc --noEmit`; `expo export` ios/android/web; 390×844 light/dark screenshots | partial (native device unverified) |
| B3 | Deterministic grading + modes | `biti/grading.py` + vectors | pytest vectors | done |
| B4 | Answers never leak | lesson serializer | pytest + Playwright 3 | done |
| B5 | XP once under retry | ledger unique | pytest concurrency | done |
| B6 | Audio honest unavailable | audio router + UI | no TTS key; Playwright 7 | done |
| C1 | Full tree + published first levels in 5 pairs | `catalog.py` + seed | 808 mapped, 33 published playable, 775 planned; 5 courses | partial (Bet–Hey planned; starter 19/134, Aleph 14/170 published) |
| C2 | Prerequisite graph + legendary bosses | curriculum + path units | API + UI + Playwright 1 | done |
| C3 | SRS 1/3/7/14/30 | `biti/srs.py` | pytest including timezone/DST | done |
| C4 | Hearts / streak / league | gamification services | pytest | done |
| C5 | Alphabet + verb explorer | API + screens | web + axe | done |
| C6 | Placement | `/placement` | web + axe | done |
| D1 | Tutor adapter + fallback | `biti/tutor.py` | timeout/malformed tests | done (LLM key absent → fallback) |
| D2 | Published-only RAG | retrieval filter | pytest | done |
| D3 | Structured spans validated | tutor schema | pytest | done |
| D4 | AI never awards XP | code path | pytest | done |
| E1 | Permitted adapters | `biti/pipeline.py` | unit tests + optional live fetch | partial (live fetch depends on egress) |
| E2 | Editorial approve/publish | API + `/editorial` | API tests | done |
| E3 | No auto-publish | pipeline creates drafts | pytest | done |
| F1 | Offline replay | web localStorage queue; native `expo-sqlite` | web queue; device SQLite unverified | partial |
| F2 | a11y WCAG 2.2 AA | semantic UI, lang=he | Playwright axe on onboarding/learn/lesson/review/alphabet/verbs/profile/placement: passed locally | partial (GH unverified; not a full AA audit) |
| F3 | RTL visual regression | Playwright acceptance 5 | passed locally | done (GH unverified) |
| F4 | Speech | capability endpoint | unavailable without provider | done (honest) |
| F5 | Native iOS/Android builds | Expo export only | `expo export` ios/android; no Xcode/Gradle store build | unverified |
| F6 | Perf budgets | `docs/performance.md` | not measured under load | partial |

Updated as milestones complete.

## Catalog snapshot (2026-10-22)

Shared Hebrew tree for `he-ru` · `he-uk` · `he-en` · `he-es` · `he-fr`. uk/es/fr strings are `in_review`.

| Level | Ulpan | Mapped | Published | Planned |
| --- | --- | ---: | ---: | ---: |
| Starter | pre-Aleph | 134 | 19 | 115 |
| Beginner | Aleph | 170 | 14 | 156 |
| Elementary | Bet | 162 | 0 | 162 |
| Intermediate | Gimel | 144 | 0 | 144 |
| Upper | Dalet | 102 | 0 | 102 |
| Advanced | Hey | 96 | 0 | 96 |
| **Total** | | **808** | **33** | **775** |
