#!/usr/bin/env python3
"""Fetch the public-domain Tanakh verses used by the literary section.

Writes content/literary/tanakh.json. Run once with network access; the build
(scripts/build_curriculum.py) only reads the committed JSON.

Every text comes from a public-domain edition served by api.getbible.net:
  he  Westminster Leningrad Codex (WLC), cantillation stripped, vowels kept
  ru  Synodal translation (1876)
  uk  Ivan Ohienko translation (1930s)
  en  World English Bible (WEB)
  es  Reina-Valera (1909)
  fr  Louis Segond (1910)

Translations do not share verse numbering with the Hebrew (Psalms in particular),
so each verse lists the reference used per edition. Every pairing was checked by
reading the texts side by side.
"""
from __future__ import annotations

import json
import re
import subprocess
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "literary" / "tanakh.json"
API = "https://api.getbible.net/v2/{tr}/{book}/{chapter}.json"

EDITIONS = {
    "he": {"code": "codex", "name": "Westminster Leningrad Codex", "license": "public domain"},
    "ru": {"code": "synodal", "name": "Синодальный перевод (1876)", "license": "public domain"},
    "uk": {"code": "ukrogienko", "name": "Переклад Івана Огієнка (1930-ті)", "license": "public domain"},
    "en": {"code": "web", "name": "World English Bible", "license": "public domain"},
    "es": {"code": "valera", "name": "Reina-Valera (1909)", "license": "public domain (published 1909)"},
    "fr": {"code": "ls1910", "name": "Louis Segond (1910)", "license": "public domain (published 1910)"},
}

BOOKS = {
    1: {"en": "Genesis", "ru": "Бытие", "uk": "Буття", "es": "Génesis", "fr": "Genèse", "he": "בראשית"},
    8: {"en": "Ruth", "ru": "Руфь", "uk": "Рут", "es": "Rut", "fr": "Ruth", "he": "רות"},
    19: {"en": "Psalms", "ru": "Псалтирь", "uk": "Псалми", "es": "Salmos", "fr": "Psaumes", "he": "תהלים"},
    20: {"en": "Proverbs", "ru": "Притчи", "uk": "Приповісті", "es": "Proverbios", "fr": "Proverbes", "he": "משלי"},
    21: {"en": "Ecclesiastes", "ru": "Екклесиаст", "uk": "Екклезіяст", "es": "Eclesiastés", "fr": "Ecclésiaste", "he": "קהלת"},
    22: {"en": "Song of Songs", "ru": "Песнь песней", "uk": "Пісня над піснями", "es": "Cantares", "fr": "Cantique des cantiques", "he": "שיר השירים"},
    23: {"en": "Isaiah", "ru": "Исаия", "uk": "Ісая", "es": "Isaías", "fr": "Ésaïe", "he": "ישעיהו"},
}

# Synodal and Ohienko follow Greek psalm numbering; WEB and Reina-Valera drop psalm titles from the count.
PSALM_SHIFT = {
    (19, 2): {"ru": (18, 2), "uk": (18, 2), "en": (19, 1), "es": (19, 1)},
    (34, 15): {"ru": (33, 15), "uk": (33, 15), "en": (34, 14), "es": (34, 14)},
    (90, 12): {"ru": (89, 12), "uk": (89, 12)},
    (121, 1): {"ru": (120, 1), "uk": (120, 1)},
    (121, 4): {"ru": (120, 4), "uk": (120, 4)},
    (126, 5): {"ru": (125, 5), "uk": (125, 5)},
    (133, 1): {"ru": (132, 1), "uk": (132, 1)},
    (137, 5): {"ru": (136, 5), "uk": (136, 5)},
}

# (lesson, book, chapter, verse, modern-usage note or None). Notes describe how the line lives on
# in today's Hebrew; they are editorial and flagged for review in the build.
VERSES = [
    ("beginnings", 1, 1, 1, None),
    ("beginnings", 1, 1, 3, None),
    ("beginnings", 21, 1, 2, {"en": "Today «הבל הבלים» means utter futility.", "ru": "Сегодня «הבל הבלים» значит «полная бессмыслица, тщета»."}),
    ("beginnings", 21, 1, 4, None),
    ("beginnings", 21, 1, 9, {"en": "«אין חדש תחת השמש» is an everyday saying: nothing new under the sun.", "ru": "«אין חדש תחת השמש» — ходовая поговорка: ничто не ново под солнцем."}),
    ("beginnings", 21, 3, 1, None),
    ("seasons", 21, 3, 2, None),
    ("seasons", 21, 3, 4, None),
    ("seasons", 21, 7, 1, None),
    ("seasons", 21, 11, 1, None),
    ("seasons", 20, 1, 8, None),
    ("seasons", 20, 6, 6, None),
    ("proverbs", 20, 15, 1, None),
    ("proverbs", 20, 18, 21, None),
    ("proverbs", 20, 22, 6, None),
    ("proverbs", 20, 26, 27, {"en": "«כורה שחת בה יפול» is a common proverb: he who digs a pit falls into it.", "ru": "«כורה שחת בה יפול» — распространённая пословица: не рой другому яму."}),
    ("proverbs", 20, 31, 10, {"en": "«אשת חיל» today praises a capable, accomplished woman.", "ru": "«אשת חיל» сегодня — похвала деятельной, достойной женщине."}),
    ("proverbs", 19, 34, 15, None),
    ("psalms", 19, 19, 2, None),
    ("psalms", 19, 90, 12, None),
    ("psalms", 19, 121, 1, None),
    ("psalms", 19, 121, 4, None),
    ("psalms", 19, 126, 5, None),
    ("psalms", 19, 133, 1, {"en": "The opening words are a well-known Israeli song.", "ru": "Начало стиха — известная израильская песня."}),
    ("song", 19, 137, 5, {"en": "Recited at Jewish weddings before the glass is broken.", "ru": "Произносят на еврейской свадьбе перед тем, как разбить бокал."}),
    ("song", 22, 2, 12, None),
    ("song", 22, 6, 3, {"en": "«אני לדודי ודודי לי» is often engraved on wedding rings.", "ru": "«אני לדודי ודודי לי» часто гравируют на обручальных кольцах."}),
    ("song", 22, 8, 7, None),
    ("song", 8, 1, 16, None),
    ("song", 23, 2, 4, {"en": "«לא ישא גוי אל גוי חרב» is a classic call for peace.", "ru": "«לא ישא גוי אל גוי חרב» — классический призыв к миру."}),
    ("song", 23, 11, 6, None),
]

LESSON_TITLES = {
    "beginnings": {"en": "Beginnings and Kohelet", "ru": "Начало и Коэлет", "he": "בראשית וקהלת", "uk": "Початок і Когелет", "es": "Principios y Cohélet", "fr": "Commencements et Qohélet"},
    "seasons": {"en": "A time for everything", "ru": "Всему своё время", "he": "לכל זמן", "uk": "Усьому свій час", "es": "Todo tiene su tiempo", "fr": "Un temps pour tout"},
    "proverbs": {"en": "Proverbs", "ru": "Притчи", "he": "משלי", "uk": "Приповісті", "es": "Proverbios", "fr": "Proverbes"},
    "psalms": {"en": "Psalms", "ru": "Псалмы", "he": "תהלים", "uk": "Псалми", "es": "Salmos", "fr": "Psaumes"},
    "song": {"en": "Song of Songs, Ruth, Isaiah", "ru": "Песнь песней, Руфь, Исаия", "he": "שיר השירים, רות, ישעיהו", "uk": "Пісня над піснями, Рут, Ісая", "es": "Cantares, Rut, Isaías", "fr": "Cantique, Ruth, Ésaïe"},
}


def fetch(code: str, book: int, chapter: int) -> dict:
    url = API.format(tr=code, book=book, chapter=chapter)
    for attempt in range(4):
        try:
            out = subprocess.run(["curl", "-sf", "-m", "30", "-A", "Mozilla/5.0", url], check=True, capture_output=True)
            return json.loads(out.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            time.sleep(2 ** attempt)
    raise SystemExit(f"could not fetch {url}")


def clean_he(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = re.sub("[\u0591-\u05AF\u05BD\u05C0\u05C3\u200D]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_tr(text: str, lang: str) -> str:
    text = re.sub(r"\[[^\]]*\]\s*", "", text).strip()
    if lang == "uk":
        text = unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0301", ""))
    words = text.split(" ")
    if words and len(words[0]) > 1 and words[0].isupper():
        words[0] = words[0].capitalize()
    text = " ".join(words)
    return re.sub(r"\s+", " ", text).strip()


def ref_label(book: int, chapter: int, verse: int, lang: str) -> str:
    return f"{BOOKS[book][lang]} {chapter}:{verse}"


def main() -> None:
    cache: dict[tuple[str, int, int], dict] = {}
    items = []
    for lesson, book, chapter, verse, note in VERSES:
        item = {
            "id": f"tanakh-{book}-{chapter}-{verse}",
            "lesson": lesson,
            "ref": {lang: ref_label(book, chapter, verse, lang) for lang in BOOKS[book]},
            "text": {},
            "source": {},
        }
        for lang, ed in EDITIONS.items():
            c, v = chapter, verse
            if book == 19:
                c, v = PSALM_SHIFT.get((chapter, verse), {}).get(lang, (chapter, verse))
            if book == 20 and (chapter, verse) == (18, 21) and lang == "ru":
                v = 22
            key = (ed["code"], book, c)
            if key not in cache:
                cache[key] = fetch(ed["code"], book, c)
            row = next((x for x in cache[key]["verses"] if x["verse"] == v), None)
            if row is None:
                raise SystemExit(f"missing {ed['code']} {book}:{c}:{v}")
            item["text"][lang] = clean_he(row["text"]) if lang == "he" else clean_tr(row["text"], lang)
            item["source"][lang] = f"{ed['name']}, {ref_label(book, c, v, 'en')}"
        if note:
            item["note"] = note
        items.append(item)
    data = {
        "_meta": {
            "description": "Public-domain Tanakh verses for the literary section.",
            "fetched_from": "https://api.getbible.net/v2",
            "editions": EDITIONS,
            "lessons": LESSON_TITLES,
            "notes": "Cantillation, meteg, paseq and sof pasuq removed from the Hebrew; vowels, maqaf and the combining grapheme joiner of יְרוּשָׁלָ͏ִם kept. "
            "Ukrainian stress marks and bracketed Synodal additions removed.",
        },
        "verses": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {len(items)} verses to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
