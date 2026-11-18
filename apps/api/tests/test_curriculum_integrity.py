"""The bundled curriculum must stay complete, unique and bilingual."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = json.loads((ROOT / "apps/mobile/content/curriculum.json").read_text(encoding="utf-8"))
HEB = re.compile(r"[\u05d0-\u05ea]")
BANNED = ["חרא", "חרטא", "מניאק", "נדפק", "לעזאזל", "מבסס", "תזרים", "חפור"]


def test_stages_cover_dalet_through_vav_and_the_side_tracks():
    stages = DATA["stages"]
    assert [stage["id"] for stage in stages] == ["slang", "upper", "idioms", "advanced", "literary", "fluent"]
    slugs = []
    for stage in stages:
        assert stage["lessons"], stage["id"]
        assert stage["gate"]["slug"]
        slugs.append(stage["gate"]["slug"])
        for lesson in stage["lessons"]:
            assert lesson["items"], lesson["slug"]
            slugs.append(lesson["slug"])
    assert len(slugs) == len(set(slugs))
    assert sum(len(stage["lessons"]) for stage in stages) == 302


def test_every_item_is_used_once_and_has_hebrew_russian_and_english():
    used = [item_id for stage in DATA["stages"] for lesson in stage["lessons"] for item_id in lesson["items"]]
    items = DATA["items"]
    assert len(used) == len(set(used))
    assert set(used) == set(items)
    counts = {"w": 0, "s": 0, "i": 0, "d": 0, "v": 0}
    for item_id, item in items.items():
        counts[item["t"]] += 1
        if item["t"] == "d":
            rows = [*item["lines"], *item["replies"]]
            assert rows and all(HEB.search(row["p"]) and row["en"] and row["ru"] for row in rows), item_id
            assert sum(1 for row in item["replies"] if row.get("ok")) == 1, item_id
        else:
            assert HEB.search(item["he"]) and HEB.search(item["p"]) and item["en"] and item["ru"], item_id
        if item["t"] == "v":
            for lang in ("uk", "es", "fr"):
                assert item[lang] and item[lang] != item["en"], f"{item_id} {lang}"
            for lang in ("he", "en", "ru", "uk", "es", "fr"):
                assert item["src"][lang], f"{item_id} source {lang}"
        elif re.search(r"#f\d+-", item["src"]) or item["t"] in {"s", "d"}:
            assert item.get("review") == 1, item_id
    assert counts == {"w": 1512, "s": 347, "i": 47, "d": 124, "v": 31}


def test_excluded_slang_never_ships():
    hebrew = {item["he"] for item in DATA["items"].values() if item["t"] != "d"}
    for word in BANNED:
        assert word not in hebrew
