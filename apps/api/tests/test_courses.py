from fastapi.testclient import TestClient

from biti.catalog import catalog_stats
from biti.courses import COURSES, L10N_STATUS
from biti.seed import all_lesson_specs
from tests.helpers import login


def test_five_courses_and_l10n_flags(client: TestClient) -> None:
    meta = client.get("/meta").json()
    ids = {c["id"] for c in meta["courses"]}
    assert ids == {"he-ru", "he-uk", "he-en", "he-es", "he-fr"}
    assert meta["l10n_status"]["uk"] == "in_review"
    assert meta["l10n_status"]["es"] == "in_review"
    assert meta["l10n_status"]["fr"] == "in_review"
    assert meta["l10n_status"]["en"] == "approved"
    assert L10N_STATUS["ru"] == "approved"


def test_progress_is_per_course(client: TestClient) -> None:
    from tests.helpers import complete_lesson

    email = "course-split@biti.local"
    ru = login(client, email=email, display_name="RU")
    client.patch("/auth/me", headers=ru, json={"course_id": "he-ru"})
    complete_lesson(client, ru, "script-alef-he")
    client.patch("/auth/me", headers=ru, json={"course_id": "he-en"})
    path_en = client.get("/curriculum/path", headers=ru).json()
    node = next(n for n in path_en["nodes"] if n["slug"] == "script-alef-he")
    assert node["completed"] is False
    client.patch("/auth/me", headers=ru, json={"course_id": "he-ru"})
    path_ru = client.get("/curriculum/path", headers=ru).json()
    node_ru = next(n for n in path_ru["nodes"] if n["slug"] == "script-alef-he")
    assert node_ru["completed"] is True


def test_catalog_has_hundreds_of_mapped_lessons() -> None:
    stats = catalog_stats()
    assert stats["lessons"] >= 500
    assert stats["planned"] > stats["published"]
    assert len(all_lesson_specs()) >= 30
    assert len(COURSES) == 5


def test_uk_prompt_present_on_extra_lesson(client: TestClient) -> None:
    headers = login(client, email="uk-course@biti.local")
    client.patch("/auth/me", headers=headers, json={"course_id": "he-uk", "ui_language": "uk"})
    lesson = client.get("/lessons/drill-alef-he", headers=headers).json()
    assert "accepted" not in str(lesson)
    assert lesson["title"].get("uk")
    assert lesson["editorial"]["l10n_status"]["uk"] == "in_review"
