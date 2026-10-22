"""Palette tokens in packages/design-tokens must stay WCAG 2.2 AA."""

import importlib.util
from pathlib import Path


def test_design_tokens_meet_wcag_aa():
    path = Path(__file__).resolve().parents[3] / "scripts" / "check_contrast.py"
    spec = importlib.util.spec_from_file_location("check_contrast", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    assert mod.check() == 0
