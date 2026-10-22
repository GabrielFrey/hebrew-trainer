# ADR 0003 — RTL, bidi, and I18nManager

**Status:** accepted  
**Date:** 2026-10-22

## Context

UI languages are Russian and English (LTR). The target language is Modern Israeli Hebrew (RTL). Mixing them incorrectly reorders digits, niqqud, and punctuation.

## Decision

- Follow W3C `dir` guidance: set `dir` on the document chrome from UI language; set `lang="he" dir="rtl"` on Hebrew islands.
- Use logical CSS (`margin-inline-start`, `padding-inline`, `inset-inline-start`, `text-align: start`).
- Isolate opposite-direction fragments with `<bdi>` or `dir="auto"`. Do not reverse strings in code.
- Unicode bidi controls in learner input are stripped before grading and before any render (UAX #9 abuse).
- Mobile: `I18nManager.allowRTL(true)` and force RTL only when the UI language is Hebrew. Device verification is pending.
- Icons that encode direction are mirrored in RTL; icons that encode time/play are not.

## Consequences

Playwright visual checks should assert Hebrew islands, not whole-page `dir=rtl` when UI is Russian. Caret behavior on web is browser-native; we do not implement a custom caret.
