# Pinned versions

Recorded 22 October 2026. Only stable releases. No canary, RC, or beta pins.

| Package | Version | Date checked | Source | Constraints |
| --- | --- | --- | --- | --- |
| Next.js | 16.4.2 | 2026-10-22 | https://www.npmjs.com/package/next and https://nextjs.org/docs/app | Spec requires stable Next.js ≥15. 16.4.2 is current stable. Not canary. |
| React / React DOM (web) | 19.3.0 | 2026-10-22 | create-next-app@16.4.2 lockfile | Paired with Next 16.4.2. |
| TypeScript (web scaffold) | 5.x from create-next-app | 2026-10-22 | create-next-app@16.4.2 | Strict mode enabled in apps/web. Exact patch follows the scaffold lockfile. |
| Tailwind CSS | 4.x from create-next-app | 2026-10-22 | create-next-app@16.4.2 | Used with logical CSS properties for RTL. |
| FastAPI | 0.159.1 | 2026-10-22 | https://fastapi.tiangolo.com/release-notes/ (0.159.1 on 2026-10-21) | Modular monolith API. |
| Uvicorn | 0.54.0 | 2026-10-22 | PyPI `uvicorn` | ASGI server. |
| Pydantic | 2.14.1 | 2026-10-22 | PyPI `pydantic` | Request/response models and tutor JSON schema. |
| SQLAlchemy | 2.1.6 | 2026-10-22 | https://www.sqlalchemy.org/download.html | Current 2.1 series. |
| Alembic | 1.20.1 | 2026-10-22 | https://pypi.org/project/alembic/ | Requires SQLAlchemy ≥2.0. |
| Celery | 5.6.3 | 2026-10-22 | PyPI `celery` | Latest stable 5.6.x. 5.7.0 is RC only — not pinned. |
| Redis (Python) | 8.1.0 | 2026-10-22 | PyPI `redis` | Optional locally; required in Compose. |
| PyJWT | 2.15.1 | 2026-10-22 | PyPI `PyJWT` | Demo-mode and resource JWTs. |
| HTTPX | 0.28.1 | 2026-10-22 | PyPI `httpx` | OIDC JWKS, LLM adapter, pipeline fetches. |
| psycopg | 3.3.6 | 2026-10-22 | PyPI `psycopg` | PostgreSQL driver for Compose. |
| Ruff | 0.17.1 | 2026-10-22 | PyPI `ruff` | Lint + format. |
| Pytest | 9.1.1 | 2026-10-22 | PyPI `pytest` | API and grading tests. |
| Expo SDK (mobile) | 54.0.36 | 2026-10-22 | Existing trainer `package.json` and https://docs.expo.dev | Spec: RN version per Expo SDK. SDK 54 is the version already verified in this repo for `expo-glass-effect`. Latest Expo docs now list SDK 58; we did **not** invent an SDK 58 migration. |
| React Native (mobile) | 0.81.5 | 2026-10-22 | Expo SDK 54 pairing | Official SDK 54 pairing. |
| React (mobile) | 19.1.0 | 2026-10-22 | Expo SDK 54 pairing | Must stay on the Expo 54 set. |
| expo-glass-effect | 0.1.10 | 2026-10-22 | Expo SDK 54 app + https://docs.expo.dev/versions/latest/sdk/glass-effect/ | `GlassView` is iOS 26+ only; docs say it falls back to `View` elsewhere. Latest docs are published under SDK 58; runtime here remains SDK 54. |
| expo-router | 6.0.24 | 2026-10-22 | Expo SDK 54 pairing | File-based mobile routing. |
| PostgreSQL (Compose) | 16.15-alpine | 2026-10-22 | Docker Hub official `postgres` 16 tags | Compose image pin. Not started in this workspace (no Docker daemon). |
| Redis (Compose) | 7.4-alpine | 2026-10-22 | Docker Hub official `redis` 7 tags | Compose image pin. |
| Keycloak (Compose) | 26.0 | 2026-10-22 | https://www.keycloak.org/downloads (26.x current major at check time) | Dev OIDC only. Image tag `quay.io/keycloak/keycloak:26.0`. Unverified against a running Keycloak in this environment. |
| MinIO | RELEASE.2024-12-18T13-15-44Z | 2026-10-22 | MinIO release tags (pinned known-stable) | Optional object storage. Not started here. |
| pgvector | 0.8.0 image extras | 2026-10-22 | `pgvector/pgvector:pg16` | Used only when PostgreSQL is available. SQLite local fallback stores embeddings as JSON and marks RAG degraded. |

## Official pages rechecked at implementation time

| Topic | URL | Result |
| --- | --- | --- |
| Next.js App Router | https://nextjs.org/docs/app | App Router is file-system based; used `create-next-app@16.4.2` with `--app`. |
| Expo GlassEffect | https://docs.expo.dev/versions/latest/sdk/glass-effect/ | `GlassView` iOS 26+; fallback `View`. Check `isLiquidGlassAvailable` / `isGlassEffectAPIAvailable`. Do not put Hebrew lesson text on glass. |
| Apple Materials HIG | https://developer.apple.com/design/human-interface-guidelines/materials | Page fetched; treat glass as chrome, not dense reading surfaces. |
| Apple Adopting Liquid Glass | https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass | Rechecked; no iOS 27-only API was invented. Native Liquid Glass is unverified without Xcode 26+ device/simulator. |
| W3C `dir` | https://www.w3.org/International/questions/qa-html-dir | Use `dir` on the page / Hebrew islands; logical CSS. |
| UAX #9 | https://www.unicode.org/reports/tr9/ | Bidi isolation via `<bdi>`, `dir="auto"` / FSI-PDI. No visual-reordering hacks. |
| RN I18nManager | https://reactnative.dev/docs/i18nmanager | `forceRTL` / `allowRTL` for Hebrew-first mobile layout. Device test unverified. |
| Academy of the Hebrew Language | https://hebrew-academy.org.il/ | Public site. Pipeline adapter records URL, fetch date, checksum, and does not auto-publish. Terms compliance is editorial. |
| Wiktionary copyrights | https://en.wiktionary.org/wiki/Wiktionary:Copyrights | CC BY-SA. Attribution required. |

## Explicitly unverified

- iOS 26/27 Liquid Glass on a physical device or Xcode 26 simulator.
- Expo SDK 58 + RN 0.88 pairing (docs exist; this repo stays on verified SDK 54).
- Live Keycloak login round-trip.
- Cloud TTS / speech scoring (no keys in this environment).
- Cloud or local LLM until `BITI_LLM_BASE_URL` is set.
- pgvector ANN query quality on production-scale content.
