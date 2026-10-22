# ADR 0005 — TTS provider

**Status:** accepted  
**Date:** 2026-10-22

## Context

Listening exercises need pointed-Hebrew audio. No TTS credential is available in this environment. Spec forbids silent mocks.

## Decision

Define `TTSProvider` with `capability: unavailable | generating | ready`. When `BITI_TTS_API_KEY` / local endpoint is unset, every audio route returns HTTP 200 with `{ "capability": "unavailable" }` or the asset metadata `status: unavailable`. Listening items are excluded from the mandatory completion denominator. The UI shows an honest “Audio unavailable” state. Playback controls (play, 0.75, 0.5, replay, transcript) render disabled.

Cache key once a provider exists: `(pointed_text, voice, provider, version)` in object storage.

## Consequences

Conversation/listening lessons remain completable. Native recordings can still be attached later with license/consent.
