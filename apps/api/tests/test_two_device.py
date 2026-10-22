from fastapi.testclient import TestClient

from tests.helpers import complete_lesson, login


def test_two_sessions_same_user_see_same_progress(client: TestClient) -> None:
    email = "two-device@biti.local"
    headers_a = login(client, email=email, display_name="Device A")
    headers_b = login(client, email=email, display_name="Device B")

    me_a = client.get("/auth/me", headers=headers_a).json()
    me_b = client.get("/auth/me", headers=headers_b).json()
    assert me_a["id"] == me_b["id"]

    before = client.get("/progress/me", headers=headers_b).json()
    done = complete_lesson(client, headers_a, "script-alef-he")
    assert done["passed"] is True
    assert done["xp_awarded"] > 0

    path_b = client.get("/curriculum/path", headers=headers_b).json()
    node = next(n for n in path_b["nodes"] if n["slug"] == "script-alef-he")
    assert node["completed"] is True
    assert node["unlocked"] is True

    next_node = next(n for n in path_b["nodes"] if n["slug"] == "script-vav-lamed")
    assert next_node["unlocked"] is True

    prog_a = client.get("/progress/me", headers=headers_a).json()
    prog_b = client.get("/progress/me", headers=headers_b).json()
    assert prog_a["user"]["xp_total"] == prog_b["user"]["xp_total"]
    assert prog_a["completed"]["script-alef-he"] == prog_b["completed"]["script-alef-he"]
    assert prog_a["user"]["xp_total"] >= before["user"]["xp_total"] + done["xp_awarded"]
