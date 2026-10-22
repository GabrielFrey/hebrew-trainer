# ADR 0006 — Grading normalization

**Status:** accepted  
**Date:** 2026-10-22

## Context

Learners type Hebrew with or without niqqud, mix final letters, and paste punctuation. Some drills exist *to* test those distinctions.

## Decision

Server-side only. Modes are stored on the exercise version:

| Mode | NFC/NFD | Strip niqqud | Finals | Geresh/quotes | Maqaf | Whitespace | Latin case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `relaxed` | NFC | yes | normalize | yes | yes | collapse | lower |
| `strict_niqqud` | NFC | **no** | no | yes | yes | trim | n/a |
| `strict_finals` | NFC | yes | **no** | yes | yes | trim | n/a |
| `strict_root` | NFC | yes | yes | yes | yes | strip non-letters | n/a |

Always: length cap, strip bidi/zero-width, never HTML-unescape into render. Ktiv male/haser only via explicit accepted-answer variants. Partial credit and `almost` are documented per rule id; `almost` is never stored as correct. Result is reproducible from `(exercise_version_id, answer, mode)`.

Transliteration is never the grading target unless `grade_target: transliteration`.

## Consequences

Shared JSON vectors in `packages/grading/vectors` are the contract between Python and TypeScript. Client-side hints may preview; the recorded score is the server result.
