# ADR 0001 — Modular monolith

**Status:** accepted  
**Date:** 2026-10-22

## Context

The product needs one authoritative grading, XP, SRS, and publishing path shared by web and mobile. A fleet of microservices would add operational cost without an independent scale reason.

## Decision

Ship one FastAPI process with internal modules (auth, curriculum, grading, …) and Celery for asynchronous work. Postgres is the system of record. Clients consume one OpenAPI contract.

## Consequences

Schema changes land in one Alembic train. Module boundaries are Python packages, not network calls. Horizontal split remains possible later behind the same contract.
