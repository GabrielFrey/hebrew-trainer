"""Five Hebrew courses, one per source language. Target is always Modern Israeli Hebrew."""

from __future__ import annotations

from typing import Any

SOURCE_LANGS = ("ru", "uk", "en", "es", "fr")
UI_LANGS = (*SOURCE_LANGS, "he")

COURSES: list[dict[str, Any]] = [
    {
        "id": "he-ru",
        "source": "ru",
        "target": "he",
        "pair": "Hebrew↔Russian",
        "title": {
            "en": "Hebrew for Russian speakers",
            "ru": "Иврит для говорящих по-русски",
            "uk": "Іврит для російськомовних",
            "es": "Hebreo para hablantes de ruso",
            "fr": "Hébreu pour russophones",
            "he": "עברית לדוברי רוסית",
        },
    },
    {
        "id": "he-uk",
        "source": "uk",
        "target": "he",
        "pair": "Hebrew↔Ukrainian",
        "title": {
            "en": "Hebrew for Ukrainian speakers",
            "ru": "Иврит для говорящих по-украински",
            "uk": "Іврит для україномовних",
            "es": "Hebreo para hablantes de ucraniano",
            "fr": "Hébreu pour ukrainophones",
            "he": "עברית לדוברי אוקראינית",
        },
    },
    {
        "id": "he-en",
        "source": "en",
        "target": "he",
        "pair": "Hebrew↔English",
        "title": {
            "en": "Hebrew for English speakers",
            "ru": "Иврит для говорящих по-английски",
            "uk": "Іврит для англомовних",
            "es": "Hebreo para hablantes de inglés",
            "fr": "Hébreu pour anglophones",
            "he": "עברית לדוברי אנגלית",
        },
    },
    {
        "id": "he-es",
        "source": "es",
        "target": "he",
        "pair": "Hebrew↔Spanish",
        "title": {
            "en": "Hebrew for Spanish speakers",
            "ru": "Иврит для говорящих по-испански",
            "uk": "Іврит для іспаномовних",
            "es": "Hebreo para hispanohablantes",
            "fr": "Hébreu pour hispanophones",
            "he": "עברית לדוברי ספרדית",
        },
    },
    {
        "id": "he-fr",
        "source": "fr",
        "target": "he",
        "pair": "Hebrew↔French",
        "title": {
            "en": "Hebrew for French speakers",
            "ru": "Иврит для говорящих по-французски",
            "uk": "Іврит для франкомовних",
            "es": "Hebreo para hablantes de francés",
            "fr": "Hébreu pour francophones",
            "he": "עברית לדוברי צרפתית",
        },
    },
]

COURSE_BY_ID = {c["id"]: c for c in COURSES}
COURSE_BY_SOURCE = {c["source"]: c for c in COURSES}

# Product UI copy in en/ru was authored with the curriculum. uk/es/fr strings in this
# repo are real drafts awaiting a native reviewer — never treated as silently approved.
L10N_STATUS = {
    "en": "approved",
    "ru": "approved",
    "he": "approved",
    "uk": "in_review",
    "es": "in_review",
    "fr": "in_review",
}


def course_or_default(course_id: str | None) -> dict[str, Any]:
    return COURSE_BY_ID.get(course_id or "", COURSE_BY_SOURCE["ru"])


def source_lang(course_id: str | None) -> str:
    return course_or_default(course_id)["source"]
