# ADR 0008 — Content licensing and publish gate

**Status:** accepted  
**Date:** 2026-10-22

## Context

A weekly fetch pipeline will touch third-party Hebrew text. Auto-publishing is unsafe.

## Decision

- Every `ContentSource` stores URL, license, fetch timestamp, checksum, and adapter id.
- Adapters: Wiktionary (CC BY-SA + attribution), Academy pages (record terms), Ben-Yehuda (public domain), original frequency starter.
- Validation: schema, niqqud consistency, self-test answers, safety, license present.
- Publish requires role `editor` or `content_admin` and a recorded native-reviewer id.
- Injected or suspicious payloads are flagged and never published.
- RAG indexes published versions only.

## Consequences

The pipeline can create drafts unattended; learners never see them. Wiktionary share-alike applies to derived text that includes Wiktionary wording.
