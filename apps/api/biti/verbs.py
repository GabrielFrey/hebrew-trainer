"""Small Modern Hebrew verb tables for the explorer and conjugation drills."""

from __future__ import annotations

from biti.hebrew import strip_niqqud

BINYANIM = ("paal", "nifal", "piel", "pual", "hifil", "hufal", "hitpael")

PERSONS = {
    "ms": {"en": "he / m.sg", "ru": "он / м.ед", "he": "הוּא"},
    "fs": {"en": "she / f.sg", "ru": "она / ж.ед", "he": "הִיא"},
    "mp": {"en": "they / m.pl", "ru": "они / м.мн", "he": "הֵם"},
    "fp": {"en": "they / f.pl", "ru": "они / ж.мн", "he": "הֵן"},
}

# Strong-root Pa'al present templates (letters only; niqqud in pointed forms).
PARADIGMS: list[dict] = [
    {
        "root": "כתב",
        "gloss": {"en": "write", "ru": "писать", "he": "לכתוב"},
        "binyan": "paal",
        "pattern": "strong",
        "infinitive": "לכתוב",
        "infinitive_pointed": "לִכְתּוֹב",
        "present": {
            "ms": {"plain": "כותב", "pointed": "כּוֹתֵב"},
            "fs": {"plain": "כותבת", "pointed": "כּוֹתֶבֶת"},
            "mp": {"plain": "כותבים", "pointed": "כּוֹתְבִים"},
            "fp": {"plain": "כותבות", "pointed": "כּוֹתְבוֹת"},
        },
        "past_3ms": {"plain": "כתב", "pointed": "כָּתַב"},
        "future_3ms": {"plain": "יכתוב", "pointed": "יִכְתּוֹב"},
    },
    {
        "root": "למד",
        "gloss": {"en": "learn / study", "ru": "учить", "he": "ללמוד"},
        "binyan": "paal",
        "pattern": "strong",
        "infinitive": "ללמוד",
        "infinitive_pointed": "לִלְמוֹד",
        "present": {
            "ms": {"plain": "לומד", "pointed": "לוֹמֵד"},
            "fs": {"plain": "לומדת", "pointed": "לוֹמֶדֶת"},
            "mp": {"plain": "לומדים", "pointed": "לוֹמְדִים"},
            "fp": {"plain": "לומדות", "pointed": "לוֹמְדוֹת"},
        },
        "past_3ms": {"plain": "למד", "pointed": "לָמַד"},
        "future_3ms": {"plain": "ילמד", "pointed": "יִלְמַד"},
    },
    {
        "root": "דבר",
        "gloss": {"en": "speak", "ru": "говорить", "he": "לדבר"},
        "binyan": "piel",
        "pattern": "strong",
        "infinitive": "לדבר",
        "infinitive_pointed": "לְדַבֵּר",
        "present": {
            "ms": {"plain": "מדבר", "pointed": "מְדַבֵּר"},
            "fs": {"plain": "מדברת", "pointed": "מְדַבֶּרֶת"},
            "mp": {"plain": "מדברים", "pointed": "מְדַבְּרִים"},
            "fp": {"plain": "מדברות", "pointed": "מְדַבְּרוֹת"},
        },
        "past_3ms": {"plain": "דיבר", "pointed": "דִּבֵּר"},
        "future_3ms": {"plain": "ידבר", "pointed": "יְדַבֵּר"},
    },
    {
        "root": "כנס",
        "gloss": {"en": "enter", "ru": "входить", "he": "להיכנס"},
        "binyan": "nifal",
        "pattern": "strong",
        "infinitive": "להיכנס",
        "infinitive_pointed": "לְהִכָּנֵס",
        "present": {
            "ms": {"plain": "נכנס", "pointed": "נִכְנָס"},
            "fs": {"plain": "נכנסת", "pointed": "נִכְנֶסֶת"},
            "mp": {"plain": "נכנסים", "pointed": "נִכְנָסִים"},
            "fp": {"plain": "נכנסות", "pointed": "נִכְנָסוֹת"},
        },
        "past_3ms": {"plain": "נכנס", "pointed": "נִכְנַס"},
        "future_3ms": {"plain": "ייכנס", "pointed": "יִכָּנֵס"},
    },
    {
        "root": "כנס",
        "id": "hifil-kns",
        "gloss": {"en": "bring in", "ru": "вносить", "he": "להכניס"},
        "binyan": "hifil",
        "pattern": "strong",
        "infinitive": "להכניס",
        "infinitive_pointed": "לְהַכְנִיס",
        "present": {
            "ms": {"plain": "מכניס", "pointed": "מַכְנִיס"},
            "fs": {"plain": "מכניסה", "pointed": "מַכְנִיסָה"},
            "mp": {"plain": "מכניסים", "pointed": "מַכְנִיסִים"},
            "fp": {"plain": "מכניסות", "pointed": "מַכְנִיסוֹת"},
        },
        "past_3ms": {"plain": "הכניס", "pointed": "הִכְנִיס"},
        "future_3ms": {"plain": "יכניס", "pointed": "יַכְנִיס"},
    },
    {
        "root": "שבר",
        "gloss": {"en": "be broken (passive)", "ru": "быть разбитым", "he": "לשבור / פֻּעַל"},
        "binyan": "pual",
        "pattern": "strong",
        "infinitive": "—",
        "infinitive_pointed": "—",
        "present": {
            "ms": {"plain": "משבר", "pointed": "מְשֻׁבָּר"},
            "fs": {"plain": "משברת", "pointed": "מְשֻׁבֶּרֶת"},
            "mp": {"plain": "משברים", "pointed": "מְשֻׁבָּרִים"},
            "fp": {"plain": "משברות", "pointed": "מְשֻׁבָּרוֹת"},
        },
        "past_3ms": {"plain": "שובר", "pointed": "שֻׁבַּר"},
        "future_3ms": {"plain": "ישבר", "pointed": "יְשֻׁבַּר"},
    },
    {
        "root": "כנס",
        "id": "hufal-kns",
        "gloss": {"en": "be brought in", "ru": "быть внесенным", "he": "הופעל"},
        "binyan": "hufal",
        "pattern": "strong",
        "infinitive": "—",
        "infinitive_pointed": "—",
        "present": {
            "ms": {"plain": "מוכנס", "pointed": "מֻכְנָס"},
            "fs": {"plain": "מוכנסת", "pointed": "מֻכְנֶסֶת"},
            "mp": {"plain": "מוכנסים", "pointed": "מֻכְנָסִים"},
            "fp": {"plain": "מוכנסות", "pointed": "מֻכְנָסוֹת"},
        },
        "past_3ms": {"plain": "הוכנס", "pointed": "הֻכְנַס"},
        "future_3ms": {"plain": "יוכנס", "pointed": "יֻכְנַס"},
    },
    {
        "root": "לבש",
        "gloss": {"en": "get dressed", "ru": "одеваться", "he": "להתלבש"},
        "binyan": "hitpael",
        "pattern": "strong",
        "infinitive": "להתלבש",
        "infinitive_pointed": "לְהִתְלַבֵּשׁ",
        "present": {
            "ms": {"plain": "מתלבש", "pointed": "מִתְלַבֵּשׁ"},
            "fs": {"plain": "מתלבשת", "pointed": "מִתְלַבֶּשֶׁת"},
            "mp": {"plain": "מתלבשים", "pointed": "מִתְלַבְּשִׁים"},
            "fp": {"plain": "מתלבשות", "pointed": "מִתְלַבְּשׁוֹת"},
        },
        "past_3ms": {"plain": "התלבש", "pointed": "הִתְלַבֵּשׁ"},
        "future_3ms": {"plain": "יתלבש", "pointed": "יִתְלַבֵּשׁ"},
    },
]


def list_paradigms() -> list[dict]:
    return PARADIGMS


def find_paradigm(root: str) -> list[dict]:
    letters = strip_niqqud(root)
    return [p for p in PARADIGMS if p["root"] == letters]
