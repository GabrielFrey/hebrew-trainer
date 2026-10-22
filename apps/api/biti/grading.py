"""Deterministic server grading. No sandbox. Reproducible from (version, answer)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from biti.hebrew import NormalizeMode, levenshtein, normalize_hebrew


@dataclass
class DiffSpan:
    start: int
    end: int
    expected: str
    got: str


@dataclass
class GradeResult:
    result: str  # correct | incorrect | almost
    score: float
    rule_ids: list[str] = field(default_factory=list)
    diff: list[DiffSpan] = field(default_factory=list)
    normalized_answer: str = ""
    hint_level_applied: int = 0

    def as_dict(self) -> dict[str, Any]:
        return {
            "result": self.result,
            "score": self.score,
            "rule_ids": self.rule_ids,
            "diff": [span.__dict__ for span in self.diff],
            "normalized_answer": self.normalized_answer,
            "hint_level_applied": self.hint_level_applied,
        }


def _diff(norm_in: str, norm_exp: str) -> list[DiffSpan]:
    if norm_in == norm_exp:
        return []
    # Character-level span over the normalized answer (code points).
    limit = min(len(norm_in), len(norm_exp))
    start = 0
    while start < limit and norm_in[start] == norm_exp[start]:
        start += 1
    end_in, end_exp = len(norm_in), len(norm_exp)
    while end_in > start and end_exp > start and norm_in[end_in - 1] == norm_exp[end_exp - 1]:
        end_in -= 1
        end_exp -= 1
    return [DiffSpan(start=start, end=end_in, expected=norm_exp[start:end_exp], got=norm_in[start:end_in])]


def grade_text(
    answer: str,
    accepted: list[str],
    mode: NormalizeMode = "relaxed",
    almost_distance: int = 1,
) -> GradeResult:
    if not isinstance(answer, str):
        return GradeResult("incorrect", 0.0, ["invalid_type"])
    if len(answer) > 500:
        return GradeResult("incorrect", 0.0, ["too_long"])
    norm = normalize_hebrew(answer, mode)
    if not norm:
        return GradeResult("incorrect", 0.0, ["empty"], normalized_answer=norm)
    norms = [normalize_hebrew(a, mode) for a in accepted]
    if norm in norms:
        return GradeResult("correct", 1.0, ["exact_after_norm"], normalized_answer=norm)
    # Near-miss against the closest accepted form.
    closest = min(norms, key=lambda n: levenshtein(norm, n))
    dist = levenshtein(norm, closest)
    if dist <= almost_distance and max(len(norm), len(closest)) >= 3:
        return GradeResult(
            "almost",
            0.0,
            ["near_miss"],
            diff=_diff(norm, closest),
            normalized_answer=norm,
        )
    return GradeResult(
        "incorrect",
        0.0,
        ["mismatch"],
        diff=_diff(norm, closest),
        normalized_answer=norm,
    )


def grade_choice(answer: str, accepted: list[str]) -> GradeResult:
    if answer in accepted:
        return GradeResult("correct", 1.0, ["choice_exact"], normalized_answer=answer)
    return GradeResult("incorrect", 0.0, ["choice_mismatch"], normalized_answer=str(answer))


def grade_order(answer: list[str], accepted: list[str], mode: NormalizeMode = "relaxed") -> GradeResult:
    if not isinstance(answer, list):
        return GradeResult("incorrect", 0.0, ["invalid_type"])
    norm_a = [normalize_hebrew(x, mode) for x in answer]
    norm_b = [normalize_hebrew(x, mode) for x in accepted]
    if norm_a == norm_b:
        return GradeResult("correct", 1.0, ["order_exact"], normalized_answer=" ".join(norm_a))
    if sorted(norm_a) == sorted(norm_b):
        return GradeResult(
            "almost",
            0.0,
            ["order_wrong_but_same_tokens"],
            normalized_answer=" ".join(norm_a),
        )
    return GradeResult("incorrect", 0.0, ["order_mismatch"], normalized_answer=" ".join(norm_a))


def grade_exercise(exercise: dict[str, Any], payload: dict[str, Any], source_lang: str = "en") -> GradeResult:
    from biti.draft_l10n import accepted_for, pairs_for

    kind = exercise.get("type")
    mode: NormalizeMode = exercise.get("mode") or "relaxed"
    accepted = accepted_for(exercise, source_lang)
    if kind in {"mc", "listen_mc", "identify_root", "identify_binyan", "listen_tap", "drill"}:
        return grade_choice(str(payload.get("value", "")), [str(a) for a in accepted])
    if kind in {"match", "match_tap"}:
        got = payload.get("pairs") or {}
        exp = pairs_for(exercise, source_lang)
        if got == exp:
            return GradeResult("correct", 1.0, ["match_exact"])
        return GradeResult("incorrect", 0.0, ["match_mismatch"])
    if kind in {"order_rtl", "tiles"}:
        return grade_order(payload.get("value") or [], accepted, mode)
    if kind in {"speak"}:
        return GradeResult("incorrect", 0.0, ["speech_unavailable"])
    if kind in {"listen", "listen_type"} and exercise.get("requires_audio"):
        return GradeResult("incorrect", 0.0, ["audio_unavailable"])
    return grade_text(str(payload.get("value", "")), [str(a) for a in accepted], mode)
