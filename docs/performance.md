# Performance budgets

Targets (not yet load-tested):

| Metric | Budget | Measured here |
| --- | --- | --- |
| Lesson payload p95 | < 300 ms local API | Local SQLite; see report after run |
| Grading p95 | < 80 ms | Unit-timed in pytest (single process) |
| Audio start | n/a while TTS unavailable | — |
| Web LCP | < 2.5 s on local preview | Unverified (no CrUX) |
| INP | < 200 ms | Unverified |

Do not treat this file as a load-test report. Record actual numbers in the final milestone report when measured.
