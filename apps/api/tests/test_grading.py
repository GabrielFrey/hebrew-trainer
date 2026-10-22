from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from biti.grading import grade_text
from biti.hebrew import normalize_hebrew

VECTORS = json.loads(
    Path(__file__).resolve().parents[3].joinpath("packages/grading/vectors/normalization.json").read_text()
)


def test_shared_vectors() -> None:
    for case in VECTORS["cases"]:
        result = grade_text(case["input"], case["accepted"], case["mode"])
        assert result.result == case["expect"], (case["id"], result)


def test_bidi_stripped() -> None:
    assert normalize_hebrew("שלום\u202e", "relaxed") == normalize_hebrew("שלום", "relaxed")


def test_strict_niqqud_does_not_strip() -> None:
    assert normalize_hebrew("שָׁלוֹם", "strict_niqqud") != normalize_hebrew("שלום", "strict_niqqud")
