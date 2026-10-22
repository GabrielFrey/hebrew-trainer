"""AI tutor: structured feedback, published-only RAG, never awards XP."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError, field_validator

from biti.config import get_settings
from biti.hebrew import strip_bidi_and_zw

ALLOWED_CATEGORIES = {"spelling", "grammar", "vocabulary", "register", "niqqud", "word_order"}
ALLOWED_SEVERITY = {"info", "minor", "major"}
INJECTION_MARKERS = ("ignore previous", "system:", "you are now", "bypass", "<script")


class Span(BaseModel):
    start: int
    end: int


class Finding(BaseModel):
    span: Span
    category: str
    severity: str
    correction: str
    explanation: str

    @field_validator("category")
    @classmethod
    def cat(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            raise ValueError("bad category")
        return v

    @field_validator("severity")
    @classmethod
    def sev(cls, v: str) -> str:
        if v not in ALLOWED_SEVERITY:
            raise ValueError("bad severity")
        return v


class Citation(BaseModel):
    lesson_id: str
    version: int
    section: str


class TutorFeedback(BaseModel):
    summary: str
    findings: list[Finding] = Field(default_factory=list)
    next_step: str
    citations: list[Citation] = Field(default_factory=list)
    source: str = "static"


def tutor_status() -> dict[str, Any]:
    s = get_settings()
    ready = bool(s.llm_base_url and s.llm_api_key)
    return {
        "capability": "ready" if ready else "unavailable",
        "model": s.llm_model if ready else None,
        "reason": None if ready else "BITI_LLM_BASE_URL or BITI_LLM_API_KEY is unset",
        "daily_token_budget": s.llm_daily_token_budget,
        "awards_xp": False,
    }


def static_explain(grade: dict[str, Any], exercise: dict[str, Any], ui: str) -> TutorFeedback:
    result = grade.get("result")
    if ui == "ru":
        if result == "correct":
            summary = "Ответ принят. ИИ не начисляет XP — это уже сделал сервер проверки."
        elif result == "almost":
            summary = "Почти: одна-две буквы отличаются после нормализации."
        else:
            summary = "Ответ не совпал с принятыми вариантами. Сверьте корень, род и конечные буквы."
        nxt = "Повторите слово вслух и наберите его ещё раз без транскрипции."
    else:
        if result == "correct":
            summary = "Accepted. The tutor never awards XP — the grader already did."
        elif result == "almost":
            summary = "Almost: one or two letters differ after normalization."
        else:
            summary = "The answer did not match the accepted forms. Check root, gender, and final letters."
        nxt = "Say the word aloud and type it again without relying on transliteration."
    findings = []
    for d in grade.get("diff") or []:
        findings.append(
            Finding(
                span=Span(start=int(d.get("start", 0)), end=int(d.get("end", 0))),
                category="spelling",
                severity="minor" if result == "almost" else "major",
                correction=str(d.get("expected") or ""),
                explanation=summary,
            )
        )
    return TutorFeedback(summary=summary, findings=findings, next_step=nxt, citations=[], source="static")


def validate_spans(feedback: TutorFeedback, normalized_answer: str) -> TutorFeedback:
    n = len(normalized_answer)
    kept = []
    for f in feedback.findings:
        if 0 <= f.span.start <= f.span.end <= n:
            kept.append(f)
    feedback.findings = kept
    return feedback


def retrieve(db, query: str, limit: int = 3) -> list[dict[str, Any]]:
    from biti.models import Lesson, LessonVersion, PublishedChunk

    q = query.strip()[:80]
    if not q:
        return []
    rows = (
        db.query(PublishedChunk, LessonVersion, Lesson)
        .join(LessonVersion, LessonVersion.id == PublishedChunk.lesson_version_id)
        .join(Lesson, Lesson.id == LessonVersion.lesson_id)
        .filter(LessonVersion.status == "published", Lesson.status == "published")
        .all()
    )
    scored = []
    for chunk, version, lesson in rows:
        if q.lower() in (chunk.text or "").lower() or any(ch in (chunk.text or "") for ch in q if "\u05D0" <= ch <= "\u05EA"):
            scored.append(
                {
                    "lesson_id": lesson.id,
                    "slug": lesson.slug,
                    "version": version.version,
                    "section": chunk.section,
                    "text": chunk.text[:280],
                }
            )
    return scored[:limit]


def _looks_injected(text: str) -> bool:
    low = text.lower()
    return any(m in low for m in INJECTION_MARKERS)


async def llm_feedback(prompt: str, normalized: str) -> TutorFeedback | None:
    s = get_settings()
    if not (s.llm_base_url and s.llm_api_key):
        return None
    if _looks_injected(prompt):
        return None
    body = {
        "model": s.llm_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a Modern Hebrew tutor. Reply with JSON only: "
                    "{summary, findings[{span{start,end}, category, severity, correction, explanation}], "
                    "next_step, citations[{lesson_id, version, section}]}. "
                    "Never award XP or change progress. Escape untrusted text."
                ),
            },
            {"role": "user", "content": strip_bidi_and_zw(prompt)[:2000]},
        ],
        "temperature": 0.2,
    }
    url = s.llm_base_url.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {s.llm_api_key}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=s.llm_timeout_seconds) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        content = data["choices"][0]["message"]["content"]
        content = re.sub(r"^```json|```$", "", content.strip())
        parsed = TutorFeedback.model_validate(json.loads(content))
        parsed.source = "llm"
        return validate_spans(parsed, normalized)
    except (httpx.HTTPError, KeyError, json.JSONDecodeError, ValidationError, TimeoutError):
        return None
