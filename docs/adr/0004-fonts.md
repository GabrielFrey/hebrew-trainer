# ADR 0004 — Hebrew fonts

**Status:** accepted  
**Date:** 2026-10-22

## Context

Niqqud must sit on the correct letter. Cursive *ktav yad* needs a distinct face. Fonts must be OFL or otherwise licensed.

## Decision

- UI Hebrew and exercises: **Noto Sans Hebrew** (SIL OFL 1.1) via `next/font/google`.
- Reading passages: **Frank Ruhl Libre** (SIL OFL 1.1).
- LTR chrome: **Source Serif 4** + system sans fallback.
- Dynamic Type / browser zoom must not clip niqqud: line-height ≥ 1.5 on pointed text, padding on glyphs.
- A dedicated OFL cursive webfont is **not** vendored in this slice. Cursive tracing uses stroke paths + print fallback, labeled as such. Shipping Gveret Levin (OFL) is a next step pending file vendor + mark-position checks on iOS/Android.

## Consequences

Cursive handwriting recognition quality is limited until a cursive face is vendored and checked on devices. Print niqqud is verified in Chromium here; iOS/Android mark placement is unverified.
