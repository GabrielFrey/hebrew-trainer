"""Stage map, checkpoint mix, and unlock helpers.

Stages follow the six ulpan levels in catalog.LEVELS. Checkpoint exercises are
cloned from that stage's published lessons in slug order so the mix is stable
across processes. Speak/listen items are never included. The grader still owns
XP; these helpers never award it.
"""

from __future__ import annotations

import copy
import math
from typing import Any

from biti.catalog import LEVELS

GATE_KINDS = frozenset({"checkpoint", "boss", "legendary"})
PASS_THRESHOLD = 0.8
MIX_SIZE = 8
REVIEW_TYPES = frozenset(
    {"mc", "type_he", "tiles", "match", "match_tap", "order_rtl", "drill", "identify_root", "identify_binyan"}
)
SKIP_TYPES = frozenset({"speak", "listen", "listen_mc", "listen_tap"})

STAGE_ORDER = [row["id"] for row in LEVELS]

CHECKPOINT_SLUGS: dict[str, str] = {
    "starter": "boss-starter",
    "beginner": "boss-beginner",
    "elementary": "checkpoint-elementary",
    "intermediate": "checkpoint-intermediate",
    "upper": "checkpoint-upper",
    "advanced": "checkpoint-advanced",
}

STAGE_TITLES: dict[str, dict[str, str]] = {
    "starter": {
        "en": "Pre-Aleph",
        "ru": "До алефа",
        "he": "טרום-אלף",
        "uk": "До алефа",
        "es": "Pre-Álef",
        "fr": "Pré-Alef",
    },
    "beginner": {
        "en": "Aleph",
        "ru": "Алеф",
        "he": "אלף",
        "uk": "Алеф",
        "es": "Álef",
        "fr": "Alef",
    },
    "elementary": {
        "en": "Bet",
        "ru": "Бет",
        "he": "בית",
        "uk": "Бет",
        "es": "Bet",
        "fr": "Bet",
    },
    "intermediate": {
        "en": "Gimel",
        "ru": "Гимель",
        "he": "גימל",
        "uk": "Ґімель",
        "es": "Guímel",
        "fr": "Guimel",
    },
    "upper": {
        "en": "Dalet",
        "ru": "Далет",
        "he": "דלת",
        "uk": "Далет",
        "es": "Dálet",
        "fr": "Dalet",
    },
    "advanced": {
        "en": "Hey",
        "ru": "Һе",
        "he": "הא",
        "uk": "Һе",
        "es": "He",
        "fr": "Hé",
    },
}

CHECKPOINT_COPY: dict[str, dict[str, Any]] = {
    "starter": {
        "track": "script",
        "cefr": "pre-A1",
        "sort": 40,
        "unit_id": "pre-boss",
        "title": {
            "en": "Starter gate",
            "ru": "Врата старта",
            "he": "שער הטרום-אלף",
            "uk": "Брама старту",
            "es": "Puerta inicial",
            "fr": "Porte de départ",
        },
        "objective": {
            "en": "Mixed review of letters and first words.",
            "ru": "Смешанная проверка букв и первых слов.",
            "he": "חזרה מעורבת על אותיות ומילים ראשונות.",
            "uk": "Змішана перевірка літер і перших слів.",
            "es": "Repaso mixto de letras y primeras palabras.",
            "fr": "Révision mixte des lettres et des premiers mots.",
        },
        "explanation": {
            "en": "Pass at 80% to open Aleph, or use this to test out.",
            "ru": "80% открывают алеф. Можно сдать без всех уроков.",
            "he": "80% פותחים את אלף. אפשר לדלג על שיעורים.",
            "uk": "80% відкривають алеф. Можна скласти без усіх уроків.",
            "es": "Un 80% abre Álef. Puedes examinarte sin cada lección.",
            "fr": "80 % ouvre Alef. Vous pouvez passer sans chaque leçon.",
        },
    },
    "beginner": {
        "track": "grammar",
        "cefr": "A1–A2",
        "sort": 41,
        "unit_id": "aleph-boss",
        "title": {
            "en": "Aleph gate",
            "ru": "Врата алефа",
            "he": "שער האלף",
            "uk": "Брама алефа",
            "es": "Puerta de Álef",
            "fr": "Porte d’Alef",
        },
        "objective": {
            "en": "Mixed review of Aleph vocabulary and grammar.",
            "ru": "Смешанная проверка лексики и грамматики алефа.",
            "he": "חזרה מעורבת על אוצר מילים ודקדוק של אלף.",
            "uk": "Змішана перевірка лексики й граматики алефа.",
            "es": "Repaso mixto de vocabulario y gramática de Álef.",
            "fr": "Révision mixte du vocabulaire et de la grammaire d’Alef.",
        },
        "explanation": {
            "en": "Pass at 80% to open Bet, or use this to test out of Aleph.",
            "ru": "80% открывают бет. Можно сдать алеф досрочно.",
            "he": "80% פותחים את בית. אפשר לדלג על אלף.",
            "uk": "80% відкривають бет. Можна скласти алеф достроково.",
            "es": "Un 80% abre Bet. Puedes examinarte de Álef antes.",
            "fr": "80 % ouvre Bet. Vous pouvez valider Alef plus tôt.",
        },
    },
    "elementary": {
        "track": "grammar",
        "cefr": "A2–B1",
        "sort": 80,
        "unit_id": "bet-boss",
        "title": {
            "en": "Bet gate",
            "ru": "Врата бета",
            "he": "שער הבית",
            "uk": "Брама бет",
            "es": "Puerta de Bet",
            "fr": "Porte de Bet",
        },
        "objective": {
            "en": "Mixed review of Bet vocabulary and grammar.",
            "ru": "Смешанная проверка уровня бет.",
            "he": "חזרה מעורבת לרמת בית.",
            "uk": "Змішана перевірка рівня бет.",
            "es": "Repaso mixto del nivel Bet.",
            "fr": "Révision mixte du niveau Bet.",
        },
        "explanation": {
            "en": "Pass at 80% to open Gimel.",
            "ru": "80% открывают гимель.",
            "he": "80% פותחים את גימל.",
            "uk": "80% відкривають ґімель.",
            "es": "Un 80% abre Guímel.",
            "fr": "80 % ouvre Guimel.",
        },
    },
    "intermediate": {
        "track": "verbs",
        "cefr": "B1–B2",
        "sort": 81,
        "unit_id": "gimel-boss",
        "title": {
            "en": "Gimel gate",
            "ru": "Врата гимеля",
            "he": "שער הגימל",
            "uk": "Брама ґімель",
            "es": "Puerta de Guímel",
            "fr": "Porte de Guimel",
        },
        "objective": {
            "en": "Mixed review of Gimel vocabulary and grammar.",
            "ru": "Смешанная проверка уровня гимель.",
            "he": "חזרה מעורבת לרמת גימל.",
            "uk": "Змішана перевірка рівня ґімель.",
            "es": "Repaso mixto del nivel Guímel.",
            "fr": "Révision mixte du niveau Guimel.",
        },
        "explanation": {
            "en": "Pass at 80% to open Dalet.",
            "ru": "80% открывают далет.",
            "he": "80% פותחים את דלת.",
            "uk": "80% відкривають далет.",
            "es": "Un 80% abre Dálet.",
            "fr": "80 % ouvre Dalet.",
        },
    },
    "upper": {
        "track": "formal",
        "cefr": "B2–C1",
        "sort": 82,
        "unit_id": "dalet-boss",
        "title": {
            "en": "Dalet gate",
            "ru": "Врата далета",
            "he": "שער הדלת",
            "uk": "Брама далет",
            "es": "Puerta de Dálet",
            "fr": "Porte de Dalet",
        },
        "objective": {
            "en": "Mixed review of Dalet vocabulary and grammar.",
            "ru": "Смешанная проверка уровня далет.",
            "he": "חזרה מעורבת לרמת דלת.",
            "uk": "Змішана перевірка рівня далет.",
            "es": "Repaso mixto del nivel Dálet.",
            "fr": "Révision mixte du niveau Dalet.",
        },
        "explanation": {
            "en": "Pass at 80% to open Hey.",
            "ru": "80% открывают һе.",
            "he": "80% פותחים את הא.",
            "uk": "80% відкривають һе.",
            "es": "Un 80% abre He.",
            "fr": "80 % ouvre Hé.",
        },
    },
    "advanced": {
        "track": "slang",
        "cefr": "C1–C2",
        "sort": 83,
        "unit_id": "hey-boss",
        "title": {
            "en": "Hey gate",
            "ru": "Врата һе",
            "he": "שער ההא",
            "uk": "Брама һе",
            "es": "Puerta de He",
            "fr": "Porte de Hé",
        },
        "objective": {
            "en": "Mixed review of Hey vocabulary and grammar.",
            "ru": "Смешанная проверка уровня һе.",
            "he": "חזרה מעורבת לרמת הא.",
            "uk": "Змішана перевірка рівня һе.",
            "es": "Repaso mixto del nivel He.",
            "fr": "Révision mixte du niveau Hé.",
        },
        "explanation": {
            "en": "Pass at 80% to finish the mapped path.",
            "ru": "80% закрывают карту курса.",
            "he": "80% משלימים את המסלול.",
            "uk": "80% завершують мапу курсу.",
            "es": "Un 80% cierra el mapa del curso.",
            "fr": "80 % clôt le parcours cartographié.",
        },
    },
}


def is_gate_kind(kind: str | None) -> bool:
    return (kind or "lesson") in GATE_KINDS


def checkpoint_slug_for(stage_id: str) -> str | None:
    return CHECKPOINT_SLUGS.get(stage_id)


def previous_stage_id(stage_id: str) -> str | None:
    if stage_id not in STAGE_ORDER:
        return None
    idx = STAGE_ORDER.index(stage_id)
    if idx <= 0:
        return None
    return STAGE_ORDER[idx - 1]


def next_stage_id(stage_id: str) -> str | None:
    if stage_id not in STAGE_ORDER:
        return None
    idx = STAGE_ORDER.index(stage_id)
    if idx + 1 >= len(STAGE_ORDER):
        return None
    return STAGE_ORDER[idx + 1]


def stage_passed(slug: str, done: dict[str, Any]) -> bool:
    if slug not in done:
        return False
    return float(done.get(slug) or 0) + 1e-9 >= PASS_THRESHOLD


def stage_open(stage_id: str, done: dict[str, Any]) -> bool:
    prev = previous_stage_id(stage_id)
    if prev is None:
        return True
    gate = CHECKPOINT_SLUGS.get(prev)
    if not gate:
        return False
    return stage_passed(gate, done)


def mistake_limit(n: int, threshold: float = PASS_THRESHOLD) -> int:
    if n <= 0:
        return 0
    need = max(1, math.ceil(n * threshold - 1e-9))
    return max(0, n - need)


def mix_checkpoint_exercises(stage_id: str, specs: list[dict[str, Any]], count: int = MIX_SIZE) -> list[dict[str, Any]]:
    pool: list[tuple[str, str, dict[str, Any]]] = []
    for spec in sorted(specs, key=lambda row: str(row.get("slug") or "")):
        if spec.get("level") != stage_id:
            continue
        if is_gate_kind(spec.get("kind")):
            continue
        for ex in spec.get("exercises") or []:
            if ex.get("optional") or ex.get("type") in SKIP_TYPES:
                continue
            if ex.get("type") not in REVIEW_TYPES:
                continue
            eid = str(ex.get("id") or "")
            if not eid:
                continue
            pool.append((spec["slug"], eid, copy.deepcopy(ex)))
    picked: list[dict[str, Any]] = []
    seen_types: set[str] = set()
    seen_keys: set[tuple[str, str]] = set()

    def take(slug: str, eid: str, ex: dict[str, Any]) -> None:
        item = copy.deepcopy(ex)
        item["id"] = f"cp-{stage_id}-{slug}-{eid}"
        item["source_slug"] = slug
        item["source_id"] = eid
        picked.append(item)
        seen_types.add(str(ex.get("type")))
        seen_keys.add((slug, eid))

    for slug, eid, ex in pool:
        if len(picked) >= count:
            break
        kind = str(ex.get("type"))
        if kind in seen_types:
            continue
        take(slug, eid, ex)
    for slug, eid, ex in pool:
        if len(picked) >= count:
            break
        if (slug, eid) in seen_keys:
            continue
        take(slug, eid, ex)
    return picked[:count]


def checkpoint_lesson_specs(source: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for stage_id, slug in CHECKPOINT_SLUGS.items():
        meta = CHECKPOINT_COPY[stage_id]
        exercises = mix_checkpoint_exercises(stage_id, source, MIX_SIZE)
        if len(exercises) < 5:
            continue
        out.append(
            {
                "slug": slug,
                "track": meta["track"],
                "kind": "checkpoint",
                "level": stage_id,
                "cefr": meta["cefr"],
                "prerequisites": [],
                "sort": meta["sort"],
                "title": dict(meta["title"]),
                "objective": dict(meta["objective"]),
                "explanation": dict(meta["explanation"]),
                "vocabulary": [],
                "exercises": exercises,
                "unit_id": meta.get("unit_id"),
                "skill_id": "legendary",
            }
        )
    return out


def planned_checkpoint_node(stage_id: str) -> dict[str, Any]:
    meta = CHECKPOINT_COPY[stage_id]
    level = next(row for row in LEVELS if row["id"] == stage_id)
    return {
        "slug": CHECKPOINT_SLUGS[stage_id],
        "title": dict(meta["title"]),
        "track": meta["track"],
        "level": stage_id,
        "kind": "checkpoint",
        "status": "planned",
        "prerequisites": [],
        "unlocked": False,
        "completed": False,
        "accuracy": None,
        "unit_id": meta.get("unit_id"),
        "skill_id": "legendary",
        "cefr": level["cefr"],
        "test_out": True,
    }


def pick_current_slug(trail: list[dict[str, Any]]) -> str | None:
    for node in trail:
        if node.get("status") == "planned":
            continue
        if node.get("unlocked") and not node.get("completed"):
            return node.get("slug")
    completed = [n for n in trail if n.get("completed")]
    if completed:
        return completed[-1].get("slug")
    published = [n for n in trail if n.get("status") != "planned"]
    return published[0]["slug"] if published else None


def trail_for_stage(lessons: list[dict[str, Any]], checkpoint: dict[str, Any] | None) -> list[dict[str, Any]]:
    ordered = [n for n in lessons if not is_gate_kind(n.get("kind"))]
    if checkpoint:
        ordered.append(checkpoint)
    return ordered
