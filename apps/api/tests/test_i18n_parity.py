"""Parity of UI dictionaries: keys, placeholders, and plural forms."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
I18N = ROOT / "packages" / "i18n" / "src"
LANGS = ("en", "ru", "uk", "es", "fr", "he")
SLAVIC = {"ru", "uk"}
PLACEHOLDER = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")
PLURAL_LEAF = {"one", "few", "many", "other"}


def _flatten_ts(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    start = text.index("{")
    body = text[start : text.rindex("}") + 1]
    out: dict[str, str] = {}
    stack: list[str] = []
    i = 0
    n = len(body)

    def skip_ws() -> None:
        nonlocal i
        while i < n and body[i] in " \t\n\r,":
            i += 1

    def read_string() -> str:
        nonlocal i
        assert body[i] == '"'
        i += 1
        chars: list[str] = []
        while i < n:
            ch = body[i]
            if ch == "\\":
                nxt = body[i + 1]
                if nxt == "u":
                    chars.append(chr(int(body[i + 2 : i + 6], 16)))
                    i += 6
                    continue
                chars.append({"n": "\n", "t": "\t", '"': '"', "\\": "\\", "'": "'"}.get(nxt, nxt))
                i += 2
                continue
            if ch == '"':
                i += 1
                return "".join(chars)
            chars.append(ch)
            i += 1
        raise ValueError(f"unterminated string in {path}")

    def read_ident() -> str:
        nonlocal i
        m = re.match(r"[A-Za-z_][A-Za-z0-9_]*", body[i:])
        if not m:
            raise ValueError(f"expected ident at {i} in {path}: {body[i : i + 20]!r}")
        ident = m.group(0)
        i += len(ident)
        return ident

    assert body[i] == "{"
    i += 1
    while i < n:
        skip_ws()
        if i >= n:
            break
        if body[i] == "}":
            i += 1
            if stack:
                stack.pop()
            skip_ws()
            continue
        key = read_ident()
        skip_ws()
        assert body[i] == ":", f"{path} {key}"
        i += 1
        skip_ws()
        path_key = ".".join([*stack, key])
        if body[i] == '"':
            out[path_key] = read_string()
        elif body[i] == "{":
            stack.append(key)
            i += 1
        else:
            raise ValueError(f"bad value for {path_key} in {path}")
    return out


def _dicts() -> dict[str, dict[str, str]]:
    return {lang: _flatten_ts(I18N / f"{lang}.ts") for lang in LANGS}


def test_no_missing_keys_across_locales() -> None:
    dicts = _dicts()
    expected = set(dicts["en"])
    for lang in LANGS:
        assert set(dicts[lang]) == expected, sorted(set(dicts[lang]) ^ expected)[:20]


def test_placeholder_sets_match() -> None:
    dicts = _dicts()
    mismatches: list[str] = []
    for key, en_val in dicts["en"].items():
        en_ph = tuple(sorted(PLACEHOLDER.findall(en_val)))
        for lang in LANGS:
            got = tuple(sorted(PLACEHOLDER.findall(dicts[lang][key])))
            if got != en_ph:
                mismatches.append(f"{lang}:{key} {got} != {en_ph}")
    assert mismatches == [], mismatches[:20]


def test_plural_forms_are_valid() -> None:
    dicts = _dicts()
    groups: set[str] = set()
    for key in dicts["en"]:
        if "." in key and key.rsplit(".", 1)[1] in PLURAL_LEAF:
            groups.add(key.rsplit(".", 1)[0])
    assert groups, "expected at least one plural group"
    for group in groups:
        for lang in LANGS:
            for form in ("one", "other"):
                assert f"{group}.{form}" in dicts[lang], f"{lang} missing {group}.{form}"
            if lang in SLAVIC:
                for form in ("few", "many"):
                    assert f"{group}.{form}" in dicts[lang], f"{lang} missing {group}.{form}"
            one = dicts[lang][f"{group}.one"]
            other = dicts[lang][f"{group}.other"]
            assert "{count}" in one, f"{lang} {group}.one missing {{count}}"
            assert "{count}" in other, f"{lang} {group}.other missing {{count}}"
            if lang in SLAVIC:
                assert "{count}" in dicts[lang][f"{group}.few"]
                assert "{count}" in dicts[lang][f"{group}.many"]
            assert one != other


def test_conversation_russian_glosses_are_russian() -> None:
    from biti.seed import _convo_lessons
    from biti.draft_l10n import fill_vocab

    latin = re.compile(r"^[A-Za-z /'().]+$")
    leaked: list[str] = []
    for spec in _convo_lessons():
        for item in spec["vocabulary"]:
            filled = fill_vocab(item)
            ru = filled.get("ru") or ""
            en = filled.get("en") or ""
            if ru == en or (ru and latin.match(ru)):
                leaked.append(f"{spec['slug']}:{en}->{ru}")
            for lang in ("uk", "es", "fr"):
                assert filled.get(lang), f"{spec['slug']} missing {lang} for {en}"
    assert leaked == [], leaked


def test_ukrainian_tagline_agrees_in_gender() -> None:
    uk = (I18N / "uk.ts").read_text(encoding="utf-8")
    assert "Сучасний іврит" in uk
    assert "Сучасна іврит" not in uk


def test_uk_es_fr_l10n_status_stays_in_review() -> None:
    from biti.courses import L10N_STATUS

    for lang in ("uk", "es", "fr"):
        assert L10N_STATUS[lang] == "in_review"
    for lang in ("en", "ru", "he"):
        assert L10N_STATUS[lang] == "approved"
    index = (I18N / "index.ts").read_text(encoding="utf-8")
    assert 'uk: "in_review"' in index
    assert 'es: "in_review"' in index
    assert 'fr: "in_review"' in index


def test_published_lesson_locales_are_filled() -> None:
    from biti.seed import _localize_spec, all_lesson_specs

    missing: list[str] = []
    for spec in all_lesson_specs():
        if spec.get("status") == "planned":
            continue
        loc = _localize_spec(spec)
        for field in ("title", "objective", "explanation"):
            rec = loc.get(field) or {}
            for lang in ("en", "ru", "uk", "es", "fr"):
                if not str(rec.get(lang) or "").strip():
                    missing.append(f"{spec['slug']}.{field}.{lang}")
        for item in loc.get("vocabulary") or []:
            for lang in ("en", "ru", "uk", "es", "fr"):
                if not str(item.get(lang) or "").strip():
                    missing.append(f"{spec['slug']}.vocab.{item.get('en')}.{lang}")
        for ex in loc.get("exercises") or []:
            prompt = ex.get("prompt") or {}
            for lang in ("en", "ru", "uk", "es", "fr"):
                if not str(prompt.get(lang) or "").strip():
                    missing.append(f"{spec['slug']}.{ex.get('id')}.prompt.{lang}")
    assert missing == [], missing[:40]


def test_catalog_titles_are_not_english_in_ru() -> None:
    from biti.catalog import build_tree

    leaked: list[str] = []
    for unit in build_tree():
        title = unit["title"]
        if title.get("en") and title.get("ru") in {"", title.get("en")}:
            leaked.append(f"unit:{unit['id']}")
        for lang in ("uk", "es", "fr"):
            if not title.get(lang):
                leaked.append(f"unit:{unit['id']}:{lang}")
        for skill in unit["skills"]:
            st = skill["title"]
            if st.get("en") and st.get("ru") in {"", st.get("en")}:
                leaked.append(f"skill:{unit['id']}.{skill['id']}")
            for lang in ("uk", "es", "fr"):
                if not st.get(lang):
                    leaked.append(f"skill:{unit['id']}.{skill['id']}:{lang}")
    assert leaked == [], leaked[:30]


def test_spanish_ui_questions_use_inverted_marks() -> None:
    es = _flatten_ts(I18N / "es.ts")
    bare: list[str] = []
    for key, val in es.items():
        stripped = val.strip()
        if stripped.endswith("?") and "¿" not in stripped:
            bare.append(key)
    assert bare == [], bare


def test_french_ui_uses_nbsp_before_question_and_percent() -> None:
    fr = (I18N / "fr.ts").read_text(encoding="utf-8")
    assert r"\u00a0?" in fr
    assert r"\u00a0%" in fr


def _plural_category(lang: str, n: int) -> str:
    i = abs(int(n))
    if lang in {"ru", "uk"}:
        mod10, mod100 = i % 10, i % 100
        if mod10 == 1 and mod100 != 11:
            return "one"
        if 2 <= mod10 <= 4 and (mod100 < 12 or mod100 > 14):
            return "few"
        return "many"
    if lang == "fr" and i in {0, 1}:
        return "one"
    if i == 1:
        return "one"
    return "other"


def test_slavic_and_french_plural_categories() -> None:
    assert [_plural_category("ru", n) for n in (1, 2, 5, 11, 21, 22, 25)] == [
        "one",
        "few",
        "many",
        "many",
        "one",
        "few",
        "many",
    ]
    assert [_plural_category("uk", n) for n in (1, 3, 14)] == ["one", "few", "many"]
    assert _plural_category("fr", 0) == "one"
    assert _plural_category("fr", 1) == "one"
    assert _plural_category("fr", 2) == "other"
    assert _plural_category("en", 1) == "one"
    assert _plural_category("en", 2) == "other"
    assert _plural_category("es", 1) == "one"
    assert _plural_category("he", 1) == "one"
