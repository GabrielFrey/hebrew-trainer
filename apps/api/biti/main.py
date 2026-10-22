from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from biti import BRAND_NAME, __version__
from biti.auth import demo_user, get_current_user, issue_token, require_role
from biti.config import get_settings
from biti.db import SessionLocal, get_db, init_db
from biti.grading import grade_exercise
from biti.models import (
    Attempt,
    AttemptEvent,
    AuditLog,
    Draft,
    EditorialReview,
    Lesson,
    LessonVersion,
    Notification,
    Outbox,
    SRSCard,
    SRSReview,
    Track,
    User,
    utcnow,
)
from biti.pipeline import run_pipeline, validate_draft_payload
from biti.seed import all_lesson_specs, public_exercises, seed
from biti.services import (
    SRS_STEPS,
    award_xp,
    regen_hearts,
    schedule_card,
    spend_heart,
    user_today,
    xp_for_correct,
)
from biti.tutor import llm_feedback, retrieve, static_explain, tutor_status
from biti.verbs import BINYANIM, find_paradigm, list_paradigms

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title=BRAND_NAME, version=__version__, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list + ["http://127.0.0.1:43182", "http://localhost:43182"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DemoLogin(BaseModel):
    ui_language: str = "ru"
    display_name: str = "Learner"
    role: str = "learner"
    timezone: str = "Asia/Jerusalem"
    motivation: str = "aliyah"


class SubmitBody(BaseModel):
    exercise_id: str
    value: Any = None
    pairs: dict[str, str] | None = None
    client_key: str = "default"
    hint_level: int = 0


class ReviewBody(BaseModel):
    value: str
    client_key: str = "default"


class TutorBody(BaseModel):
    attempt_id: str
    exercise_id: str
    message: str = ""


class EditorialBody(BaseModel):
    action: str
    comment: str = ""
    native_speaker: bool = False


class PlacementAnswer(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


def _published_version(db: Session, lesson: Lesson) -> LessonVersion:
    version = (
        db.query(LessonVersion)
        .filter(LessonVersion.lesson_id == lesson.id, LessonVersion.status == "published")
        .order_by(LessonVersion.version.desc())
        .first()
    )
    if not version:
        raise HTTPException(404, "no_published_version")
    return version


def _progress_map(db: Session, user: User) -> dict[str, Any]:
    rows = (
        db.query(Attempt, LessonVersion, Lesson)
        .join(LessonVersion, LessonVersion.id == Attempt.lesson_version_id)
        .join(Lesson, Lesson.id == LessonVersion.lesson_id)
        .filter(Attempt.user_id == user.id, Attempt.status == "completed")
        .all()
    )
    done = {lesson.slug: attempt.accuracy for attempt, _v, lesson in rows}
    return done


def _unlocked(spec_slug: str, specs: list[dict], done: dict[str, Any]) -> bool:
    by_slug = {s["slug"]: s for s in specs}
    spec = by_slug.get(spec_slug)
    if not spec:
        return False
    return all(p in done for p in spec.get("prerequisites") or [])


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "brand": BRAND_NAME, "version": __version__, "env": settings.env}


@app.get("/ready")
def ready(db: Session = Depends(get_db)) -> dict[str, Any]:
    n = db.query(Lesson).filter(Lesson.status == "published").count()
    return {"ok": n >= 24, "published_lessons": n, "demo_mode": settings.demo_mode}


@app.get("/meta")
def meta() -> dict[str, Any]:
    return {
        "brand": BRAND_NAME,
        "auth": {"mode": "demo" if settings.demo_mode else "oidc", "oidc_issuer": settings.oidc_issuer or None},
        "audio": {"capability": "ready" if settings.tts_api_key else "unavailable"},
        "speech": {"capability": "ready" if settings.speech_api_key else "unavailable"},
        "tutor": tutor_status(),
        "srs_steps_days": list(SRS_STEPS),
    }


@app.post("/auth/demo")
def auth_demo(body: DemoLogin, response: Response, db: Session = Depends(get_db)) -> dict[str, Any]:
    user = demo_user(db, body.ui_language, body.display_name, body.role)
    user.timezone = body.timezone
    user.motivation = body.motivation
    db.commit()
    token = issue_token(user)
    response.set_cookie("biti_session", token, httponly=True, samesite="lax", max_age=settings.access_token_minutes * 60)
    response.set_cookie("biti_csrf", "csrf-" + user.id[:8], httponly=False, samesite="lax")
    return {"access_token": token, "token_type": "bearer", "user": _user_public(user), "mode": "demo"}


@app.post("/auth/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("biti_session")
    return {"ok": "logged_out"}


@app.get("/auth/me")
def me(user: User = Depends(get_current_user)) -> dict[str, Any]:
    return _user_public(user)


def _user_public(user: User) -> dict[str, Any]:
    regen_hearts(user)
    return {
        "id": user.id,
        "display_name": user.display_name,
        "role": user.role,
        "ui_language": user.ui_language,
        "timezone": user.timezone,
        "motivation": user.motivation,
        "xp_total": user.xp_total,
        "streak": user.streak_count,
        "hearts": user.hearts,
        "league": user.league,
        "level": user.level,
        "daily_goal_xp": user.daily_goal_xp,
        "niqqud_default": user.niqqud_default,
        "translit_default": user.translit_default,
    }


@app.get("/curriculum/tracks")
def tracks(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.query(Track).order_by(Track.sort).all()
    return [{"id": t.id, "title": t.title, "status": t.status} for t in rows]


@app.get("/curriculum/path")
def path(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    specs = all_lesson_specs()
    done = _progress_map(db, user)
    nodes = []
    for spec in specs:
        lesson = db.query(Lesson).filter(Lesson.slug == spec["slug"]).one()
        nodes.append(
            {
                "slug": spec["slug"],
                "title": spec["title"],
                "track": spec["track"],
                "level": spec["level"],
                "kind": spec.get("kind", "lesson"),
                "prerequisites": spec.get("prerequisites") or [],
                "unlocked": _unlocked(spec["slug"], specs, done),
                "accuracy": done.get(spec["slug"]),
                "completed": spec["slug"] in done,
                "id": lesson.id,
            }
        )
    return {"nodes": nodes, "done": done}


@app.get("/lessons/{slug}")
def get_lesson(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    lesson = db.query(Lesson).filter(Lesson.slug == slug, Lesson.status == "published").one_or_none()
    if not lesson:
        raise HTTPException(404, "not_found")
    version = _published_version(db, lesson)
    return {
        "id": lesson.id,
        "slug": lesson.slug,
        "track": lesson.track_id,
        "level": lesson.level,
        "cefr": lesson.cefr,
        "kind": lesson.kind,
        "prerequisites": lesson.prerequisites,
        "version_id": version.id,
        "version": version.version,
        "title": version.title,
        "objective": version.objective,
        "explanation": version.explanation,
        "vocabulary": version.vocabulary,
        "exercises": public_exercises(version.exercises),
        "threshold": version.threshold,
        "editorial": {k: version.editorial.get(k) for k in ("author", "native_reviewer", "license", "version")},
        "audio": {"capability": "unavailable" if not settings.tts_api_key else "ready"},
        "speech": {"capability": "unavailable" if not settings.speech_api_key else "ready"},
    }


@app.post("/lessons/{slug}/start")
def start_lesson(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    lesson = db.query(Lesson).filter(Lesson.slug == slug, Lesson.status == "published").one_or_none()
    if not lesson:
        raise HTTPException(404, "not_found")
    done = _progress_map(db, user)
    if not _unlocked(slug, all_lesson_specs(), done) and slug not in done:
        raise HTTPException(403, "locked")
    version = _published_version(db, lesson)
    attempt = Attempt(user_id=user.id, lesson_version_id=version.id, results={})
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"attempt_id": attempt.id, "version_id": version.id}


@app.post("/attempts/{attempt_id}/submit")
def submit(
    attempt_id: str,
    body: SubmitBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    attempt = db.get(Attempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(404, "attempt_missing")
    version = db.get(LessonVersion, attempt.lesson_version_id)
    if not version:
        raise HTTPException(404, "version_missing")
    exercise = next((e for e in version.exercises if e["id"] == body.exercise_id), None)
    if not exercise:
        raise HTTPException(404, "exercise_missing")
    existing = (
        db.query(AttemptEvent)
        .filter(
            AttemptEvent.attempt_id == attempt.id,
            AttemptEvent.exercise_id == body.exercise_id,
            AttemptEvent.client_key == body.client_key,
        )
        .one_or_none()
    )
    if existing:
        return {"grade": existing.grade, "replayed": True, "hearts": user.hearts}
    if exercise.get("type") == "speak" or (exercise.get("requires_audio") and not settings.tts_api_key):
        grade = {"result": "skipped", "score": 0, "rule_ids": ["optional_unavailable"], "diff": []}
    else:
        grade = grade_exercise(exercise, {"value": body.value, "pairs": body.pairs}).as_dict()
        if grade["result"] != "correct":
            spend_heart(db, user)
    event = AttemptEvent(
        attempt_id=attempt.id,
        exercise_id=body.exercise_id,
        payload={"value": body.value, "pairs": body.pairs},
        grade=grade,
        client_key=body.client_key,
    )
    db.add(event)
    results = dict(attempt.results or {})
    results[body.exercise_id] = grade
    attempt.results = results
    attempt.hint_level = max(attempt.hint_level, body.hint_level)
    db.commit()
    return {"grade": grade, "replayed": False, "hearts": user.hearts}


@app.post("/attempts/{attempt_id}/complete")
def complete(
    attempt_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    attempt = db.get(Attempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(404, "attempt_missing")
    version = db.get(LessonVersion, attempt.lesson_version_id)
    mandatory = [e for e in version.exercises if not e.get("optional") and e.get("type") != "speak"]
    if not settings.tts_api_key:
        mandatory = [e for e in mandatory if not e.get("requires_audio")]
    grades = [attempt.results.get(e["id"]) for e in mandatory]
    if any(g is None for g in grades):
        raise HTTPException(400, "incomplete")
    correct = sum(1 for g in grades if g and g.get("result") == "correct")
    accuracy = correct / max(1, len(grades))
    attempt.accuracy = accuracy
    attempt.status = "completed"
    attempt.completed_at = utcnow()
    awarded = 0
    if accuracy + 1e-9 >= version.threshold:
        base = sum(xp_for_correct(attempt.hint_level, e.get("xp", 10)) for e in mandatory if attempt.results.get(e["id"], {}).get("result") == "correct")
        awarded += award_xp(db, user, attempt.id, "lesson", base)
        if accuracy == 1:
            awarded += award_xp(db, user, attempt.id, "perfect", 15)
        for e in version.exercises:
            if e.get("type") in {"type_he", "mc"} and e.get("accepted"):
                schedule_card(db, user, "vocab", {"id": e["id"], "he": (e.get("accepted") or [""])[0], "prompt": e.get("prompt")}, e.get("accepted") or [], True)
    db.commit()
    return {"accuracy": accuracy, "passed": accuracy >= version.threshold, "xp_awarded": awarded, "progress": _user_public(user)}


@app.get("/progress/me")
def progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    return {"user": _user_public(user), "completed": _progress_map(db, user), "today": user_today(user)}


@app.get("/srs/due")
def srs_due(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    today = user_today(user)
    cards = db.query(SRSCard).filter(SRSCard.user_id == user.id, SRSCard.due_day <= today).all()
    return {
        "today": today,
        "cards": [
            {"id": c.id, "kind": c.kind, "prompt": c.prompt, "step": c.step, "due_day": c.due_day}
            for c in cards
        ],
    }


@app.post("/srs/{card_id}/review")
def srs_review(
    card_id: str,
    body: ReviewBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    card = db.get(SRSCard, card_id)
    if not card or card.user_id != user.id:
        raise HTTPException(404, "card_missing")
    grade = grade_exercise({"type": "type_he", "accepted": card.accepted, "mode": "relaxed"}, {"value": body.value})
    correct = grade.result == "correct"
    schedule_card(db, user, card.kind, card.prompt, card.accepted, correct)
    db.add(SRSReview(card_id=card.id, result=grade.result))
    if correct:
        award_xp(db, user, f"srs:{card.id}:{body.client_key}", "srs", 5)
    db.commit()
    db.refresh(card)
    return {"grade": grade.as_dict(), "next_due": card.due_day, "step": card.step, "intervals": list(SRS_STEPS)}


@app.get("/alphabet")
def alphabet() -> dict[str, Any]:
    print_row = list("אבגדהוזחטיכלמנסעפצקרשת")
    finals = {"כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ"}
    names = {
        "א": "alef",
        "ב": "bet",
        "ג": "gimel",
        "ד": "dalet",
        "ה": "he",
        "ו": "vav",
        "ז": "zayin",
        "ח": "het",
        "ט": "tet",
        "י": "yod",
        "כ": "kaf",
        "ל": "lamed",
        "מ": "mem",
        "נ": "nun",
        "ס": "samekh",
        "ע": "ayin",
        "פ": "pe",
        "צ": "tsadi",
        "ק": "qof",
        "ר": "resh",
        "ש": "shin",
        "ת": "tav",
    }
    return {
        "print": [{"glyph": g, "name": names[g], "final": finals.get(g)} for g in print_row],
        "cursive_note": "OFL cursive webfont is not vendored yet; strokes are print-first.",
        "lookalikes": [["ב", "כ"], ["ד", "ר"], ["ה", "ח", "ת"], ["ו", "ז", "ן"], ["ס", "ם"]],
    }


@app.get("/verbs")
def verbs() -> dict[str, Any]:
    return {"binyanim": list(BINYANIM), "paradigms": list_paradigms()}


@app.get("/verbs/{root}")
def verb_root(root: str) -> dict[str, Any]:
    found = find_paradigm(root)
    if not found:
        raise HTTPException(404, "root_unknown")
    return {"root": root, "paradigms": found}


@app.get("/audio/status")
def audio_status() -> dict[str, Any]:
    return {"capability": "ready" if settings.tts_api_key else "unavailable", "provider": settings.tts_provider or None}


@app.get("/speech/status")
def speech_status() -> dict[str, Any]:
    return {"capability": "ready" if settings.speech_api_key else "unavailable", "scores_fabricated": False}


@app.get("/tutor/status")
def tutor_stat() -> dict[str, Any]:
    return tutor_status()


@app.post("/tutor/explain")
async def tutor_explain(body: TutorBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    attempt = db.get(Attempt, body.attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(404, "attempt_missing")
    version = db.get(LessonVersion, attempt.lesson_version_id)
    exercise = next((e for e in version.exercises if e["id"] == body.exercise_id), {})
    grade = (attempt.results or {}).get(body.exercise_id) or {}
    citations = retrieve(db, (exercise.get("prompt") or {}).get("en") or body.message)
    fb = await llm_feedback(
        f"Learner language={user.ui_language}. Exercise={exercise.get('id')}. Grade={grade}. Msg={body.message}",
        grade.get("normalized_answer") or "",
    )
    if fb is None:
        fb = static_explain(grade, exercise, user.ui_language)
    for c in citations:
        fb.citations.append(type(fb.citations).__args__[0](lesson_id=c["lesson_id"], version=c["version"], section=c["section"])) if False else None
    payload = fb.model_dump()
    if citations:
        payload["citations"] = [
            {"lesson_id": c["lesson_id"], "version": c["version"], "section": c["section"]} for c in citations
        ]
    payload["awards_xp"] = False
    return payload


@app.post("/tutor/chat")
async def tutor_chat(body: TutorBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    status = tutor_status()
    citations = retrieve(db, body.message)
    if status["capability"] != "ready":
        return {
            "capability": "unavailable",
            "reply": "Conversation partner is unavailable until an OpenAI-compatible endpoint is configured.",
            "corrections": [],
            "citations": citations,
            "awards_xp": False,
        }
    fb = await llm_feedback(f"Level={user.level}. Conversation: {body.message}", body.message)
    if fb is None:
        return {
            "capability": "fallback",
            "reply": "I could not reach the model. Try a published lesson phrase: שלום, מה שמך?",
            "corrections": [],
            "citations": citations,
            "awards_xp": False,
        }
    return {**fb.model_dump(), "capability": "ready", "awards_xp": False}


@app.post("/tutor/hint")
def tutor_hint(
    body: TutorBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    attempt = db.get(Attempt, body.attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(404, "attempt_missing")
    level = min(3, attempt.hint_level + 1)
    attempt.hint_level = level
    if level >= 2:
        spend_heart(db, user)
    version = db.get(LessonVersion, attempt.lesson_version_id)
    exercise = next((e for e in version.exercises if e["id"] == body.exercise_id), {})
    accepted = (exercise.get("accepted") or [""])[0]
    hints = {
        1: "Look at the shoresh and the final letter.",
        2: f"It starts with {accepted[:1]}…" if accepted else "Check the article ה־.",
        3: f"Pattern length is {len(accepted)} letters." if accepted else "Compare with the example in the lesson.",
    }
    db.commit()
    return {"level": level, "hint": hints[level], "xp_multiplier": [1, 0.7, 0.4, 0.2][level], "awards_xp": False}


@app.get("/placement")
def placement_items() -> dict[str, Any]:
    return {
        "skippable": True,
        "items": [
            {"id": "p1", "prompt": {"en": "Type hello", "ru": "Наберите привет"}, "level": "starter"},
            {"id": "p2", "prompt": {"en": "Type the book (definite)", "ru": "Наберите «книга» с артиклем"}, "level": "beginner"},
            {"id": "p3", "prompt": {"en": "Type he writes", "ru": "Наберите «он пишет»"}, "level": "beginner"},
        ],
    }


@app.post("/placement")
def placement_submit(body: PlacementAnswer, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    key = {"p1": ["שלום"], "p2": ["הספר"], "p3": ["כותב"]}
    score = 0
    for pid, accepted in key.items():
        from biti.grading import grade_text

        if grade_text(body.answers.get(pid, ""), accepted).result == "correct":
            score += 1
    level = "starter" if score <= 1 else "beginner"
    user.level = level
    db.commit()
    return {"score": score, "level": level, "skipped": False}


@app.get("/editorial/queue")
def editorial_queue(user: User = Depends(require_role("editor", "content_admin", "system_admin")), db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.query(Draft).filter(Draft.status.in_(["in_review", "draft"])).all()
    return [
        {"id": d.id, "kind": d.kind, "status": d.status, "flags": d.flags, "payload": d.payload, "source_id": d.source_id}
        for d in rows
    ]


@app.post("/editorial/{draft_id}")
def editorial_act(
    draft_id: str,
    body: EditorialBody,
    user: User = Depends(require_role("editor", "content_admin", "system_admin")),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    draft = db.get(Draft, draft_id)
    if not draft:
        raise HTTPException(404, "draft_missing")
    if body.action == "publish":
        errs = list(draft.flags or []) + validate_draft_payload({**draft.payload, "flags": draft.flags})
        if any(code in errs for code in ("missing_license", "suspicious", "self_test_failed", "license_needs_review")):
            raise HTTPException(400, {"unpublishable": errs})
        if not body.native_speaker:
            raise HTTPException(400, "native_reviewer_required")
        draft.status = "published"
        db.add(Outbox(topic="content.published", payload={"draft_id": draft.id}))
        learners = db.query(User).filter(User.role == "learner").all()
        for learner in learners:
            db.add(Notification(user_id=learner.id, title="New draft published", body=str(draft.payload.get("lemma") or draft.id)))
    elif body.action == "reject":
        draft.status = "rejected"
    elif body.action == "rollback":
        draft.status = "archived"
    else:
        raise HTTPException(400, "unknown_action")
    db.add(
        EditorialReview(
            draft_id=draft.id,
            reviewer_id=user.id,
            action=body.action,
            comment=body.comment,
            native_speaker=body.native_speaker,
        )
    )
    db.add(AuditLog(actor_id=user.id, action=f"editorial.{body.action}", target=draft.id, detail={"comment": body.comment}))
    db.commit()
    return {"id": draft.id, "status": draft.status}


@app.post("/pipeline/run")
async def pipeline_run(user: User = Depends(require_role("editor", "content_admin", "system_admin")), db: Session = Depends(get_db)) -> dict[str, Any]:
    run = await run_pipeline(db)
    db.add(AuditLog(actor_id=user.id, action="pipeline.run", target=run.id, detail=run.stats or {}))
    db.commit()
    return {"id": run.id, "status": run.status, "stats": run.stats}


@app.get("/notifications")
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    rows = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return [{"id": n.id, "title": n.title, "body": n.body, "read": n.read} for n in rows]


@app.post("/sync/replay")
def sync_replay(events: list[dict[str, Any]], user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Replay offline client events. Server remains authoritative."""
    applied = 0
    skipped = 0
    for ev in events:
        if ev.get("type") != "submit":
            skipped += 1
            continue
        attempt = db.get(Attempt, ev.get("attempt_id"))
        if not attempt or attempt.user_id != user.id:
            skipped += 1
            continue
        try:
            submit(attempt.id, SubmitBody(**ev.get("body") or {}), user, db)
            applied += 1
        except HTTPException:
            skipped += 1
    return {"applied": applied, "skipped": skipped}


@app.get("/openapi-export")
def openapi_export() -> dict[str, Any]:
    return app.openapi()
