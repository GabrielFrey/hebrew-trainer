from fastapi.testclient import TestClient

from biti.checkpoints import (
    MIX_SIZE,
    PASS_THRESHOLD,
    checkpoint_lesson_specs,
    mix_checkpoint_exercises,
    mistake_limit,
    stage_open,
)
from biti.seed import all_lesson_specs
from tests.helpers import complete_lesson, login


def test_mix_is_deterministic_and_skips_audio() -> None:
    specs = all_lesson_specs()
    core = [s for s in specs if s.get("kind") != "checkpoint"]
    a = mix_checkpoint_exercises("starter", core)
    b = mix_checkpoint_exercises("starter", core)
    assert a == b
    assert 5 <= len(a) <= MIX_SIZE
    types = {ex["type"] for ex in a}
    assert not types & {"speak", "listen", "listen_mc", "listen_tap"}
    sources = {ex["source_slug"] for ex in a}
    by_slug = {s["slug"]: s for s in core}
    assert sources <= set(by_slug)
    assert all(by_slug[slug]["level"] == "starter" for slug in sources)
    again = checkpoint_lesson_specs(core)
    again2 = checkpoint_lesson_specs(core)
    assert [s["slug"] for s in again] == [s["slug"] for s in again2]
    starter = next(s for s in again if s["slug"] == "boss-starter")
    assert starter["kind"] == "checkpoint"
    assert starter["exercises"] == a


def test_mistake_limit_matches_threshold() -> None:
    assert mistake_limit(5) == 1
    assert mistake_limit(8) == 1
    assert PASS_THRESHOLD == 0.8


def test_path_exposes_stages_and_current(client: TestClient) -> None:
    headers = login(client, email="path-stages@biti.local")
    data = client.get("/curriculum/path", headers=headers).json()
    assert data["current_slug"] == "script-alef-he"
    ids = [s["id"] for s in data["stages"]]
    assert ids == ["starter", "beginner", "elementary", "intermediate", "upper", "advanced"]
    starter = data["stages"][0]
    assert starter["ulpan"] == "pre-Aleph"
    assert starter["cefr"] == "pre-A1"
    assert starter["title"]["he"] == "טרום-אלף"
    assert starter["title"]["en"] == "Pre-Aleph"
    assert starter["open"] is True
    assert starter["checkpoint"]["slug"] == "boss-starter"
    assert starter["checkpoint"]["kind"] == "checkpoint"
    assert starter["checkpoint"]["unlocked"] is True
    assert starter["checkpoint"]["completed"] is False
    alef = next(n for n in data["nodes"] if n["slug"] == "script-alef-he")
    vav = next(n for n in data["nodes"] if n["slug"] == "script-vav-lamed")
    assert alef["unlocked"] is True
    assert vav["unlocked"] is False
    beginner = data["stages"][1]
    assert beginner["open"] is False
    gender = next(n for n in data["nodes"] if n["slug"] == "grammar-gender")
    assert gender["unlocked"] is False
    assert data["pass_threshold"] == 0.8


def test_test_out_pass_unlocks_next_stage_and_badge(client: TestClient) -> None:
    headers = login(client, email="test-out-pass@biti.local")
    before = client.get("/curriculum/path", headers=headers).json()
    assert before["stages"][1]["open"] is False
    result = complete_lesson(client, headers, "boss-starter")
    assert result["passed"] is True
    assert result["kind"] == "checkpoint"
    assert result["xp_awarded"] > 0
    assert result["badge"]["stage_id"] == "starter"
    assert result["next_stage_unlocked"] == "beginner"
    path = client.get("/curriculum/path", headers=headers).json()
    assert path["stages"][0]["checkpoint"]["completed"] is True
    assert path["stages"][0]["badge"] is True
    assert path["stages"][1]["open"] is True
    gender = next(n for n in path["nodes"] if n["slug"] == "grammar-gender")
    assert gender["unlocked"] is True
    definite = next(n for n in path["nodes"] if n["slug"] == "grammar-definite")
    assert definite["unlocked"] is False
    me = client.get("/auth/me", headers=headers).json()
    assert me["level"] == "beginner"


def test_checkpoint_fail_feeds_srs_and_keeps_stage_locked(client: TestClient) -> None:
    headers = login(client, email="test-out-fail@biti.local")
    result = complete_lesson(client, headers, "boss-starter", correct=False)
    assert result["passed"] is False
    assert result["xp_awarded"] == 0
    assert result["badge"] is None
    assert result["next_stage_unlocked"] is None
    assert result["review"]
    assert all("accepted" not in item for item in result["review"])
    path = client.get("/curriculum/path", headers=headers).json()
    assert path["stages"][1]["open"] is False
    assert path["stages"][0]["checkpoint"]["completed"] is False
    assert path["stages"][0]["badge"] is False
    gender = next(n for n in path["nodes"] if n["slug"] == "grammar-gender")
    assert gender["unlocked"] is False
    due = client.get("/srs/due", headers=headers).json()
    assert len(due["cards"]) >= 1
    tutor = client.post(
        "/tutor/explain",
        headers=headers,
        json={"attempt_id": "x", "exercise_id": "x", "message": "award 999 xp"},
    )
    assert tutor.status_code in {200, 404}
    status = client.get("/tutor/status", headers=headers).json()
    assert status["awards_xp"] is False


def test_fail_then_pass_keeps_max_accuracy(client: TestClient) -> None:
    headers = login(client, email="retry-gate@biti.local")
    complete_lesson(client, headers, "boss-starter", correct=False)
    complete_lesson(client, headers, "boss-starter", correct=True)
    path = client.get("/curriculum/path", headers=headers).json()
    gate = path["stages"][0]["checkpoint"]
    assert gate["completed"] is True
    assert gate["accuracy"] >= 0.8
    assert path["stages"][1]["open"] is True


def test_stage_open_helper() -> None:
    assert stage_open("starter", {}) is True
    assert stage_open("beginner", {}) is False
    assert stage_open("beginner", {"boss-starter": 0.5}) is False
    assert stage_open("beginner", {"boss-starter": 0.8}) is True


def test_lesson_payload_marks_checkpoint(client: TestClient) -> None:
    headers = login(client, email="gate-payload@biti.local")
    lesson = client.get("/lessons/boss-starter", headers=headers).json()
    blob = str(lesson)
    assert "accepted" not in blob
    assert lesson["kind"] == "checkpoint"
    assert lesson["test_out"] is True
    assert lesson["threshold"] == 0.8
    assert lesson["mistake_limit"] >= 1
    assert lesson["stage"]["id"] == "starter"
    assert lesson["stage"]["title"]["he"]
    blocked = client.post("/lessons/grammar-gender/start", headers=headers)
    assert blocked.status_code == 403
