"""Forbid Hermes-unsafe bare globals in the Expo Go mobile graph."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCAN = [
    ROOT / "apps" / "mobile",
    ROOT / "packages" / "grading",
    ROOT / "packages" / "hebrew-text",
    ROOT / "packages" / "i18n",
    ROOT / "packages" / "design-tokens",
]
SKIP_DIRS = {".expo", "dist", "node_modules", "content"}
SKIP_FILES = {"eslint.config.mjs", "hermes-env.mjs"}
# Bare identifier crypto.randomUUID — not globalThis.crypto.randomUUID
BARE_UUID = re.compile(r"(?<![\w.])crypto\.randomUUID")
BLOCK = re.compile(r"/\*.*?\*/", re.S)
EXT = {".ts", ".tsx", ".js", ".jsx", ".mjs"}


def _sources() -> list[Path]:
    files: list[Path] = []
    for root in SCAN:
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix not in EXT:
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.name in SKIP_FILES:
                continue
            if ".test." in path.name or path.name.endswith(".test.ts"):
                continue
            files.append(path)
    return files


def _code_lines(text: str) -> list[str]:
    wiped = BLOCK.sub(lambda m: "\n" * m.group(0).count("\n"), text)
    return [line.split("//", 1)[0] for line in wiped.splitlines()]


def test_no_bare_crypto_random_uuid_in_mobile_graph() -> None:
    hits: list[str] = []
    for path in _sources():
        text = path.read_text(encoding="utf-8")
        for i, stripped in enumerate(_code_lines(text), 1):
            if BARE_UUID.search(stripped):
                original = text.splitlines()[i - 1].strip() if i <= len(text.splitlines()) else stripped
                hits.append(f"{path.relative_to(ROOT)}:{i}:{original}")
    assert hits == [], "bare crypto.randomUUID is a Hermes crash; use newId():\n" + "\n".join(hits)


def test_id_helper_never_names_bare_crypto() -> None:
    text = (ROOT / "apps/mobile/lib/id.ts").read_text(encoding="utf-8")
    assert "globalThis" in text
    assert not BARE_UUID.search(text)
    assert "crypto.randomUUID()" not in text.replace("c.randomUUID()", "")
