from fastapi.testclient import TestClient

from biti.seed import all_lesson_specs


def login(
    client: TestClient,
    *,
    role: str = "learner",
    email: str | None = None,
    timezone: str = "Asia/Jerusalem",
    display_name: str = "Test",
) -> dict[str, str]:
    payload = {"ui_language": "en", "display_name": display_name, "role": role, "timezone": timezone}
    if email:
        payload["email"] = email
    r = client.post("/auth/demo", json=payload)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def complete_lesson(client: TestClient, headers: dict[str, str], slug: str = "script-alef-he") -> dict:
    attempt = client.post(f"/lessons/{slug}/start", headers=headers).json()["attempt_id"]
    spec = next(s for s in all_lesson_specs() if s["slug"] == slug)
    for ex in spec["exercises"]:
        if ex.get("optional") or ex.get("type") in {"speak", "listen_mc"}:
            continue
        payload: dict = {"exercise_id": ex["id"], "client_key": f"{attempt}-{ex['id']}"}
        if ex["type"] in {"match", "match_tap"}:
            payload["pairs"] = ex.get("pairs") or (ex.get("pairs_by_lang") or {}).get("en") or {}
        elif ex["type"] in {"order_rtl", "tiles"}:
            payload["value"] = ex["accepted"]
        elif ex["type"] == "mc":
            payload["value"] = ex["accepted"][0]
        else:
            payload["value"] = ex["accepted"][0]
        r = client.post(f"/attempts/{attempt}/submit", headers=headers, json=payload)
        assert r.status_code == 200, r.text
    done = client.post(f"/attempts/{attempt}/complete", headers=headers)
    assert done.status_code == 200, done.text
    return done.json()
