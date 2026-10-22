"""Hebrew normalization — Python mirror of packages/hebrew-text."""

from __future__ import annotations

import unicodedata
from typing import Literal

NormalizeMode = Literal["relaxed", "strict_niqqud", "strict_finals", "strict_root"]

NIQQUD_RANGE = tuple(chr(c) for c in range(0x0591, 0x05C8))
BIDI_AND_ZW = dict.fromkeys(
    [0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069, 0xFEFF]
)
GERESH = dict.fromkeys(map(ord, "'\u05F3\u2018\u2019\u02BC"), "׳")
GERSHAYIM = dict.fromkeys(map(ord, '"\u05F4\u201C\u201D'), "״")
MAQAF = dict.fromkeys(map(ord, "-\u05BE\u2010\u2011\u2012\u2013\u2014"), "־")
SOFIT_TO_REG = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
REG_TO_SOFIT = {"כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ"}


def strip_bidi_and_zw(text: str) -> str:
    return text.translate(BIDI_AND_ZW)


def strip_niqqud(text: str) -> str:
    return "".join(ch for ch in text if ch not in NIQQUD_RANGE)


def apply_finals(text: str) -> str:
    chars = list(text)
    out: list[str] = []
    for i, ch in enumerate(chars):
        nxt = chars[i + 1] if i + 1 < len(chars) else None
        at_end = nxt is None or nxt.isspace()
        if at_end and ch in REG_TO_SOFIT:
            out.append(REG_TO_SOFIT[ch])
        elif not at_end and ch in SOFIT_TO_REG:
            out.append(SOFIT_TO_REG[ch])
        else:
            out.append(ch)
    return "".join(out)


def normalize_hebrew(raw: str, mode: NormalizeMode = "relaxed", max_len: int = 500) -> str:
    text = unicodedata.normalize("NFC", strip_bidi_and_zw(raw))[:max_len]
    text = text.translate(GERESH).translate(GERSHAYIM).translate(MAQAF)
    if mode != "strict_niqqud":
        text = strip_niqqud(text)
    if mode == "strict_root":
        text = "".join(ch for ch in text if "\u05D0" <= ch <= "\u05EA")
        return apply_finals(text)
    if mode != "strict_finals":
        text = apply_finals(text)
    if mode == "relaxed":
        return " ".join(text.split()).strip().lower()
    return text.strip()


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            ins, delete, sub = prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)
            cur.append(min(ins, delete, sub))
        prev = cur
    return prev[-1]
