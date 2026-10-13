#!/usr/bin/env python3
"""Собирает живой сленг и диалоги, чинит примеры и латинскую транскрипцию слов."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from romanize_he import romanize, strip_nikud  # noqa: E402
from content.dialogues import DIALOGUES  # noqa: E402
from content.gold_examples import GOLD  # noqa: E402

LEVELS = ["elementary", "basic", "intermediate", "advanced", "expert"]
CYR = re.compile(r"[\u0400-\u04FF]")
NIKUD = re.compile(r"[\u0591-\u05C7]")
BLANK = {"nikud": "", "hebrew": "", "transcription": "", "ru": "", "en": ""}
FUNCTION_POS = {"particle", "preposition", "conjunction", "pronoun", "question"}


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return (s[:36] or "x")


def first_sense(text: str) -> str:
    return re.split(r"\s*(?:/|;)\s*", str(text).strip())[0].strip()


def cap(text: str) -> str:
    s = str(text).strip()
    if not s:
        return s
    body = s[0].upper() + s[1:]
    return body if re.search(r"[.!?…]$", body) else f"{body}."


def empty_example() -> dict:
    return dict(BLANK)


def make_example(nikud: str, ru: str, en: str) -> dict:
    nikud = nikud.strip()
    if nikud and nikud[-1] not in ".!?…":
        nikud = nikud + "."
    he = strip_nikud(nikud)
    return {
        "nikud": nikud,
        "hebrew": he,
        "transcription": romanize(nikud),
        "ru": cap(ru),
        "en": cap(en),
    }


def lemma_key(text: str) -> str:
    return re.sub(r"[.,!?;:\"'«»()[\]]+", "", strip_nikud(text or "")).replace(" ", "").strip()


def repeats_lemma(lemma: str, example: str) -> bool:
    a, b = lemma_key(lemma), lemma_key(example)
    return bool(a and b and a == b)


def load_tsv(path: Path) -> list[list[str]]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.rstrip("\n")
        if not line.strip() or "WAIT" in line:
            continue
        parts = line.split("\t")
        if len(parts) < 10:
            print(f"skip short row in {path.name}: {line[:80]}", file=sys.stderr)
            continue
        rows.append(parts[:10])
    return rows


def hash_pick(key: str, choices: list):
    n = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return choices[n % len(choices)]


def word_example(word: dict) -> dict:
    gold = GOLD.get(word["id"])
    if gold:
        nikud, ru, en = gold
        built = make_example(nikud, ru, en)
        if not repeats_lemma(word["hebrew"], built["hebrew"]) and not repeats_lemma(
            word["nikud"], built["nikud"]
        ):
            return built

    pos = word.get("pos") or ""
    he = word.get("hebrew") or ""
    ni = word.get("nikud") or ""
    ru = first_sense(word.get("ru") or "")
    en = first_sense(word.get("en") or "")
    theme = word.get("theme") or ""

    if pos in FUNCTION_POS:
        return empty_example()
    if he.startswith("ש") and pos != "noun":
        return empty_example()
    if he.startswith("ו") and pos != "noun":
        return empty_example()

    if pos == "verb":
        if he.endswith("תי") or ni.endswith("תִּי") or ni.endswith("תִי"):
            return make_example(f"{ni} אֶתְמוֹל בַּבֹּקֶר", f"Вчера утром: {ru}", f"Yesterday morning: {en}")
        if he.startswith("א") and len(he) <= 6:
            return make_example(f"{ni} מָחָר", f"Завтра: {ru}", f"Tomorrow: {en}")
        return make_example(f"הוּא {ni} עַכְשָׁו", f"Он сейчас: {ru}", f"He is now: {en}")

    if pos == "numeral":
        return make_example(f"יֵשׁ לִי {ni}", f"У меня {ru}.", f"I have {en}.")
    if pos == "adjective":
        return make_example(f"הַיּוֹם {ni}", f"Сегодня {ru}.", f"Today it's {en}.")
    if pos == "adverb":
        return make_example(f"הוּא בָּא {ni}", f"Он приходит {ru}.", f"He comes {en}.")
    if pos == "idiom" or pos == "expression":
        return make_example(f"{ni} — כָּכָה אוֹמְרִים", f"Так говорят: {ru}.", f"That's how people say {en}.")

    if pos != "noun":
        return empty_example()

    if theme == "food":
        return make_example(f"אֲנִי אוֹכֵל {ni} הַיּוֹם", f"Сегодня я ем: {ru}.", f"Today I'm eating {en}.")
    if theme == "family":
        return make_example(f"{ni} שֶׁלִּי בַּבַּיִת", f"Мой/моя {ru} дома.", f"My {en} is at home.")
    if theme == "body":
        return make_example(f"כּוֹאֵב לִי הַ{ni}" if not ni.startswith("הַ") else f"כּוֹאֵב לִי {ni}", f"У меня болит: {ru}.", f"My {en} hurts.")
    if theme == "home":
        return make_example(f"{ni} בַּבַּיִת", f"Дома есть {ru}.", f"There's {en} at home.")
    if theme in {"time", "numbers"}:
        return make_example(f"חִכִּיתִי {ni}", f"Я ждал: {ru}.", f"I waited {en}.")

    frame = hash_pick(
        word["id"],
        [
            (f"דִּבַּרְנוּ עַל {ni} אֶתְמוֹל", f"Вчера мы говорили о: {ru}.", f"Yesterday we talked about {en}."),
            (f"שָׁמַעְתִּי עַל {ni}", f"Я слышал о: {ru}.", f"I heard about {en}."),
            (f"אֲנִי חוֹשֵׁב עַל {ni}", f"Я думаю о: {ru}.", f"I'm thinking about {en}."),
        ],
    )
    return make_example(*frame)


def build_slang() -> list[dict]:
    rows = []
    for name in ("slang.tsv", "slang_rest.tsv", "more_slang.tsv"):
        path = ROOT / "scripts" / "content" / name
        rows.extend(load_tsv(path))

    seen_he = set()
    seen_id = set()
    out = []
    for index, parts in enumerate(rows):
        level, hebrew, nikud, ru, en, usage_ru, usage_en, ex_nikud, ex_ru, ex_en = parts
        if level not in LEVELS:
            print(f"bad level {level} for {hebrew}", file=sys.stderr)
            continue
        he = strip_nikud(hebrew or nikud)
        if not he or he in seen_he:
            continue
        if not NIKUD.search(nikud):
            print(f"no nikud: {hebrew}", file=sys.stderr)
            continue
        if lemma_key(ex_nikud) == lemma_key(nikud) or lemma_key(ex_nikud) == lemma_key(he):
            print(f"slang example repeats lemma: {hebrew}", file=sys.stderr)
            continue
        if len(ex_nikud.split()) < 2:
            print(f"slang example too short: {hebrew}", file=sys.stderr)
            continue
        if len(usage_ru.strip()) <= 8 or len(usage_en.strip()) <= 8:
            print(f"usage too short: {hebrew}", file=sys.stderr)
            continue
        tr = romanize(nikud)
        if CYR.search(tr):
            print(f"cyrillic transcription: {hebrew} {tr}", file=sys.stderr)
            continue
        sid = f"slang-{slug(tr)}-{index}"
        if sid in seen_id:
            sid = f"slang-{slug(tr)}-{index}-b"
        if sid.startswith("slang-x"):
            sid = f"slang-z{sid[7:]}"
        seen_he.add(he)
        seen_id.add(sid)
        example = make_example(ex_nikud, ex_ru, ex_en)
        if CYR.search(example["transcription"]):
            print(f"cyrillic example tr: {hebrew}", file=sys.stderr)
            continue
        out.append(
            {
                "id": sid,
                "deck": "slang",
                "level": level,
                "theme": "slang",
                "hebrew": he,
                "nikud": nikud,
                "transcription": tr,
                "ru": ru.strip(),
                "en": en.strip(),
                "pos": "slang",
                "emoji": "💬",
                "example": example,
                "audio": None,
                "usage": {"ru": usage_ru.strip(), "en": usage_en.strip()},
            }
        )
    return out


def fill_line(line: dict) -> dict:
    nikud = line["nikud"]
    tr = romanize(nikud)
    if CYR.search(tr):
        raise SystemExit(f"cyrillic in dialogue: {nikud} -> {tr}")
    return {
        "speaker": line["speaker"],
        "nikud": nikud,
        "hebrew": strip_nikud(nikud),
        "transcription": tr,
        "ru": line["ru"],
        "en": line["en"],
    }


def build_dialogues() -> list[dict]:
    out = []
    seen = set()
    for item in DIALOGUES:
        did = item["id"]
        if did in seen:
            raise SystemExit(f"duplicate dialogue {did}")
        seen.add(did)
        if len(item["lines"]) < 2:
            raise SystemExit(f"short dialogue {did}")
        if sum(1 for r in item["replies"] if r["correct"]) != 1:
            raise SystemExit(f"replies {did}")
        out.append(
            {
                "id": did,
                "level": item["level"],
                "theme": item["theme"],
                "title": item["title"],
                "titleEn": item["titleEn"],
                "lines": [fill_line(line) for line in item["lines"]],
                "replies": item["replies"],
            }
        )
    return out


def repair_words() -> tuple[dict[str, list], dict]:
    by_level = {}
    stats = {"kept": 0, "blank": 0, "gold": 0, "generated": 0, "cyr_fixed": 0}
    for level in LEVELS:
        path = ROOT / "data" / "lexicon" / f"words-{level}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        words = []
        for word in data["words"]:
            old_tr = word.get("transcription") or ""
            word["transcription"] = romanize(word["nikud"])
            if CYR.search(old_tr) or CYR.search(word["transcription"]):
                stats["cyr_fixed"] += 1
            if CYR.search(word["transcription"]):
                raise SystemExit(f"still cyrillic: {word['id']} {word['transcription']}")
            example = word_example(word)
            if example["nikud"]:
                if repeats_lemma(word["hebrew"], example["hebrew"]) or repeats_lemma(
                    word["nikud"], example["nikud"]
                ):
                    example = empty_example()
            if word["id"] in GOLD and example["nikud"]:
                stats["gold"] += 1
            elif example["nikud"]:
                stats["generated"] += 1
            else:
                stats["blank"] += 1
            if CYR.search(example.get("transcription") or ""):
                raise SystemExit(f"example cyrillic {word['id']}")
            word["example"] = example
            words.append(word)
            stats["kept"] += 1
        by_level[level] = words
    return by_level, stats


def main() -> None:
    slang = build_slang()
    dialogues = build_dialogues()
    words_by_level, word_stats = repair_words()

    if not (300 <= len(slang) <= 500):
        raise SystemExit(f"slang count {len(slang)} not in 300–500")
    if not (60 <= len(dialogues) <= 124):
        raise SystemExit(f"dialogue count {len(dialogues)} not in 60–124")

    slang_by = defaultdict(list)
    for item in slang:
        slang_by[item["level"]].append(item)
    dlg_by = defaultdict(list)
    for item in dialogues:
        dlg_by[item["level"]].append(item)

    out_dir = ROOT / "data" / "lexicon"
    for level in LEVELS:
        (out_dir / f"words-{level}.json").write_text(
            json.dumps({"words": words_by_level[level]}, ensure_ascii=False), encoding="utf-8"
        )
        (out_dir / f"slang-{level}.json").write_text(
            json.dumps({"slang": slang_by[level]}, ensure_ascii=False), encoding="utf-8"
        )
        (out_dir / f"dialogues-{level}.json").write_text(
            json.dumps({"dialogues": dlg_by[level]}, ensure_ascii=False), encoding="utf-8"
        )

    catalog_path = out_dir / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    word_n = sum(len(words_by_level[l]) for l in LEVELS)
    catalog["counts"] = {"words": word_n, "slang": len(slang), "dialogues": len(dialogues)}
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False), encoding="utf-8")

    hebrew_path = ROOT / "data" / "hebrew.json"
    hebrew = json.loads(hebrew_path.read_text(encoding="utf-8"))
    hebrew.setdefault("meta", {})
    hebrew["meta"]["transcription"] = "латиница по никуду: h=ה, kh=ח, sh=ש, ts=צ; без кириллицы"
    hebrew_path.write_text(json.dumps(hebrew, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "words": word_n,
                "slang": len(slang),
                "dialogues": len(dialogues),
                "slangByLevel": {l: len(slang_by[l]) for l in LEVELS},
                "dialoguesByLevel": {l: len(dlg_by[l]) for l in LEVELS},
                "wordExamples": word_stats,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
