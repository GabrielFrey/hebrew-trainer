"""Onboarding → placement → first lesson using the bundled catalog, with the API offline."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from biti.grading import grade_exercise, grade_text

CATALOG = json.loads((ROOT / "apps/mobile/content/published.json").read_text(encoding="utf-8"))
PASS = 0.8
GATE = set(CATALOG["gateKinds"])


def _lesson(slug: str) -> dict:
    return next(row for row in CATALOG["lessons"] if row["slug"] == slug)


def _stage_open(stage_id: str, done: dict[str, float]) -> bool:
    ids = [row["id"] for row in CATALOG["levels"]]
    idx = ids.index(stage_id)
    if idx <= 0:
        return True
    gate = CATALOG["checkpointSlugs"][ids[idx - 1]]
    return float(done.get(gate) or 0) + 1e-9 >= PASS


def _unlocked(slug: str, done: dict[str, float]) -> bool:
    spec = _lesson(slug)
    if not _stage_open(spec["level"], done):
        return False
    if spec.get("kind") in GATE:
        return True
    for prereq in spec.get("prerequisites") or []:
        if prereq in done:
            continue
        return False
    return True


def test_bundle_has_placement_and_first_lesson() -> None:
    assert [item["id"] for item in CATALOG["placement"]["items"]] == ["p1", "p2", "p3"]
    first = CATALOG["lessons"][0]
    assert first["slug"] == "script-alef-he"
    assert first["kind"] == "lesson"
    assert first["exercises"], "first lesson must ship exercises"
    assert first["exercises"][0].get("accepted"), "offline grading needs accepted answers"


def test_offline_onboarding_english_default_name() -> None:
    en = (ROOT / "packages/i18n/src/en.ts").read_text(encoding="utf-8")
    assert "Welcome to Biti Hebrew" in en
    assert 'name: "Biti Hebrew"' in en
    app = json.loads((ROOT / "apps/mobile/app.json").read_text(encoding="utf-8"))
    assert app["expo"]["name"] == "Biti Hebrew"


def test_offline_onboarding_placement_first_lesson_without_api() -> None:
    """Walk the Expo Go offline path. Does not start FastAPI."""
    session = {
        "user": {"ui_language": "en", "course_id": "he-en", "level": "starter", "xp_total": 0, "hearts": 5},
        "done": {},
    }

    # Placement (short test) grades on device.
    answers = {"p1": "שלום", "p2": "הספר", "p3": "כותב"}
    score = 0
    for pid, accepted in CATALOG["placement"]["accepted"].items():
        if grade_text(answers[pid], accepted).result == "correct":
            score += 1
    assert score == 3
    session["user"]["level"] = "beginner" if score > 1 else "starter"
    assert session["user"]["level"] == "beginner"

    # Path still starts at the first published starter lesson.
    first = next(row for row in CATALOG["lessons"] if _unlocked(row["slug"], session["done"]))
    assert first["slug"] == "script-alef-he"

    # First lesson: start + grade the first exercise locally.
    exercise = first["exercises"][0]
    payload = {"value": (exercise.get("accepted") or [""])[0]}
    grade = grade_exercise(exercise, payload, source_lang="en")
    assert grade.result == "correct"
    assert "exact" in " ".join(grade.rule_ids) or grade.rule_ids == ["choice_exact"]


def test_offline_wrong_placement_answer_stays_starter() -> None:
    score = 0
    for pid, accepted in CATALOG["placement"]["accepted"].items():
        if grade_text("", accepted).result == "correct":
            score += 1
    assert score == 0
    assert ("starter" if score <= 1 else "beginner") == "starter"


def test_requires_python_excludes_3_15() -> None:
    text = (ROOT / "apps/api/pyproject.toml").read_text(encoding="utf-8")
    assert ">=3.12,<3.15" in text
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "Python 3.12 or 3.13" in readme
    assert "3.15" in readme
