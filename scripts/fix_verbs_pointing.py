"""Repair niqqud in apps/mobile/content/verbs.json by grammar rule (idempotent).

1. Pi'el, pu'al and hitpa'el double the middle root letter: it takes dagesh forte
   unless it is a guttural or resh (א ה ח ע ר).
2. Pu'al present (מְ + R1): R1 follows a vocal shva, so it takes no dagesh lene.
3. A word-initial ב ג ד כ פ ת always takes dagesh lene in citation forms.
4. Final letter forms (ך ם ן ף ץ) appear only at the end of a word, and a bare word-final
   ך takes a shva (ךְ). Roots stored with a final letter had leaked ם/ן/ץ mid-word.
5. Paradigms whose pointing is wrong beyond rule repair are removed instead of guessed:
   garbled engine output, pi'el with resh as middle radical (needs compensatory lengthening),
   and hof'al of hollow / pe-yod roots.

Rule 4 also applies to plain forms; rules 1-3 only touch pointed forms.
"""
from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERBS = ROOT / "apps/mobile/content/verbs.json"

DAGESH = "\u05BC"
GUTTURAL = set("אהחער")
BEGADKEFAT = set("בגדכפת")
FINALS = str.maketrans("ךםןףץ", "כמנפצ")
DOUBLED = {"piel", "pual", "hitpael"}
TO_FINAL = dict(zip("כמנפצ", "ךםןףץ"))
FROM_FINAL = dict(zip("ךםןףץ", "כמנפצ"))
SHVA = "\u05B0"
GARBLED = {"hishtamesh", "histakel", "tziyer", "sirev", "birekh", "hukhan", "hutzag"}


def letters(word: str) -> list[int]:
    return [i for i, ch in enumerate(word) if "\u05D0" <= ch <= "\u05EA"]


def cluster_end(word: str, i: int) -> int:
    j = i + 1
    while j < len(word) and unicodedata.combining(word[j]):
        j += 1
    return j


def has_dagesh(word: str, i: int) -> bool:
    return DAGESH in word[i + 1 : cluster_end(word, i)]


def add_dagesh(word: str, i: int) -> str:
    if has_dagesh(word, i):
        return word
    end = cluster_end(word, i)
    return unicodedata.normalize("NFC", word[: i + 1] + DAGESH + word[i + 1 : end]) + word[end:]


def drop_dagesh(word: str, i: int) -> str:
    end = cluster_end(word, i)
    return word[: i + 1] + word[i + 1 : end].replace(DAGESH, "") + word[end:]


def middle_radical(word: str, root: str) -> int | None:
    """Index (in `word`) of the second root letter, or None if the root cannot be located."""
    pos = letters(word)
    skel = "".join(word[i] for i in pos).translate(FINALS)
    r1, r2, r3 = root.translate(FINALS)
    for k in range(len(skel) - 2, 0, -1):
        if skel[k] == r2 and skel[k + 1] == r3 and (skel[k - 1] == r1 or (k >= 2 and skel[k - 2] == r1)):
            return pos[k]
    return None


def fix_finals(word: str, pointed: bool = True) -> str:
    chars = list(word)
    pos = letters(word)
    for n, i in enumerate(pos):
        nxt = pos[n + 1] if n + 1 < len(pos) else None
        word_end = nxt is None or " " in word[i:nxt] or "\u05BE" in word[i:nxt]
        if not word_end and chars[i] in FROM_FINAL:
            chars[i] = FROM_FINAL[chars[i]]
        elif word_end and chars[i] in TO_FINAL:
            chars[i] = TO_FINAL[chars[i]]
    out = "".join(chars)
    if pointed and out.endswith("ך"):
        out += SHVA
    return out


def fix_form(form: str, root: str, binyan: str, tense: str) -> str:
    out = fix_finals(form)
    pos = letters(out)
    if pos and out[pos[0]] in BEGADKEFAT:
        out = add_dagesh(out, pos[0])
    if binyan in DOUBLED and len(root) == 3:
        k = middle_radical(out, root)
        if k is not None and out[k] not in GUTTURAL:
            out = add_dagesh(out, k)
    if binyan == "pual" and tense == "present":
        pos = letters(out)
        if len(pos) > 1 and out[pos[0]] == "מ":
            out = drop_dagesh(out, pos[1])
    return out


def main() -> int:
    data = json.loads(VERBS.read_text(encoding="utf-8"))
    changes: list[tuple[str, str, str]] = []
    kept = []
    for p in data["paradigms"]:
        if p.get("id") in GARBLED:
            changes.append((p.get("id"), "removed", p.get("infinitive_pointed", "")))
            continue
        root, binyan = p["root"], p["binyan"]

        def fix(holder: dict, key: str, tense: str) -> None:
            before = holder.get(key)
            if not before:
                return
            after = fix_form(before, root, binyan, tense)
            if after != before:
                holder[key] = after
                changes.append((p.get("id") or root, before, after))

        def fix_plain(holder: dict, key: str) -> None:
            before = holder.get(key)
            if before and fix_finals(before, pointed=False) != before:
                holder[key] = fix_finals(before, pointed=False)
                changes.append((p.get("id") or root, before, holder[key]))

        fix(p, "infinitive_pointed", "infinitive")
        fix_plain(p, "infinitive")
        for tense in ("present", "past", "future"):
            for forms in (p.get(tense) or {}).values():
                fix(forms, "pointed", tense)
                fix_plain(forms, "plain")
        for key, tense in (("past_3ms", "past"), ("future_3ms", "future")):
            if isinstance(p.get(key), dict):
                fix(p[key], "pointed", tense)
                fix_plain(p[key], "plain")
        kept.append(p)
    data["paradigms"] = kept
    data["meta"]["count"] = len(kept)
    data["meta"]["pointing"] = (
        "Niqqud repaired by scripts/fix_verbs_pointing.py: dagesh forte in the middle radical of "
        "pi'el/pu'al/hitpa'el, dagesh lene word-initially, no dagesh after pu'al מְ. "
        f"Removed garbled paradigms: {', '.join(sorted(GARBLED))}."
    )
    VERBS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for row in changes:
        print(*row, sep="\t")
    print(f"{len(changes)} changes, {len(kept)} paradigms", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
