"""Add Bet (elementary) and Gimel (intermediate) stages to the mobile offline catalog.

Source: the hand-verified "gold layer" of the main-branch app «Иврит с нуля»
(data/hebrew.json on branch main, mirrored at legacy/ivrit-s-nulya/data/hebrew.json):
words of level "basic" -> Bet, level "intermediate" -> Gimel, plus the matching phrases.
Latin transliteration comes from legacy/ivrit-s-nulya/data/lexicon/words-*.json (same ids).
No Hebrew or ru/en text is invented here. uk/es/fr come from content/l10n/bet-gimel.json
(machine-assisted drafts, l10n_status "machine" until a native speaker signs them).
Idempotent: re-running replaces previously generated Bet/Gimel rows and placement.
"""
from __future__ import annotations

import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOLD = ROOT / "legacy/ivrit-s-nulya/data/hebrew.json"
LEX = ROOT / "legacy/ivrit-s-nulya/data/lexicon"
L10N = ROOT / "content/l10n/bet-gimel.json"
OUT = ROOT / "apps/mobile/content/published.json"
DRAFT = ("uk", "es", "fr")
STATUS = {"en": "approved", "ru": "approved", "he": "approved", "uk": "machine", "es": "machine", "fr": "machine"}
TR = json.loads(L10N.read_text(encoding="utf-8"))


def loc(en: str, ru: str, he: str | None = None, draft: list[str] | None = None) -> dict:
    if draft is None or len(draft) != len(DRAFT):
        raise ValueError(f"missing uk/es/fr for {en!r}")
    row = {"en": en, "ru": ru}
    if he:
        row["he"] = he
    row.update(dict(zip(DRAFT, draft)))
    return row


def gloss(w: dict) -> list[str]:
    table = TR["phrases"] if w["id"].startswith("ph-") else TR["words"]
    return table[w["id"]]


def fill(template: str, **values: str) -> str:
    return template.format(**values)


def tpl(key: str, **values: str) -> list[str]:
    return [fill(t, **values) for t in TR["templates"][key]]


def tpl_g(key: str, w: dict) -> list[str]:
    return [fill(t, g=g) for t, g in zip(TR["templates"][key], gloss(w))]


def choice(w: dict) -> dict:
    return {"id": w["id"], **loc(w["en"], w["ru"], draft=gloss(w))}


def vocab_row(w: dict, lat: dict) -> dict:
    root = (w.get("root") or "").replace("־", "") or None
    uk, es, fr = gloss(w)
    return {
        "lemma": w["hebrew"], "pointed": w["nikud"], "unpointed": w["hebrew"],
        "translit": lat.get(w["id"], ""), "ru": w["ru"], "en": w["en"],
        "gender": None, "number": "sg", "root": root, "binyan": None, "audio": None,
        "uk": uk, "es": es, "fr": fr, "l10n_status": dict(STATUS),
        "source": "main:data/hebrew.json#" + w["id"],
    }


def word_exercises(words: list[dict], pool: list[dict], slug: str) -> list[dict]:
    ex: list[dict] = []
    n = len(words)
    for i, w in enumerate(words[:3]):
        others = [o for o in pool if o["id"] != w["id"] and o["en"] != w["en"]]
        picks = [others[(i * 3 + k) % len(others)] for k in range(3)]
        opts = [w] + picks
        opts = opts[i % 4:] + opts[: i % 4]
        ex.append({
            "id": f"mean-{i + 1}", "type": "mc",
            "prompt": loc(f"What does {w['hebrew']} mean?", f"Что значит {w['hebrew']}?", w["nikud"], tpl("mean", he=w["hebrew"])),
            "choices": [choice(o) for o in opts],
            "accepted": [w["id"]], "mode": "relaxed", "xp": 10,
        })
    for i, w in enumerate(words[3:6]):
        ex.append({
            "id": f"type-{i + 1}", "type": "type_he",
            "prompt": loc(f"Type: {w['en']}", f"Наберите: {w['ru']}", draft=tpl_g("type", w)),
            "accepted": [w["hebrew"], w["nikud"]], "mode": "relaxed", "xp": 10, "keyboard": True,
        })
    pair = words[-4:] if n >= 4 else words
    by: dict[str, dict[str, str]] = {"en": {}, "ru": {}, **{lang: {} for lang in DRAFT}}
    for p in pair:
        by["en"][p["hebrew"]] = p["en"]
        by["ru"][p["hebrew"]] = p["ru"]
        for lang, text in zip(DRAFT, gloss(p)):
            by[lang][p["hebrew"]] = text
    ex.append({
        "id": "match-1", "type": "match_tap",
        "prompt": loc("Match the pair", "Сопоставьте пару", "התאימו", TR["templates"]["match"]),
        "left": list(by["en"].keys()), "right": list(by["en"].values()), "pairs": by["en"],
        "pairs_by_lang": by, "xp": 10,
    })
    roots = [w for w in words if w.get("root")]
    if roots:
        w = roots[0]
        all_roots = sorted({o["root"].replace("־", "") for o in pool if o.get("root")})
        r = w["root"].replace("־", "")
        wrong = [x for x in all_roots if x != r][:2]
        ex.append({
            "id": "root-1", "type": "identify_root",
            "prompt": loc(f"Root of {w['hebrew']}", f"Корень {w['hebrew']}", f"השורש של {w['hebrew']}", tpl("root", he=w["hebrew"])),
            "choices": [{"id": x, "he": x} for x in sorted([r, *wrong])],
            "accepted": [r], "mode": "strict_root", "xp": 10,
        })
    return ex


def phrase_exercises(phrases: list[dict]) -> list[dict]:
    ex = []
    for i, p in enumerate(phrases):
        tokens = re.sub(r"[.,!?־—]", " ", p["hebrew"]).split()
        ex.append({
            "id": f"order-{i + 1}", "type": "order_rtl",
            "prompt": loc(f"Build: {p['en']}", f"Соберите: {p['ru']}", draft=tpl_g("build", p)),
            "tokens": tokens, "accepted": tokens, "mode": "relaxed", "xp": 10,
        })
    return ex[:10]


STAGES = {
    "elementary": {
        "src": "basic", "cefr": "A2", "prefix": "bet", "sort": 60,
        "groups": [("food", 2, "Food", "Еда"), ("numbers", 2, "Numbers", "Числа"),
                   ("family", 2, "Family", "Семья"), ("verbs-present", 2, "Verbs: present", "Глаголы: настоящее время")],
        "track": {"food": "vocabulary", "numbers": "vocabulary", "family": "vocabulary", "verbs-present": "verbs"},
        "phrases_title": ("Bet sentences", "Фразы уровня бет"),
    },
    "intermediate": {
        "src": "intermediate", "cefr": "B1", "prefix": "gimel", "sort": 70,
        "groups": [("daily", 3, "Daily life", "Повседневная жизнь"), ("verbs-past", 2, "Verbs: past", "Глаголы: прошедшее время"),
                   ("verbs-future", 2, "Verbs: future", "Глаголы: будущее время")],
        "track": {"daily": "vocabulary", "verbs-past": "verbs", "verbs-future": "verbs"},
        "phrases_title": ("Gimel dialogues", "Диалоги уровня гимель"),
    },
}

GATE_META = {
    "elementary": ("Bet gate", "Врата бета", "Mixed review of Bet vocabulary and verbs.", "Смешанная проверка уровня бет.", "Pass at 80% to open Gimel.", "80% открывают гимель."),
    "intermediate": ("Gimel gate", "Врата гимеля", "Mixed review of Gimel vocabulary and verbs.", "Смешанная проверка уровня гимель.", "Pass at 80% to open Dalet.", "80% открывают далет."),
}


def lesson(slug, level, cefr, track, title, objective, vocab, exercises, prereq, sort, kind="lesson", unit=None):
    return {
        "slug": slug, "track": track, "level": level, "cefr": cefr, "kind": kind, "prerequisites": prereq,
        "title": title, "objective": objective, "explanation": objective, "vocabulary": vocab,
        "exercises": exercises, "threshold": 0.8, "sort": sort, "unit_id": unit, "skill_id": "legendary" if kind != "lesson" else None,
        "status": "published", "source": "main:data/hebrew.json",
    }


def numbered(titles: list[str], p: int) -> list[str]:
    return [f"{t} · {p}" for t in titles]


def learn_objective(chunk: list[dict]) -> list[str]:
    out = []
    for i, template in enumerate(TR["templates"]["learn"]):
        names = ", ".join(gloss(w)[i] for w in chunk[:3])
        out.append(fill(template, n=str(len(chunk)), list=names))
    return out


def main() -> None:
    gold = json.loads(GOLD.read_text())
    lat: dict[str, str] = {}
    for f in sorted(glob.glob(str(LEX / "words-*.json"))):
        for w in json.loads(Path(f).read_text())["words"]:
            lat.setdefault(w["id"], w["transcription"])
    cat = json.loads(OUT.read_text())
    cat["lessons"] = [l for l in cat["lessons"] if l["level"] not in STAGES]
    prev = [l["slug"] for l in cat["lessons"] if l["level"] == "beginner" and l["kind"] == "lesson"][-1]
    new: list[dict] = []
    stage_words: dict[str, list[dict]] = {}
    for level, cfg in STAGES.items():
        words = [w for w in gold["words"] if w["level"] == cfg["src"]]
        stage_words[level] = words
        sort = cfg["sort"]
        stage_lessons = []
        for deck, parts, en, ru in cfg["groups"]:
            dw = [w for w in words if w["deck"] == deck]
            size = -(-len(dw) // parts)
            for p in range(parts):
                chunk = dw[p * size:(p + 1) * size]
                slug = f"{cfg['prefix']}-{deck}-{p + 1}"
                title = loc(f"{en} · {p + 1}", f"{ru} · {p + 1}", draft=numbered(TR["titles"][deck], p + 1))
                obj = loc(f"Learn {len(chunk)} words: {', '.join(w['en'] for w in chunk[:3])}…",
                          f"Выучите {len(chunk)} слов: {', '.join(w['ru'] for w in chunk[:3])}…",
                          draft=learn_objective(chunk))
                row = lesson(slug, level, cfg["cefr"], cfg["track"][deck], title, obj,
                             [vocab_row(w, lat) for w in chunk], word_exercises(chunk, dw, slug), [prev], sort)
                stage_lessons.append(row); prev = slug; sort += 1
        phrases = [p for p in gold["phrases"] if p["level"] == cfg["src"]]
        slug = f"{cfg['prefix']}-phrases"
        pt = cfg["phrases_title"]
        stage_lessons.append(lesson(slug, level, cfg["cefr"], "conversation", loc(pt[0], pt[1], draft=TR["titles"][f"{level}-phrases"]),
                                    loc("Put whole sentences together.", "Собирайте целые фразы.", draft=TR["templates"]["phrases"]), [],
                                    phrase_exercises(phrases), [prev], sort))
        prev = slug
        # checkpoint: one exercise from each lesson, round-robin, max 8, no speak/listen
        mix = []
        k = 0
        while len(mix) < 8 and k < 12:
            for l in stage_lessons:
                if k < len(l["exercises"]) and len(mix) < 8:
                    e = dict(l["exercises"][k]); e["id"] = f"cp-{level}-{l['slug']}-{e['id']}"; mix.append(e)
            k += 1
        g = GATE_META[level]
        gt = TR["gates"][level]
        gate_slug = cat["checkpointSlugs"][level]
        stage_lessons.append(lesson(gate_slug, level, cfg["cefr"], "grammar", loc(g[0], g[1], draft=gt["title"]),
                                    loc(g[2], g[3], draft=gt["objective"]), [], mix, [],
                                    sort + 1, kind="checkpoint", unit=f"{cfg['prefix']}-boss"))
        stage_lessons[-1]["explanation"] = loc(g[4], g[5], draft=gt["explanation"])
        new += stage_lessons
    cat["lessons"] += new
    if "checkpoint" not in cat["gateKinds"]:
        cat["gateKinds"] = ["boss", "checkpoint", "legendary"]

    # Graded placement: 4 starter + 4 beginner (from published lessons) + 5 Bet + 5 Gimel (gold layer).
    items = [i for i in cat["placement"]["items"] if i["id"] in ("p1", "p2", "p3")]
    accepted = {k: cat["placement"]["accepted"][k] for k in ("p1", "p2", "p3")}
    def from_lesson(pid, slug, exid, level):
        les = next(l for l in cat["lessons"] if l["slug"] == slug)
        e = next(x for x in les["exercises"] if x["id"] == exid)
        items.append({"id": pid, "prompt": e["prompt"], "level": level}); accepted[pid] = e["accepted"]
    from_lesson("p4", "words-yes-no", "y3", "starter")
    from_lesson("p5", "tiles-greetings", "t2", "starter")
    from_lesson("p6", "words-ima-aba", "f4", "starter")
    from_lesson("p7", "grammar-pronouns", "she", "beginner")
    from_lesson("p8", "vocab-home", "type-2", "beginner")
    picks = {"elementary": ["lekhem", "shalosh", "savta", "lomed", "kone"],
             "intermediate": ["katavti", "halakhti", "elmad", "ekhtov", "makhar"]}
    n = 9
    for level, ids in picks.items():
        for wid in ids:
            w = next(x for x in stage_words[level] if x["id"] == wid)
            pid = f"p{n}"; n += 1
            items.append({"id": pid, "prompt": loc(f"Type in Hebrew: {w['en']}", f"Наберите на иврите: {w['ru']}", draft=tpl_g("typeHe", w)),
                          "level": level, "l10n_status": dict(STATUS)})
            accepted[pid] = [w["hebrew"], w["nikud"]]
    for it in items:
        if it["id"] == "p3":
            it["level"] = "beginner"
    cat["placement"] = {"skippable": True, "items": items, "accepted": accepted,
                        "levels": {i["id"]: i["level"] for i in items},
                        "maxLevel": "intermediate", "passRatio": 0.75}
    OUT.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n")
    print({lvl: sum(1 for l in cat["lessons"] if l["level"] == lvl) for lvl in ["starter", "beginner", *STAGES]}, len(items))


if __name__ == "__main__":
    main()
