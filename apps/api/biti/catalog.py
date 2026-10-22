"""Full pre-Aleph → Hey course map. Published rows have exercises elsewhere; the rest are planned."""

from __future__ import annotations

from typing import Any

LEVELS: list[dict[str, Any]] = [
    {
        "id": "starter",
        "ulpan": "pre-Aleph",
        "cefr": "pre-A1",
        "lessons_target": 80,
        "vocab_target": 500,
        "audience": "child-level absolute beginner: letters, first words, tiny phrases",
    },
    {
        "id": "beginner",
        "ulpan": "Aleph",
        "cefr": "A1–A2",
        "lessons_target": 180,
        "vocab_target": 1500,
        "audience": "first grammar, present verbs, home/shuk/school talk",
    },
    {
        "id": "elementary",
        "ulpan": "Bet",
        "cefr": "A2–B1",
        "lessons_target": 180,
        "vocab_target": 3000,
        "audience": "past tense, smichut, daily life and services",
    },
    {
        "id": "intermediate",
        "ulpan": "Gimel",
        "cefr": "B1–B2",
        "lessons_target": 150,
        "vocab_target": 6000,
        "audience": "future, binyanim range, news-light, work",
    },
    {
        "id": "upper",
        "ulpan": "Dalet",
        "cefr": "B2–C1",
        "lessons_target": 120,
        "vocab_target": 8000,
        "audience": "formal register, argument, reading short articles",
    },
    {
        "id": "advanced",
        "ulpan": "Hey",
        "cefr": "C1–C2",
        "lessons_target": 100,
        "vocab_target": 10000,
        "audience": "native-level vocabulary, slang, idioms, media, literature extracts (licensed)",
    },
]

# Existing published slugs stay stable for API/E2E. They are slotted into the tree.
PUBLISHED_SLOTS: dict[str, str] = {
    "script-alef-he": "pre-letters-1.alef-he.0",
    "drill-alef-he": "pre-letters-1.alef-he.1",
    "script-vav-lamed": "pre-letters-1.vav-lamed.0",
    "drill-vav-lamed": "pre-letters-1.vav-lamed.1",
    "script-mem-tav": "pre-letters-1.mem-tav.0",
    "drill-mem-tav": "pre-letters-1.mem-tav.1",
    "script-sofiyot": "pre-letters-2.finals.0",
    "script-lookalikes": "pre-letters-2.twins.0",
    "script-dagesh-ktav": "pre-letters-2.dagesh.0",
    "vocab-greetings": "pre-hello.greet.0",
    "tiles-greetings": "pre-hello.greet.1",
    "match-greetings": "pre-hello.greet.2",
    "words-yes-no": "pre-hello.yesno.0",
    "vocab-family": "pre-family.family.0",
    "words-ima-aba": "pre-family.parents.0",
    "vocab-home": "pre-home.rooms.0",
    "vocab-numbers": "pre-count.n1-10.0",
    "vocab-colors": "pre-senses.colors.0",
    "vocab-shuk": "aleph-shuk.food.0",
    "grammar-gender": "aleph-nouns.gender.0",
    "grammar-definite": "aleph-nouns.ha.0",
    "grammar-adjectives": "aleph-nouns.adj.0",
    "grammar-pronouns": "aleph-pronouns.subj.0",
    "roots-shoresh": "aleph-verbs.root.0",
    "verbs-paal-present": "aleph-verbs.paal-now.0",
    "convo-introductions": "aleph-talk.intro.0",
    "convo-shuk": "aleph-talk.shuk.0",
    "convo-transport": "aleph-talk.bus.0",
    "convo-cafe": "aleph-talk.cafe.0",
    "convo-phone": "aleph-talk.phone.0",
    "convo-emergency": "aleph-talk.help.0",
    "boss-starter": "pre-boss.legendary.0",
    "boss-beginner": "aleph-boss.legendary.0",
}

# Unit blueprint: (unit_id, level, track, title_en, title_ru, title_he, skills)
# Each skill: (skill_id, title_en, n_lessons, published_slugs_in_order)
_TREE: list[tuple] = [
    (
        "pre-letters-1",
        "starter",
        "script",
        "The letters live in the house",
        "Буквы живут в доме",
        "האותיות גרות בבית",
        [
            ("alef-he", "Alef to He", 6, ["script-alef-he", "drill-alef-he"]),
            ("vav-lamed", "Vav to Lamed", 6, ["script-vav-lamed", "drill-vav-lamed"]),
            ("mem-tav", "Mem to Tav", 6, ["script-mem-tav", "drill-mem-tav"]),
        ],
    ),
    (
        "pre-letters-2",
        "starter",
        "script",
        "Finals, twins, and dots",
        "Концы, двойники и точки",
        "סופיות, תאומות ונקודות",
        [
            ("finals", "Sofiyot ךםןףץ", 6, ["script-sofiyot"]),
            ("twins", "Lookalikes", 6, ["script-lookalikes"]),
            ("dagesh", "Dagesh and print", 6, ["script-dagesh-ktav"]),
        ],
    ),
    (
        "pre-hello",
        "starter",
        "vocabulary",
        "Hello, yes, thanks",
        "Привет, да, спасибо",
        "שלום, כן, תודה",
        [
            ("greet", "Greetings", 6, ["vocab-greetings", "tiles-greetings", "match-greetings"]),
            ("yesno", "Ken and lo", 5, ["words-yes-no"]),
            ("polite", "Please and sorry", 5, []),
        ],
    ),
    (
        "pre-family",
        "starter",
        "vocabulary",
        "Ima, aba, and me",
        "Мама, папа и я",
        "אמא, אבא ואני",
        [
            ("parents", "Parents", 5, ["words-ima-aba"]),
            ("family", "Close family", 6, ["vocab-family"]),
            ("pets", "Dog and cat", 5, []),
        ],
    ),
    (
        "pre-home",
        "starter",
        "vocabulary",
        "Bayit — the house",
        "Баит — дом",
        "בית",
        [
            ("rooms", "Rooms", 6, ["vocab-home"]),
            ("table", "Table and bread", 5, []),
            ("water", "Water and milk", 5, []),
        ],
    ),
    (
        "pre-count",
        "starter",
        "vocabulary",
        "One to ten",
        "От одного до десяти",
        "אחת עד עשר",
        [
            ("n1-10", "Count 1–10", 6, ["vocab-numbers"]),
            ("how-many", "How many?", 5, []),
        ],
    ),
    (
        "pre-senses",
        "starter",
        "vocabulary",
        "Colors and seeing",
        "Цвета и зрение",
        "צבעים וראייה",
        [
            ("colors", "Basic colors", 6, ["vocab-colors"]),
            ("big-small", "Big and small", 5, []),
        ],
    ),
    (
        "pre-phrases",
        "starter",
        "conversation",
        "Tiny sentences",
        "Крошечные фразы",
        "משפטים קטנים",
        [
            ("my-name", "My name is", 6, []),
            ("i-want", "I want", 5, []),
            ("where-is", "Where is…?", 5, []),
        ],
    ),
    (
        "pre-sound",
        "starter",
        "pronunciation",
        "How the house sounds",
        "Как звучит дом",
        "איך הבית נשמע",
        [
            ("gutturals", "Alef and ayin", 5, []),
            ("stress", "Milra first listen", 5, []),
        ],
    ),
    (
        "pre-boss",
        "starter",
        "script",
        "Legendary: the first key",
        "Легенда: первый ключ",
        "אגדה: המפתח הראשון",
        [("legendary", "Starter legendary", 2, ["boss-starter"])],
    ),
    (
        "aleph-nouns",
        "beginner",
        "grammar",
        "Gender, the, and adjectives",
        "Род, артикль и прилагательные",
        "מין, ה והתואר",
        [
            ("gender", "Masculine and feminine", 8, ["grammar-gender"]),
            ("ha", "The prefix ה־", 8, ["grammar-definite"]),
            ("adj", "Adjective agreement", 8, ["grammar-adjectives"]),
        ],
    ),
    (
        "aleph-pronouns",
        "beginner",
        "grammar",
        "I, you, we",
        "Я, ты, мы",
        "אני, אתה, אנחנו",
        [
            ("subj", "Subject pronouns", 8, ["grammar-pronouns"]),
            ("possess", "My / your", 8, []),
        ],
    ),
    (
        "aleph-verbs",
        "beginner",
        "verbs",
        "Roots start walking",
        "Корни начинают ходить",
        "שרשים יוצאים לדרך",
        [
            ("root", "Three-letter shoresh", 8, ["roots-shoresh"]),
            ("paal-now", "Pa'al present", 10, ["verbs-paal-present"]),
            ("want-go", "Want and go", 8, []),
        ],
    ),
    (
        "aleph-shuk",
        "beginner",
        "vocabulary",
        "At the shuk",
        "На рынке",
        "בשוק",
        [
            ("food", "Fruit and veg", 8, ["vocab-shuk"]),
            ("price", "How much is it?", 8, []),
        ],
    ),
    (
        "aleph-talk",
        "beginner",
        "conversation",
        "First conversations",
        "Первые разговоры",
        "שיחות ראשונות",
        [
            ("intro", "Introductions", 8, ["convo-introductions"]),
            ("shuk", "Buying fruit", 6, ["convo-shuk"]),
            ("bus", "Bus and train", 6, ["convo-transport"]),
            ("cafe", "Café order", 6, ["convo-cafe"]),
            ("phone", "On the phone", 6, ["convo-phone"]),
            ("help", "Need help", 6, ["convo-emergency"]),
        ],
    ),
    (
        "aleph-school",
        "beginner",
        "vocabulary",
        "School bag",
        "Школьный портфель",
        "תיק לבית הספר",
        [("tools", "Pen, notebook, bag", 8, []), ("class", "In class", 8, [])],
    ),
    (
        "aleph-time",
        "beginner",
        "vocabulary",
        "Clock and week",
        "Часы и неделя",
        "שעון ושבוע",
        [("days", "Days of the week", 8, []), ("clock", "What time?", 8, [])],
    ),
    (
        "aleph-body",
        "beginner",
        "vocabulary",
        "Body and feeling",
        "Тело и самочувствие",
        "גוף והרגשה",
        [("body", "Head to toe", 8, []), ("feel", "I'm tired / hungry", 8, [])],
    ),
    (
        "aleph-boss",
        "beginner",
        "grammar",
        "Legendary: Aleph key",
        "Легенда: ключ алеф",
        "אגדה: מפתח אלף",
        [("legendary", "Aleph legendary", 2, ["boss-beginner"])],
    ),
]

_BET = [
    ("past-paal", "Yesterday I wrote", "past tense pa'al", 20),
    ("smichut", "Construct state", "smichut pairs", 16),
    ("prepositions", "To, from, with", "preposition suffixes", 16),
    ("numbers-100", "Up to a hundred", "cardinals and shekels", 16),
    ("kupat-holim", "Clinic", "appointments and forms", 16),
    ("rent", "Finding a flat", "rooms, lease words", 16),
    ("work-start", "First job words", "office and shift", 16),
    ("questions", "Which, when, why", "question words", 14),
    ("binyan-nifal", "Nif'al peek", "passive-ish present", 16),
    ("listening-street", "Street announcements", "optional audio", 14),
    ("bet-boss", "Legendary: Bet key", "checkpoint", 2),
]

_GIMEL = [
    ("future", "Tomorrow we will", "future tense", 20),
    ("piel-hifil", "Piel and hif'il", "binyan contrast", 20),
    ("gzarot", "Weak roots", "pe-yod, lamed-he", 20),
    ("news-light", "Simple news items", "licensed headlines", 18),
    ("bank", "Bank and bills", "accounts", 16),
    ("misrad", "Misrad HaPnim", "documents", 16),
    ("argument", "I think that", "opinion frames", 16),
    ("relative", "That and which", "relative clauses", 16),
    ("gimel-boss", "Legendary: Gimel key", "checkpoint", 2),
]

_DALET = [
    ("formal", "Official letters", "register shift", 22),
    ("media", "Radio and podcasts", "listening planned", 20),
    ("debate", "Disagree politely", "connectors", 20),
    ("literature-pd", "Public-domain lines", "Ben-Yehuda extracts", 20),
    ("academic", "Lecture notes", "abstract nouns", 18),
    ("dalet-boss", "Legendary: Dalet key", "checkpoint", 2),
]

_HEY = [
    ("slang", "Street Hebrew", "slang and SMS", 22),
    ("idioms", "Idioms that Israelis use", "not word-for-word", 22),
    ("media-native", "Native media clips", "licensed only", 18),
    ("poetry-pd", "Licensed verse", "reading", 16),
    ("irony", "Irony and understatement", "pragmatics", 16),
    ("hey-boss", "Legendary: Hey key", "native checkpoint", 2),
]


def _loc(en: str, ru: str, he: str = "") -> dict[str, str]:
    from biti.draft_l10n import fill_loc

    return fill_loc({"en": en, "ru": ru, "he": he})


def _planned_slug(unit_id: str, skill_id: str, index: int) -> str:
    return f"{unit_id}-{skill_id}-{index + 1:02d}"


def _fill_higher(level_id: str, track: str, rows: list[tuple], start_sort: int) -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    sort = start_sort
    for uid, title_en, theme, n in rows:
        unit_id = f"{level_id}-{uid}"
        is_boss = "boss" in uid or title_en.startswith("Legendary")
        skill_id = "legendary" if is_boss else uid
        lessons = []
        for i in range(n):
            kind = "checkpoint" if is_boss else "lesson"
            slug = _planned_slug(unit_id, skill_id, i)
            lessons.append(
                {
                    "slug": slug,
                    "status": "planned",
                    "kind": kind,
                    "title": _loc(f"{title_en} · {i + 1}", f"{title_en} · {i + 1}", title_en),
                    "objective": _loc(
                        f"Planned: {theme} (lesson {i + 1}/{n}).",
                        f"Запланировано: {theme} (урок {i + 1}/{n}).",
                        theme,
                    ),
                    "track": track,
                    "level": {"bet": "elementary", "gimel": "intermediate", "dalet": "upper", "hey": "advanced"}.get(
                        level_id, level_id
                    ),
                    "unit_id": unit_id,
                    "skill_id": skill_id,
                    "sort": sort,
                    "prerequisites": [],
                }
            )
            sort += 1
        units.append(
            {
                "id": unit_id,
                "level": "elementary"
                if level_id == "bet"
                else "intermediate"
                if level_id == "gimel"
                else "upper"
                if level_id == "dalet"
                else "advanced"
                if level_id == "hey"
                else level_id,
                "track": track,
                "title": _loc(title_en, title_en, title_en),
                "skills": [{"id": skill_id, "title": _loc(title_en, title_en, title_en), "lesson_slugs": [x["slug"] for x in lessons]}],
                "lessons": lessons,
            }
        )
    return units


def build_tree() -> list[dict[str, Any]]:
    units: list[dict[str, Any]] = []
    sort = 1
    for unit_id, level, track, en, ru, he, skills in _TREE:
        unit_lessons: list[dict[str, Any]] = []
        skill_rows = []
        prev_slug: str | None = None
        for skill_id, skill_en, n, published in skills:
            slugs: list[str] = []
            pub_i = 0
            for i in range(n):
                if pub_i < len(published):
                    slug = published[pub_i]
                    pub_i += 1
                    status = "published"
                    kind = "checkpoint" if slug.startswith("boss-") or slug.startswith("checkpoint-") else "lesson"
                    title = _loc(skill_en, skill_en, skill_en)
                else:
                    slug = _planned_slug(unit_id, skill_id, i)
                    status = "planned"
                    kind = "checkpoint" if skill_id == "legendary" else "lesson"
                    title = _loc(f"{skill_en} · {i + 1}", f"{skill_en} · {i + 1}", skill_en)
                spec = {
                    "slug": slug,
                    "status": status,
                    "kind": kind,
                    "title": title,
                    "objective": _loc(f"{skill_en} step {i + 1}", f"{skill_en} шаг {i + 1}", skill_en),
                    "track": track,
                    "level": level,
                    "unit_id": unit_id,
                    "skill_id": skill_id,
                    "sort": sort,
                    "prerequisites": [prev_slug] if prev_slug else [],
                }
                unit_lessons.append(spec)
                slugs.append(slug)
                prev_slug = slug
                sort += 1
            skill_rows.append({"id": skill_id, "title": _loc(skill_en, skill_en, skill_en), "lesson_slugs": slugs})
        units.append(
            {
                "id": unit_id,
                "level": level,
                "track": track,
                "title": _loc(en, ru, he),
                "skills": skill_rows,
                "lessons": unit_lessons,
            }
        )
    units.extend(_fill_higher("bet", "grammar", _BET, sort))
    sort += sum(r[3] for r in _BET)
    units.extend(_fill_higher("gimel", "verbs", _GIMEL, sort))
    sort += sum(r[3] for r in _GIMEL)
    units.extend(_fill_higher("dalet", "formal", _DALET, sort))
    sort += sum(r[3] for r in _DALET)
    units.extend(_fill_higher("hey", "slang", _HEY, sort))
    return units


def all_catalog_lessons() -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for unit in build_tree():
        out.extend(unit["lessons"])
    return out


def catalog_stats() -> dict[str, Any]:
    lessons = all_catalog_lessons()
    by_level: dict[str, dict[str, int]] = {}
    for row in lessons:
        bucket = by_level.setdefault(row["level"], {"published": 0, "planned": 0, "total": 0})
        bucket[row["status"]] = bucket.get(row["status"], 0) + 1
        bucket["total"] += 1
    return {
        "levels": LEVELS,
        "lessons": len(lessons),
        "published": sum(1 for r in lessons if r["status"] == "published"),
        "planned": sum(1 for r in lessons if r["status"] == "planned"),
        "by_level": by_level,
        "courses": 5,
    }
