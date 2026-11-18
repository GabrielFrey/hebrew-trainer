#!/usr/bin/env python3
"""Build apps/mobile/content/curriculum.json: the stages after Gimel plus the slang,
idiom and literary sections.

Sources (read-only):
  legacy/ivrit-s-nulya/data/lexicon/{words,slang,dialogues}-*.json   legacy app data
  content/literary/tanakh.json                                       public-domain verses
  apps/mobile/content/published.json                                 existing stages (to avoid repeats)

The legacy lexicon mixes a hand-checked layer (ids without an `f####-` prefix) with
machine-derived entries. Machine-derived entries pass a strict filter and every one
that survives is flagged `review` (needsNativeReview). Nothing here writes Hebrew of its
own: the only edits to Hebrew are the explicit, listed corrections in FIXES.

Outputs:
  apps/mobile/content/curriculum.json      compact data, expanded into lessons by lib/curriculum.ts
  content/review/curriculum-review.json    every flagged entry with its reasons
  content/review/curriculum-dropped.json   every dropped entry with the reason
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "legacy" / "ivrit-s-nulya" / "data" / "lexicon"
PUBLISHED = ROOT / "apps" / "mobile" / "content" / "published.json"
LITERARY = ROOT / "content" / "literary" / "tanakh.json"
OUT = ROOT / "apps" / "mobile" / "content" / "curriculum.json"
REVIEW = ROOT / "content" / "review" / "curriculum-review.json"
DROPPED = ROOT / "content" / "review" / "curriculum-dropped.json"

LEGACY_LEVELS = ["elementary", "basic", "intermediate", "advanced", "expert"]
STAGE_OF = {"elementary": "upper", "basic": "upper", "intermediate": "advanced", "advanced": "fluent", "expert": "fluent"}
SLUG_PREFIX = {"upper": "dalet", "advanced": "hey", "fluent": "vav"}
LESSON_MIN, LESSON_SIZE = 5, 8
LANGS = ["en", "ru", "uk", "es", "fr"]

# ---------------------------------------------------------------- stages

STAGES = [
    {
        "id": "slang", "section": True, "opensAfter": "intermediate", "ulpan": "Slang", "cefr": "B1+",
        "title": {"en": "Street Hebrew", "ru": "Уличный иврит", "he": "סלנג", "uk": "Вуличний іврит", "es": "Hebreo de la calle", "fr": "Hébreu de la rue"},
        "gate": {"en": "Slang test", "ru": "Проверка: сленг", "uk": "Перевірка: сленг", "es": "Prueba: jerga", "fr": "Test : argot"},
    },
    {
        "id": "upper", "opensAfter": "intermediate", "ulpan": "Dalet", "cefr": "B2–C1",
        "gate": {"en": "Dalet gate", "ru": "Врата далета", "uk": "Брама далету", "es": "Puerta de Dálet", "fr": "Porte de Dalet"},
    },
    {
        "id": "idioms", "section": True, "opensAfter": "upper", "ulpan": "Idioms", "cefr": "B2+",
        "title": {"en": "Idioms", "ru": "Идиомы", "he": "ניבים", "uk": "Ідіоми", "es": "Modismos", "fr": "Expressions idiomatiques"},
        "gate": {"en": "Idioms test", "ru": "Проверка: идиомы", "uk": "Перевірка: ідіоми", "es": "Prueba: modismos", "fr": "Test : expressions"},
    },
    {
        "id": "advanced", "opensAfter": "upper", "ulpan": "Hey", "cefr": "C1–C2",
        "gate": {"en": "Hey gate", "ru": "Врата Һе", "uk": "Брама Һе", "es": "Puerta de He", "fr": "Porte de Hé"},
    },
    {
        "id": "literary", "section": True, "opensAfter": "advanced", "ulpan": "Tanakh", "cefr": "C1+",
        "title": {"en": "Literary Hebrew: Tanakh", "ru": "Литературный иврит: Танах", "he": "לשון המקרא", "uk": "Літературний іврит: Танах", "es": "Hebreo literario: Tanaj", "fr": "Hébreu littéraire : Tanakh"},
        "gate": {"en": "Tanakh test", "ru": "Проверка: Танах", "uk": "Перевірка: Танах", "es": "Prueba: Tanaj", "fr": "Test : Tanakh"},
    },
    {
        "id": "fluent", "opensAfter": "advanced", "ulpan": "Vav", "cefr": "C2", "gateKind": "legendary",
        "title": {"en": "Vav", "ru": "Вав", "he": "וו", "uk": "Вав", "es": "Vav", "fr": "Vav"},
        "gate": {"en": "Vav gate", "ru": "Врата вава", "uk": "Брама вав", "es": "Puerta de Vav", "fr": "Porte de Vav"},
    },
]
GATE_TEXT = {
    "en": "Mixed review of this stage. 80% passes; you can take it early.",
    "ru": "Смешанная проверка этапа. Нужно 80%, можно сдать досрочно.",
    "uk": "Змішана перевірка етапу. Потрібно 80%, можна скласти достроково.",
    "es": "Repaso mixto de esta etapa. Se aprueba con un 80 %; puedes examinarte antes.",
    "fr": "Révision mixte de cette étape. 80 % pour réussir ; vous pouvez la passer plus tôt.",
}

THEMES = {
    "greetings": {"en": "Greetings", "ru": "Приветствия", "uk": "Привітання", "es": "Saludos", "fr": "Salutations"},
    "people": {"en": "People", "ru": "Люди", "uk": "Люди", "es": "Personas", "fr": "Les gens"},
    "family": {"en": "Family", "ru": "Семья", "uk": "Родина", "es": "Familia", "fr": "Famille"},
    "numbers": {"en": "Numbers", "ru": "Числа", "uk": "Числа", "es": "Números", "fr": "Nombres"},
    "time": {"en": "Time", "ru": "Время", "uk": "Час", "es": "Tiempo", "fr": "Le temps"},
    "food": {"en": "Food", "ru": "Еда", "uk": "Їжа", "es": "Comida", "fr": "Nourriture"},
    "home": {"en": "Home", "ru": "Дом", "uk": "Дім", "es": "Casa", "fr": "Maison"},
    "city": {"en": "City", "ru": "Город", "uk": "Місто", "es": "Ciudad", "fr": "Ville"},
    "travel": {"en": "Travel", "ru": "Поездки", "uk": "Подорожі", "es": "Viajes", "fr": "Voyages"},
    "work": {"en": "Work", "ru": "Работа", "uk": "Робота", "es": "Trabajo", "fr": "Travail"},
    "school": {"en": "Study", "ru": "Учёба", "uk": "Навчання", "es": "Estudios", "fr": "Études"},
    "health": {"en": "Health", "ru": "Здоровье", "uk": "Здоров’я", "es": "Salud", "fr": "Santé"},
    "body": {"en": "Body", "ru": "Тело", "uk": "Тіло", "es": "Cuerpo", "fr": "Corps"},
    "clothes": {"en": "Clothes", "ru": "Одежда", "uk": "Одяг", "es": "Ropa", "fr": "Vêtements"},
    "colors": {"en": "Colours and qualities", "ru": "Цвета и качества", "uk": "Кольори та якості", "es": "Colores y cualidades", "fr": "Couleurs et qualités"},
    "animals": {"en": "Animals", "ru": "Животные", "uk": "Тварини", "es": "Animales", "fr": "Animaux"},
    "nature": {"en": "Nature", "ru": "Природа", "uk": "Природа", "es": "Naturaleza", "fr": "Nature"},
    "weather": {"en": "Weather", "ru": "Погода", "uk": "Погода", "es": "El tiempo", "fr": "Météo"},
    "shopping": {"en": "Shopping", "ru": "Покупки", "uk": "Покупки", "es": "Compras", "fr": "Achats"},
    "feelings": {"en": "Feelings", "ru": "Чувства", "uk": "Почуття", "es": "Sentimientos", "fr": "Sentiments"},
    "verbs": {"en": "Verbs", "ru": "Глаголы", "uk": "Дієслова", "es": "Verbos", "fr": "Verbes"},
    "daily": {"en": "Daily life", "ru": "Быт", "uk": "Побут", "es": "Vida diaria", "fr": "Vie quotidienne"},
    "tech": {"en": "Technology", "ru": "Технологии", "uk": "Технології", "es": "Tecnología", "fr": "Technologie"},
    "news": {"en": "News", "ru": "Новости", "uk": "Новини", "es": "Noticias", "fr": "Actualités"},
    "abstract": {"en": "Abstract ideas", "ru": "Абстрактное", "uk": "Абстрактне", "es": "Ideas abstractas", "fr": "Idées abstraites"},
    "core": {"en": "Core words", "ru": "Частые слова", "uk": "Часті слова", "es": "Palabras frecuentes", "fr": "Mots fréquents"},
}
THEME_ORDER = list(THEMES)
KIND_TITLES = {
    "slang": {"en": "Slang", "ru": "Сленг", "uk": "Сленг", "es": "Jerga", "fr": "Argot"},
    "idioms": {"en": "Idioms", "ru": "Идиомы", "uk": "Ідіоми", "es": "Modismos", "fr": "Expressions"},
    "dialogue": {"en": "Dialogues", "ru": "Диалоги", "uk": "Діалоги", "es": "Diálogos", "fr": "Dialogues"},
}

# ---------------------------------------------------------------- curation lists

VULGAR = {"חרא", "איזה חרא", "חרטא", "חרטטן", "מניאק", "לא דופק חשבון", "לא דופק לי", "נדפק", "לעזאזל", "לעזאזל עם זה"}
WRONG_SLANG = {
    "מבסס": "not slang",
    "תזרים": "finance term (cash flow), not slang",
    "נגמר לי הסוללה": "ungrammatical (נגמרה לי הסוללה)",
    "על freeze": "Latin script inside Hebrew",
    "חפור": "wrong form (the slang word is חופר)",
}
DUBIOUS_SLANG = {
    "חרטה": "slang sense unclear; standard meaning is regret",
    "חננה": "rare form; check usage",
    "גוגל את זה": "calque; native form is usually תגגל",
    "שפיץ": "check slang sense",
    "תן לי לשבור": "check idiomatic use",
    "שקט על היציע": "check idiomatic use",
    "יאללה סידור": "check idiomatic use",
    "סבבה המצב": "check idiomatic use",
    "סבבה נקודה": "check idiomatic use",
    "לעשות בלגן טוב": "check idiomatic use",
    "בקיצור טוב": "check idiomatic use",
}
GLOSS_FIXES = {"cool as hell": "insanely cool"}

# Figurative multi-word expressions moved from the slang list into the idiom section,
# with word-for-word literal glosses where the literal reading is certain.
IDIOMS = {
    "חבל על הזמן": ("a pity about the time", "жаль времени"),
    "על הפנים": ("on the face", "на лице"),
    "סוף הדרך": ("end of the road", "конец пути"),
    "על הדרך": ("on the way", "по дороге"),
    "לצאת מהכלים": ("to go out of the vessels", "выйти из сосудов"),
    "לא לקחת ללב": ("not to take to heart", "не брать к сердцу"),
    "לסגור פינה": ("to close a corner", "закрыть угол"),
    "ראש גדול": ("big head", "большая голова"),
    "ראש קטן": ("small head", "маленькая голова"),
    "חצי חינם": ("half free", "полдаром"),
    "אין לי מושג ירוק": ("I don't have a green idea", "у меня нет зелёного понятия"),
    "אכלת אותה": ("you ate it", "ты её съел"),
    "בסוף היום": ("at the end of the day", "в конце дня"),
    "לקחת אוויר": ("to take air", "взять воздуха"),
    "על הראש": ("on the head", "на голове"),
    "באוויר": ("in the air", "в воздухе"),
    "לשבור את הראש": ("to break the head", "ломать голову"),
    "על קצה המזלג": ("on the tip of the fork", "на кончике вилки"),
    "עשו לי תרגיל": None,
    "הפיל שבחדר": ("the elephant in the room", "слон в комнате"),
    "לעמוד על הרגליים האחוריות": ("to stand on the hind legs", "встать на задние лапы"),
    "לעשות שריר": ("to make a muscle", "сделать мускул"),
    "לתפוס את הראש": None,
    "על הברזלים": ("on the irons", "на железках"),
    "לא בא בחשבון": ("doesn't come into the account", "не входит в расчёт"),
    "על הכיס": ("on the pocket", "на кармане"),
    "לחתוך פינות": ("to cut corners", "срезать углы"),
    "לצאת ידי חובה": None,
    "על הנייר": ("on paper", "на бумаге"),
    "בשטח": ("in the field", "на местности"),
    "על קצה הלשון": ("on the tip of the tongue", "на кончике языка"),
    "בגובה העיניים": ("at eye level", "на уровне глаз"),
    "לתת בראש": ("to give in the head", "дать в голову"),
    "לרדת מהעץ": ("to come down from the tree", "слезть с дерева"),
    "לשבור שיניים": ("to break teeth", "ломать зубы"),
    "לשבור שתיקה": ("to break silence", "нарушить молчание"),
    "על הברכיים": ("on the knees", "на коленях"),
    "לתפוס את עצמך": ("to catch yourself", "поймать себя"),
    "על אחריותך": ("on your responsibility", "под твою ответственность"),
    "סוף העולם": ("end of the world", "конец света"),
    "מת מצחוק": ("dead from laughter", "умер от смеха"),
    "על עצבים": ("on nerves", "на нервах"),
    "בול פגיעה": ("bullseye hit", "попадание в яблочко"),
    "שווה כל שקל": ("worth every shekel", "стоит каждого шекеля"),
}
# Hand-checked idioms that sit in the word list.
WORD_IDIOMS = {
    "יש מצב": ("there is a situation", "есть ситуация"),
    "אין מצב": ("there is no situation", "нет ситуации"),
    "כל הכבוד": ("all the honour", "вся честь"),
}

# Certain corrections to legacy Hebrew: (item id, field path, wrong, right).
FIXES = [
    ("slang-al-tagzim-87", "example.nikud", "לֹא נּוֹרָא", "לֹא נוֹרָא"),
    ("slang-yalla-ba-ba-200", "example.nikud", "שָׁמוֹר", "שְׁמוֹר"),
    ("slang-yalla-lehitraot-247", "example.nikud", "שָׁמוֹר", "שְׁמוֹר"),
    ("slang-kal-tuv-252", "example.nikud", "שָׁמוֹר", "שְׁמוֹר"),
    ("elementary-clothes-d0", "replies.0.nikud", "הִיא עַל הַכִּסֵּא", "הוּא עַל הַכִּסֵּא"),
]
DROP_EXAMPLE = {"slang-lakhtof-194": "example verb form is garbled (לָחַטְפְתִּי)"}
EXAMPLE_REVIEW = {"slang-magniv-beteruf-339": "agreement: הַהוֹפָעָה הָיְתָה מַגְנִיב (expected מַגְנִיבָה)"}

# Single-sense English glosses that are homographs: the Russian was produced from the
# English and often picked the wrong sense (שְׂמֹאל "left" → «ушёл»).
HOMOGRAPHS = {
    "left", "well", "rest", "times", "spring", "fair", "light", "fine", "kind", "mean", "present", "close",
    "lead", "minute", "object", "saw", "watch", "will", "may", "can", "right", "park", "match", "bear",
    "content", "row", "tear", "wind", "bank", "bark", "date", "fall", "file", "fire", "letter", "march",
    "play", "point", "ring", "scale", "season", "sign", "sink", "train", "trip", "type", "major", "order",
    "party", "parties", "case", "cases", "state", "states", "table", "tables", "plant", "plants", "power",
}

# ---------------------------------------------------------------- helpers

NIKUD = re.compile("[\u0591-\u05C7]")
HEB = re.compile("[\u05D0-\u05EA]")


def plain_of(pointed: str) -> str:
    return unicodedata.normalize("NFC", NIKUD.sub("", pointed))


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def senses(s: str) -> list[str]:
    return [x.strip() for x in s.split("/") if x.strip()]


def is_gold(item: dict) -> bool:
    return not re.match(r"f\d+-", item["id"])


def slug_of(item: dict) -> str:
    return re.sub(r"^f\d+-", "", item["id"])


def norm_ru(s: str) -> str:
    s = re.sub(r"\(ф\.\s?пл\.\)|\(ф\.пл\.\)", "(ж. мн.)", s)
    s = re.sub(r"\((ф\.|фс\.|ф\.с)\)", "(ж.)", s)
    s = s.replace("(м)", "(м.)")
    return dedupe_senses(s)


def dedupe_senses(s: str) -> str:
    out: list[str] = []
    for part in senses(s):
        base = re.sub(r"\s*\([^)]*\)", "", part).strip().lower()
        prev = next((i for i, p in enumerate(out) if re.sub(r"\s*\([^)]*\)", "", p).strip().lower() == base), None)
        if prev is None:
            out.append(part)
        elif "(" in part and "(" not in out[prev]:
            out[prev] = part
    return " / ".join(out)


# Vowel skeleton check between the pointed form and the independent romanised id.
SHVA, HATAF_SEGOL, HATAF_PATAH, HATAF_QAMATS = "\u05b0", "\u05b1", "\u05b2", "\u05b3"
HIRIQ, TSERE, SEGOL, PATAH, QAMATS, HOLAM, HOLAM_HASER, QUBUTS, DAGESH = (
    "\u05b4", "\u05b5", "\u05b6", "\u05b7", "\u05b8", "\u05b9", "\u05ba", "\u05bb", "\u05bc",
)
VOWELS = SHVA + HATAF_SEGOL + HATAF_PATAH + HATAF_QAMATS + HIRIQ + TSERE + SEGOL + PATAH + QAMATS + HOLAM + QUBUTS


def vowel_pattern(pointed: str) -> str:
    chars = list(unicodedata.normalize("NFD", pointed.replace(" ", "").replace("-", "")))
    out = []
    for i, c in enumerate(chars):
        if c == "\u05d5" and i + 1 < len(chars) and chars[i + 1] == DAGESH and (i + 2 >= len(chars) or chars[i + 2] not in VOWELS):
            out.append("u")
        elif c in (PATAH, HATAF_PATAH):
            out.append("a")
        elif c == QAMATS:
            out.append("[ao]")
        elif c == HATAF_QAMATS:
            out.append("o")
        elif c in (TSERE, SEGOL, HATAF_SEGOL):
            out.append("e")
        elif c == HIRIQ:
            out.append("i")
        elif c in (HOLAM, HOLAM_HASER):
            out.append("o")
        elif c == QUBUTS:
            out.append("u")
        elif c == SHVA:
            out.append("e?")
    return "^" + "".join(out) + "$"


def romanised_vowels(text: str) -> str:
    t = re.sub(r"[^a-z]", "", text.lower())
    t = re.sub(r"e[iy](?![aeiou])", "e", t)
    return "".join(re.findall("[aeiou]", t))


def pointing_matches_id(item: dict) -> bool:
    return re.match(vowel_pattern(item["nikud"]), romanised_vowels(slug_of(item))) is not None


def get_path(obj, path: str):
    for part in path.split("."):
        obj = obj[int(part)] if isinstance(obj, list) else obj[part]
    return obj


def set_path(obj, path: str, value) -> None:
    parts = path.split(".")
    for part in parts[:-1]:
        obj = obj[int(part)] if isinstance(obj, list) else obj[part]
    last = parts[-1]
    if isinstance(obj, list):
        obj[int(last)] = value
    else:
        obj[last] = value


def apply_fixes(by_id: dict[str, dict]) -> list[dict]:
    applied = []
    for item_id, path, wrong, right in FIXES:
        item = by_id.get(item_id)
        if item is None:
            raise SystemExit(f"fix target missing: {item_id}")
        current = get_path(item, path)
        if wrong not in current:
            raise SystemExit(f"fix text not found in {item_id}.{path}: {wrong}")
        set_path(item, path, current.replace(wrong, right))
        applied.append({"id": item_id, "field": path, "from": wrong, "to": right})
    return applied


def load(kind: str) -> list[dict]:
    rows = []
    for level in LEGACY_LEVELS:
        data = json.loads((LEX / f"{kind}-{level}.json").read_text(encoding="utf-8"))
        for row in data[kind]:
            row.setdefault("level", level)
            row["_file"] = f"{kind}-{level}.json"
            rows.append(row)
    return rows


# ---------------------------------------------------------------- word filter


def word_drop_reason(w: dict, plain_set: set[str], taught: set[str]) -> str | None:
    en = (w.get("en") or "").strip()
    ru = (w.get("ru") or "").strip()
    he = w.get("hebrew") or ""
    if not en or not ru or not w.get("nikud"):
        return "missing translation or pointing"
    if re.search(r"[A-Za-z0-9]", he):
        return "Latin letters or digits in Hebrew"
    if he in taught:
        return "already taught in Aleph–Gimel"
    if is_gold(w):
        return None
    if re.match(r"(and|the|that|which|who|whom|whose)\b", en, re.I):
        return "prefixed form (ו/ה/ש), not a dictionary entry"
    if re.match(r"(my|your|his|her|its|our|their)\b", en, re.I):
        return "possessive-suffix form"
    if re.match(r"(i|you|he|she|it|we|they)\b", en, re.I) and w.get("pos") != "pronoun":
        return "conjugated verb form"
    if re.search(r"\bimp\b", en):
        return "imperative gloss unreliable"
    if re.search(r"\((f\.)?pl\.\)|\(m\.p\.\)", en):
        return "plural inflection"
    if re.search(r"\b(was|were|is|are|been)\b", en):
        return "conjugated verb form"
    if len(senses(en)) >= 3:
        return "three or more mixed senses"
    if any(s.endswith(" of") for s in senses(en)):
        return "construct-state form"
    if re.match(r"(to|for|in|from|like|as|on|at|with|of|by) (/|a |an )", en):
        return "prefixed preposition form"
    if he[0] in "בלמכ" and he[1:] in plain_set and re.match(r"(in|for|from|like|as|on|at|with|of|to|by)\b", en) and not re.match(r"to \w+$", en):
        return "prefixed preposition form"
    if he[0] == "ה" and he[1:] in plain_set:
        return "definite form of another entry"
    ru_inf = all(re.search(r"(ть|ться|чь|ти)$", s.split(" (")[0]) for s in senses(ru))
    en_inf = all(s.startswith("to ") for s in senses(en))
    if ru_inf != en_inf:
        return "Russian and English glosses disagree on part of speech"
    if re.search(r"\((м|ж)\.\)", ru) and re.search(r"(ет|ит|ут|ют|ат|ят|ся|л|ла|ли)\b", ru.split(" (")[0]):
        return "conjugated verb form"
    if len(senses(en)) == 1 and en.lower() in HOMOGRAPHS:
        return "English homograph; Russian sense unreliable"
    if not pointing_matches_id(w):
        return "pointing does not match the source romanisation"
    return None


def example_templates(rows: list[dict]) -> Counter:
    counts: Counter = Counter()
    for r in rows:
        ex = (r.get("example") or {}).get("nikud") or ""
        if ex and r.get("nikud") and r["nikud"] in ex:
            counts[ex.replace(r["nikud"], "{W}")] += 1
    return counts


def good_example(r: dict, templates: Counter) -> dict | None:
    ex = r.get("example") or {}
    p = (ex.get("nikud") or "").strip()
    if not p or not ex.get("en") or not ex.get("ru") or r["id"] in DROP_EXAMPLE:
        return None
    if r.get("nikud") and r["nikud"] in p and templates[p.replace(r["nikud"], "{W}")] >= 3:
        return None
    if re.search(r"\w: \w", ex["ru"]) or re.search(r"\w: \w", ex["en"]):
        return None
    if re.search(r"[A-Za-z]", p):
        return None
    return {"p": nfc(p), "en": ex["en"].strip(), "ru": ex["ru"].strip()}


def translit(w: dict) -> str:
    if is_gold(w):
        return w.get("transcription") or ""
    return slug_of(w).replace("-", "'")


def pos_of(w: dict) -> str | None:
    if is_gold(w):
        return w.get("pos")
    if all(s.startswith("to ") for s in senses(w["en"])):
        return "verb"
    return None


# ---------------------------------------------------------------- build


def chunk(items: list, size: int = LESSON_SIZE) -> list[list]:
    """Split into the fewest parts of at most `size`, as even as possible."""
    if not items:
        return []
    parts = -(-len(items) // size)
    base, extra = divmod(len(items), parts)
    out, start = [], 0
    for i in range(parts):
        end = start + base + (1 if i < extra else 0)
        out.append(items[start:end])
        start = end
    return out


def numbered(title: dict, n: int, total: int) -> dict:
    return {k: (f"{v} · {n}" if total > 1 else v) for k, v in title.items()}


def main() -> None:
    published = json.loads(PUBLISHED.read_text(encoding="utf-8"))
    taught = {v.get("unpointed") or v.get("lemma") for l in published["lessons"] for v in l["vocabulary"]}
    taught |= {plain_of(v.get("pointed") or "") for l in published["lessons"] for v in l["vocabulary"]}

    words, slang, dialogues = load("words"), load("slang"), load("dialogues")
    by_id = {r["id"]: r for r in words + slang + dialogues}
    fixes = apply_fixes(by_id)
    templates = example_templates(words + slang)
    plain_set = {w["hebrew"] for w in words}

    items: dict[str, dict] = {}
    review: list[dict] = []
    dropped: list[dict] = []

    def flag(item_id: str, kind: str, he: str, reasons: list[str], en: str = "", ru: str = "") -> None:
        review.append({"id": item_id, "kind": kind, "he": he, "en": en, "ru": ru, "reasons": reasons})

    # ---- idioms: from slang + hand-checked word entries
    idiom_ids: list[str] = []
    for s in slang:
        if s["hebrew"] in IDIOMS:
            lit = IDIOMS[s["hebrew"]]
            iid = f"i:{s['id']}"
            ex = good_example(s, templates)
            row = {"t": "i", "he": s["hebrew"], "p": nfc(s["nikud"]), "tr": s.get("transcription") or "", "en": s["en"], "ru": s["ru"], "src": f"legacy:{s['_file']}#{s['id']}", "review": 1}
            if ex:
                row["ex"] = ex
            if s.get("usage"):
                row["usage"] = s["usage"]
            if lit:
                row["lit"] = {"en": lit[0], "ru": lit[1]}
            items[iid] = row
            idiom_ids.append(iid)
            flag(iid, "idiom", s["nikud"], ["legacy slang entry; meaning and example need native check"], s["en"], s["ru"])
    seen_idioms = {items[i]["he"] for i in idiom_ids}
    for w in words:
        if w["hebrew"] in WORD_IDIOMS and w["hebrew"] not in seen_idioms:
            lit = WORD_IDIOMS[w["hebrew"]]
            iid = f"i:{w['id']}"
            ex = good_example(w, templates)
            row = {"t": "i", "he": w["hebrew"], "p": nfc(w["nikud"]), "tr": w.get("transcription") or "", "en": w["en"], "ru": w["ru"], "src": f"legacy:{w['_file']}#{w['id']}", "lit": {"en": lit[0], "ru": lit[1]}}
            if ex:
                row["ex"] = ex
            items[iid] = row
            idiom_ids.append(iid)
            seen_idioms.add(w["hebrew"])

    # ---- slang
    slang_ids: list[str] = []
    for s in slang:
        he = s["hebrew"]
        if he in IDIOMS:
            continue
        if he in VULGAR:
            dropped.append({"id": s["id"], "he": s["nikud"], "reason": "vulgar; keeps the app suitable for a 4+ rating"})
            continue
        if he in WRONG_SLANG:
            dropped.append({"id": s["id"], "he": s["nikud"], "reason": WRONG_SLANG[he]})
            continue
        sid = f"s:{s['id']}"
        en = GLOSS_FIXES.get(s["en"], s["en"])
        row = {"t": "s", "he": he, "p": nfc(s["nikud"]), "tr": s.get("transcription") or "", "en": en, "ru": s["ru"], "src": f"legacy:{s['_file']}#{s['id']}", "review": 1, "lv": s["level"]}
        ex = good_example(s, templates)
        if ex:
            row["ex"] = ex
        if s.get("usage"):
            row["usage"] = s["usage"]
        reasons = ["legacy slang entry; meaning, register and example need native check"]
        if he in DUBIOUS_SLANG:
            reasons.append(DUBIOUS_SLANG[he])
        if s["id"] in EXAMPLE_REVIEW:
            reasons.append(EXAMPLE_REVIEW[s["id"]])
        if s["id"] in DROP_EXAMPLE:
            reasons.append(DROP_EXAMPLE[s["id"]] + " (example hidden)")
        items[sid] = row
        slang_ids.append(sid)
        flag(sid, "slang", s["nikud"], reasons, en, s["ru"])

    # ---- words
    word_ids_by_level: dict[str, list[str]] = defaultdict(list)
    seen_words = set(seen_idioms)
    for w in words:
        if w["hebrew"] in WORD_IDIOMS:
            continue
        reason = word_drop_reason(w, plain_set, taught)
        if not reason and w["hebrew"] in seen_words:
            reason = "duplicate of an earlier entry"
        if reason:
            dropped.append({"id": w["id"], "he": w.get("nikud") or w.get("hebrew"), "reason": reason})
            continue
        seen_words.add(w["hebrew"])
        wid = f"w:{w['id']}"
        row = {"t": "w", "he": w["hebrew"], "p": nfc(w["nikud"]), "tr": translit(w), "en": dedupe_senses(w["en"]), "ru": norm_ru(w["ru"]), "th": w.get("theme") or "core", "src": f"legacy:{w['_file']}#{w['id']}"}
        pos = pos_of(w)
        if pos:
            row["pos"] = pos
        ex = good_example(w, templates)
        if ex:
            row["ex"] = ex
        if not is_gold(w):
            row["review"] = 1
            flag(wid, "word", w["nikud"], ["machine-derived entry; gloss and pointing need native check"], row["en"], row["ru"])
        items[wid] = row
        word_ids_by_level[w["level"]].append(wid)

    # ---- dialogues
    dialogue_ids_by_level: dict[str, list[str]] = defaultdict(list)
    for d in dialogues:
        did = f"d:{d['id']}"
        lines = [{"s": ln["speaker"], "p": nfc(ln["nikud"]), "en": ln["en"], "ru": ln["ru"]} for ln in d["lines"]]
        replies = [{"p": nfc(r["nikud"]), "en": r["en"], "ru": r["ru"], **({"ok": 1} if r.get("correct") else {})} for r in d["replies"]]
        if sum(1 for r in replies if r.get("ok")) != 1 or any(HEB.search(x["p"]) is None for x in lines + replies):
            dropped.append({"id": d["id"], "he": lines[0]["p"] if lines else "", "reason": "malformed dialogue"})
            continue
        items[did] = {"t": "d", "title": {"en": d["titleEn"], "ru": d["title"]}, "th": d.get("theme"), "lines": lines, "replies": replies, "src": f"legacy:{d['_file']}#{d['id']}", "review": 1}
        dialogue_ids_by_level[d["level"]].append(did)
        flag(did, "dialogue", lines[0]["p"], ["legacy dialogue; grammar and naturalness need native check"], d["titleEn"], d["title"])

    # ---- literary
    lit = json.loads(LITERARY.read_text(encoding="utf-8"))
    verse_lessons: dict[str, list[str]] = defaultdict(list)
    for v in lit["verses"]:
        vid = f"v:{v['id']}"
        row = {"t": "v", "p": v["text"]["he"], "he": plain_of(v["text"]["he"]), "ref": v["ref"], "src": v["source"]}
        for lang in LANGS:
            row[lang] = v["text"][lang]
        if v.get("note"):
            row["note"] = v["note"]
            flag(vid, "verse-note", v["text"]["he"], ["editorial note on modern usage; check wording"], v["note"]["en"], v["note"]["ru"])
        items[vid] = row
        verse_lessons[v["lesson"]].append(vid)

    # ---- lessons per stage
    def word_lessons(stage: str, levels: list[str]) -> list[dict]:
        out = []
        prefix = SLUG_PREFIX[stage]
        for level in levels:
            ids = word_ids_by_level[level]
            by_theme: dict[str, list[str]] = defaultdict(list)
            for wid in ids:
                theme = items[wid]["th"] if items[wid]["th"] in THEMES else "core"
                by_theme[theme].append(wid)
            for theme in [t for t in by_theme if t != "core" and len(by_theme[t]) < LESSON_MIN]:
                by_theme["core"].extend(by_theme.pop(theme))
            for theme in sorted(by_theme, key=THEME_ORDER.index):
                parts = chunk(by_theme[theme])
                for n, part in enumerate(parts, 1):
                    out.append({"slug": f"{prefix}-{level}-{theme}-{n}", "kind": "words", "title": numbered(THEMES.get(theme, THEMES["core"]), n, len(parts)), "items": part})
        return out

    def dialogue_lessons(stage: str, levels: list[str]) -> list[dict]:
        out = []
        prefix = SLUG_PREFIX[stage]
        for level in levels:
            parts = chunk(dialogue_ids_by_level[level], 3)
            for n, part in enumerate(parts, 1):
                out.append({"slug": f"{prefix}-{level}-dialogues-{n}", "kind": "dialogue", "title": numbered(KIND_TITLES["dialogue"], n, len(parts)), "items": part})
        return out

    def interleave(main: list[dict], extra: list[dict]) -> list[dict]:
        if not extra:
            return main
        out, step = [], max(1, len(main) // (len(extra) + 1))
        queue = list(extra)
        for i, lesson in enumerate(main, 1):
            out.append(lesson)
            if queue and i % step == 0:
                out.append(queue.pop(0))
        return out + queue

    stage_lessons: dict[str, list[dict]] = {}
    for stage in ("upper", "advanced", "fluent"):
        levels = [lv for lv in LEGACY_LEVELS if STAGE_OF[lv] == stage]
        merged: list[dict] = []
        for level in levels:
            merged += interleave(word_lessons(stage, [level]), dialogue_lessons(stage, [level]))
        stage_lessons[stage] = merged
    slang_sorted = sorted(slang_ids, key=lambda i: LEGACY_LEVELS.index(items[i]["lv"]))
    parts = chunk(slang_sorted)
    stage_lessons["slang"] = [{"slug": f"slang-{n}", "kind": "slang", "title": numbered(KIND_TITLES["slang"], n, len(parts)), "items": p} for n, p in enumerate(parts, 1)]
    parts = chunk(idiom_ids)
    stage_lessons["idioms"] = [{"slug": f"idioms-{n}", "kind": "idioms", "title": numbered(KIND_TITLES["idioms"], n, len(parts)), "items": p} for n, p in enumerate(parts, 1)]
    stage_lessons["literary"] = [
        {"slug": f"literary-{key}", "kind": "verses", "title": lit["_meta"]["lessons"][key], "items": ids} for key, ids in verse_lessons.items()
    ]
    for row in items.values():
        row.pop("lv", None)

    stages = []
    for meta in STAGES:
        sid = meta["id"]
        gate_slug = published["checkpointSlugs"].get(sid) or f"checkpoint-{sid}"
        stage = {
            "id": sid,
            "ulpan": meta["ulpan"],
            "cefr": meta["cefr"],
            "opensAfter": meta["opensAfter"],
            "title": meta.get("title") or published["stageTitles"][sid],
            "gate": {"slug": gate_slug, "kind": meta.get("gateKind", "checkpoint"), "title": meta["gate"], "objective": GATE_TEXT},
            "lessons": stage_lessons[sid],
        }
        if meta.get("section"):
            stage["section"] = True
        stages.append(stage)

    used = [i for s in stages for l in s["lessons"] for i in l["items"]]
    assert len(used) == len(set(used)), "item used twice"
    assert set(used) == set(items), "orphan items"

    def count(t: str) -> int:
        return sum(1 for r in items.values() if r["t"] == t)

    counts = {
        "stages": len(stages),
        "lessons": sum(len(s["lessons"]) for s in stages),
        "gates": len(stages),
        "words": count("w"),
        "words_hand_checked": sum(1 for r in items.values() if r["t"] == "w" and not r.get("review")),
        "slang": count("s"),
        "idioms": count("i"),
        "dialogues": count("d"),
        "verses": count("v"),
        "examples": sum(1 for r in items.values() if r.get("ex")),
        "needs_native_review": sum(1 for r in items.values() if r.get("review")),
        "dropped": len(dropped),
    }
    data = {
        "version": 1,
        "_meta": {
            "generator": "scripts/build_curriculum.py",
            "sources": {
                "legacy": "legacy/ivrit-s-nulya/data/lexicon (words, slang, dialogues)",
                "literary": "content/literary/tanakh.json (public domain; per-verse edition credits in `src`)",
            },
            "counts": counts,
            "fixes": fixes,
            "review": "Items with review=1 need a native speaker; see content/review/curriculum-review.json.",
        },
        "stages": stages,
        "items": items,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    REVIEW.parent.mkdir(parents=True, exist_ok=True)
    REVIEW.write_text(json.dumps({"count": len(review), "items": review}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    reasons = Counter(d["reason"] for d in dropped)
    DROPPED.write_text(json.dumps({"count": len(dropped), "by_reason": dict(reasons.most_common()), "items": dropped}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(counts, ensure_ascii=False))
    for s in stages:
        print(f"  {s['id']:<9} {len(s['lessons']):>3} lessons, {sum(len(l['items']) for l in s['lessons']):>4} items")


if __name__ == "__main__":
    main()
