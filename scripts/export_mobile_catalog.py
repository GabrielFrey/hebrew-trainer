"""Dump published lessons + placement into the Expo Go offline catalog."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from biti.catalog import LEVELS  # noqa: E402
from biti.checkpoints import CHECKPOINT_SLUGS, STAGE_TITLES, is_gate_kind  # noqa: E402
from biti.seed import _localize_spec, all_lesson_specs  # noqa: E402

OUT = ROOT / "apps" / "mobile" / "content" / "published.json"

PLACEMENT = {
    "skippable": True,
    "items": [
        {"id": "p1", "prompt": {"en": "Type hello", "ru": "Наберите привет", "he": "כתבו שלום", "uk": "Наберіть «привіт»", "es": "Escribe «hola»", "fr": "Tapez « bonjour »"}, "level": "starter"},
        {"id": "p2", "prompt": {"en": "Type the book (definite)", "ru": "Наберите «книга» с артиклем", "he": "כתבו «הספר»", "uk": "Наберіть «книга» з артиклем", "es": "Escribe «el libro» (determinado)", "fr": "Tapez « le livre » (défini)"}, "level": "beginner"},
        {"id": "p3", "prompt": {"en": "Type he writes", "ru": "Наберите «он пишет»", "he": "כתבו «כותב»", "uk": "Наберіть «він пише»", "es": "Escribe «él escribe»", "fr": "Tapez « il écrit »"}, "level": "beginner"},
    ],
    "accepted": {"p1": ["שלום"], "p2": ["הספר"], "p3": ["כותב"]},
}


def main() -> None:
    lessons = []
    for spec in all_lesson_specs():
        row = _localize_spec(spec)
        lessons.append(
            {
                "slug": row["slug"],
                "track": row.get("track") or "script",
                "level": row.get("level") or "starter",
                "cefr": row.get("cefr") or "pre-A1",
                "kind": row.get("kind") or "lesson",
                "prerequisites": list(row.get("prerequisites") or []),
                "title": row["title"],
                "objective": row.get("objective") or {},
                "explanation": row.get("explanation") or {},
                "vocabulary": row.get("vocabulary") or [],
                "exercises": row.get("exercises") or [],
                "threshold": row.get("threshold") or 0.8,
                "sort": row.get("sort") or 0,
                "unit_id": row.get("unit_id"),
                "skill_id": row.get("skill_id"),
                "status": "published",
            }
        )
    payload = {
        "placement": PLACEMENT,
        "lessons": lessons,
        "levels": [{"id": row["id"], "ulpan": row["ulpan"], "cefr": row["cefr"]} for row in LEVELS],
        "stageTitles": STAGE_TITLES,
        "checkpointSlugs": CHECKPOINT_SLUGS,
        "gateKinds": sorted(is_gate_kind.__doc__ and [] or []),
    }
    # Explicit gate kinds — do not rely on docstring.
    payload["gateKinds"] = ["checkpoint", "boss", "legendary"]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(lessons)} lessons)")


if __name__ == "__main__":
    main()
