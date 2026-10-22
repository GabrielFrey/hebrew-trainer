#!/usr/bin/env python3
"""WCAG 2.2 contrast + Machado CVD simulation for packages/design-tokens."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "packages/design-tokens/src/index.ts"

# Machado, Oliveira, Fernandes 2009, IEEE TVCG — dichromat matrices on linear RGB.
CVD = {
    "protanopia": [
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
    ],
    "deuteranopia": [
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.011820, 0.042940, 0.968881],
    ],
    "tritanopia": [
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809, 0.147602],
        [0.004733, 0.691367, 0.303900],
    ],
}


def srgb_lin(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def luminance(h: str) -> float:
    r, g, b = hex_rgb(h)
    return 0.2126 * srgb_lin(r) + 0.7152 * srgb_lin(g) + 0.0722 * srgb_lin(b)


def contrast(a: str, b: str) -> float:
    l1, l2 = luminance(a), luminance(b)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def parse_theme(src: str, name: str) -> dict[str, str]:
    block = re.search(rf"{name}:\s*\{{(.*?)\n  \}}", src, re.S)
    if not block:
        raise SystemExit(f"theme {name} not found")
    return dict(re.findall(r"(\w+):\s*\"(#[0-9A-Fa-f]{6})\"", block.group(1)))


def blend(fg: str, bg: str, a: float) -> str:
    f, b = hex_rgb(fg), hex_rgb(bg)
    rgb = [round(a * x + (1 - a) * y) for x, y in zip(f, b)]
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def lin_enc(c: float) -> float:
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def simulate(h: str, kind: str) -> str:
    r, g, b = hex_rgb(h)
    rgb = [srgb_lin(r), srgb_lin(g), srgb_lin(b)]
    m = CVD[kind]
    out = [sum(m[i][j] * rgb[j] for j in range(3)) for i in range(3)]
    s = [int(round(lin_enc(v) * 255)) for v in out]
    s = [max(0, min(255, v)) for v in s]
    return f"#{s[0]:02X}{s[1]:02X}{s[2]:02X}"


def pairs_for(theme: dict[str, str], glass_over: str) -> list[tuple[str, str, str, float]]:
    glass = blend(theme["paper"] if "paper" in theme else "#FFFFFF", theme["sand"], 0.86)
    # When paper is white, glass fg is white; when paper is dark, glass fg is paper.
    glass = blend("#FFFFFF" if luminance(theme["paper"]) > 0.5 else theme["paper"], theme["sand"], 0.86)
    return [
        ("ink on sand", theme["ink"], theme["sand"], 4.5),
        ("ink on paper", theme["ink"], theme["paper"], 4.5),
        ("inkSoft on sand", theme["inkSoft"], theme["sand"], 4.5),
        ("inkSoft on paper", theme["inkSoft"], theme["paper"], 4.5),
        ("primary on paper", theme["primary"], theme["paper"], 4.5),
        ("paper on primary", theme["paper"], theme["primary"], 4.5),
        ("paper on error/CTA", theme["paper"], theme["error"], 4.5),
        ("paper on success", theme["paper"], theme["success"], 4.5),
        ("secondary on paper", theme["secondary"], theme["paper"], 4.5),
        ("warning on paper", theme["warning"], theme["paper"], 4.5),
        ("success on correctBg", theme["success"], theme["correctBg"], 4.5),
        ("error on incorrectBg", theme["error"], theme["incorrectBg"], 4.5),
        ("warning on almostBg", theme["warning"], theme["almostBg"], 4.5),
        ("line on sand UI", theme["line"], theme["sand"], 3.0),
        ("line on paper UI", theme["line"], theme["paper"], 3.0),
        (f"ink on glass ({glass})", theme["ink"], glass, 4.5),
    ]


def check() -> int:
    src = TOKENS.read_text()
    light = parse_theme(src, "light")
    dark = parse_theme(src, "dark")
    failed = []
    for label, theme in (("light", light), ("dark", dark)):
        for name, fg, bg, need in pairs_for(theme, theme["sand"]):
            ratio = contrast(fg, bg)
            if ratio + 1e-9 < need:
                failed.append(f"{label} {name}: {ratio:.2f}:1 < {need}:1 ({fg}/{bg})")
    # Color is not the only cue: success vs error hue contrast is expected to be weak.
    for kind in CVD:
        ls, le = simulate(light["success"], kind), simulate(light["error"], kind)
        # Text on each sheet must still pass under CVD.
        for theme_name, theme in (("light", light), ("dark", dark)):
            suc = simulate(theme["success"], kind)
            err = simulate(theme["error"], kind)
            sbg = simulate(theme["correctBg"], kind)
            ebg = simulate(theme["incorrectBg"], kind)
            if contrast(suc, sbg) < 4.5:
                failed.append(f"{theme_name} {kind} success text/bg {contrast(suc, sbg):.2f}")
            if contrast(err, ebg) < 4.5:
                failed.append(f"{theme_name} {kind} error text/bg {contrast(err, ebg):.2f}")
    if failed:
        print("FAIL")
        print("\n".join(failed))
        return 1
    print("PASS all WCAG AA pairs; CVD text-on-sheet still AA")
    return 0


if __name__ == "__main__":
    sys.exit(check())
