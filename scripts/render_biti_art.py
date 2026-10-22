#!/usr/bin/env python3
"""Original Biti robot artwork: SVG + PNG icon, adaptive, splash, mascot states."""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = Path("/opt/cursor/artifacts")
WEB_PUB = ROOT / "apps/web/public"
WEB_APP = ROOT / "apps/web/src/app"
MOBILE = ROOT / "apps/mobile/assets"
MASCOT_WEB = WEB_PUB / "mascot"
MASCOT_MOBILE = MOBILE / "mascot"

CREAM = "#F6F0E4"
NAVY = "#1B3A5F"
INK = "#142033"
WHITE = "#FFFFFF"
ANTENNA = "#B45309"
GOLD = "#FCD34D"
TEAL = "#0C5F58"
PRIMARY = "#184A82"
SAND = "#EEF2F7"
DARK_BG = "#101820"
TERRACOTTA = "#9A3412"


def svg_robot(mood: str = "idle", bg: str | None = PRIMARY, size: int = 120) -> str:
    smile = {
        "idle": "M48 80 Q60 88 72 80",
        "neutral": "M48 80 Q60 88 72 80",
        "correct": "M46 76 Q60 94 74 76",
        "happy": "M46 76 Q60 94 74 76",
        "mistake": "M48 86 Q60 76 72 86",
        "sad": "M48 86 Q60 76 72 86",
        "streak": "M44 74 Q60 96 76 74",
        "think": "M50 82 Q64 86 74 80",
    }[mood]
    pupil_y = 56 if mood == "think" else 58
    ax2, ay2 = (48, 10) if mood in {"mistake", "sad"} else (60, 8)
    ball = (46, 8) if mood in {"mistake", "sad"} else (60, 6)
    ball_fill = GOLD if mood == "streak" else ANTENNA
    extras = ""
    if mood == "streak":
        extras = """
  <path d="M16 26 L20 34 L28 30 L20 38 L16 46 L12 38 L4 30 L12 34 Z" fill="#FCD34D"/>
  <path d="M94 20 L97 26 L104 24 L98 30 L96 38 L92 30 L86 24 L92 26 Z" fill="#FCD34D"/>
"""
    if mood in {"correct", "happy"}:
        extras += """
  <path d="M86 42 L90 34 L94 42" fill="none" stroke="#0C5F58" stroke-width="3" stroke-linecap="round"/>
"""
    bg_el = f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ""
    # Scale from 120 viewBox
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 120 120" role="img" aria-label="Biti the robot">
  <title>Biti</title>
  {bg_el}
  <circle cx="32" cy="52" r="10" fill="{NAVY}"/>
  <circle cx="88" cy="52" r="10" fill="{NAVY}"/>
  <ellipse cx="60" cy="92" rx="28" ry="20" fill="{CREAM}"/>
  <path d="M34 86 Q28 100 38 108" fill="{NAVY}"/>
  <path d="M86 86 Q92 100 82 108" fill="{NAVY}"/>
  <circle cx="60" cy="52" r="34" fill="{CREAM}"/>
  <line x1="60" y1="22" x2="{ax2}" y2="{ay2}" stroke="{NAVY}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="{ball[0]}" cy="{ball[1]}" r="6" fill="{ball_fill}"/>
  {extras}
  <circle cx="46" cy="56" r="11" fill="{WHITE}"/>
  <circle cx="74" cy="56" r="11" fill="{WHITE}"/>
  <circle cx="48" cy="{pupil_y}" r="5.5" fill="{INK}"/>
  <circle cx="76" cy="{pupil_y}" r="5.5" fill="{INK}"/>
  <circle cx="50" cy="{pupil_y - 2}" r="1.6" fill="{WHITE}"/>
  <circle cx="78" cy="{pupil_y - 2}" r="1.6" fill="{WHITE}"/>
  <path d="{smile}" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round"/>
</svg>
"""


def _rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def render_png(
    path: Path,
    size: int,
    mood: str = "idle",
    bg: str | None = PRIMARY,
    alpha: bool = False,
    scale: int = 4,
) -> None:
    """Supersample the 120-unit robot onto a square canvas."""
    s = size * scale
    mode = "RGBA" if alpha else "RGB"
    fill = (0, 0, 0, 0) if (alpha and bg is None) else (_rgb(bg or PRIMARY) + ((255,) if alpha else ()))
    img = Image.new(mode, (s, s), fill)
    d = ImageDraw.Draw(img)

    def u(v: float) -> float:
        return v / 120.0 * s

    def circle(cx, cy, r, fill_c):
        x, y, rad = u(cx), u(cy), u(r)
        color = _rgb(fill_c) + ((255,) if alpha else ())
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=color)

    def ellipse(cx, cy, rx, ry, fill_c):
        x, y = u(cx), u(cy)
        color = _rgb(fill_c) + ((255,) if alpha else ())
        d.ellipse([x - u(rx), y - u(ry), x + u(rx), y + u(ry)], fill=color)

    def line(x1, y1, x2, y2, fill_c, width):
        # Round-capped stem: overlapping dots, no square Pillow caps.
        pts = []
        steps = 32
        for i in range(steps + 1):
            t = i / steps
            pts.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
        capsule(pts, width / 2, fill_c)

    def capsule(points, radius, fill_c):
        for x, y in points:
            circle(x, y, radius, fill_c)

    def thick_path(points, fill_c, width):
        capsule(points, width / 2, fill_c)

    def quad_bezier(p0, p1, p2, n=48):
        pts = []
        for i in range(n + 1):
            t = i / n
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
            pts.append((x, y))
        return pts

    def star(cx, cy, r, fill_c):
        color = _rgb(fill_c) + ((255,) if alpha else ())
        pts = []
        for i in range(8):
            ang = math.pi / 2 + i * math.pi / 4
            rad = r if i % 2 == 0 else r * 0.38
            pts.append((u(cx + rad * math.cos(ang)), u(cy - rad * math.sin(ang))))
        d.polygon(pts, fill=color)

    # Ears, body, arms, head
    circle(32, 52, 10, NAVY)
    circle(88, 52, 10, NAVY)
    ellipse(60, 92, 28, 20, CREAM)
    capsule(quad_bezier((34, 86), (26, 98), (38, 108)), 6, NAVY)
    capsule(quad_bezier((86, 86), (94, 98), (82, 108)), 6, NAVY)
    circle(60, 52, 34, CREAM)

    ax2, ay2 = (48, 10) if mood in {"mistake", "sad"} else (60, 8)
    ball = (46, 8) if mood in {"mistake", "sad"} else (60, 6)
    line(60, 22, ax2, ay2, NAVY, 4)
    circle(ball[0], ball[1], 6, GOLD if mood == "streak" else ANTENNA)

    if mood == "streak":
        star(18, 34, 8, GOLD)
        star(100, 28, 7, GOLD)
        star(88, 16, 4, GOLD)

    pupil_y = 56 if mood == "think" else 58
    circle(46, 56, 11, WHITE)
    circle(74, 56, 11, WHITE)
    circle(48, pupil_y, 5.5, INK)
    circle(76, pupil_y, 5.5, INK)
    circle(50, pupil_y - 2, 1.6, WHITE)
    circle(78, pupil_y - 2, 1.6, WHITE)

    smiles = {
        "idle": ((48, 80), (60, 88), (72, 80)),
        "neutral": ((48, 80), (60, 88), (72, 80)),
        "correct": ((46, 76), (60, 94), (74, 76)),
        "happy": ((46, 76), (60, 94), (74, 76)),
        "mistake": ((48, 86), (60, 76), (72, 86)),
        "sad": ((48, 86), (60, 76), (72, 86)),
        "streak": ((44, 74), (60, 96), (76, 74)),
        "think": ((50, 82), (64, 86), (74, 80)),
    }
    p0, p1, p2 = smiles[mood]
    thick_path(quad_bezier(p0, p1, p2), INK, 3.2)

    if mood in {"correct", "happy"}:
        thick_path([(86, 44), (90, 36), (94, 44)], TEAL, 3)

    out = img.resize((size, size), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not alpha:
        out = out.convert("RGB")
    out.save(path, "PNG")


def render_splash(path: Path, w: int, h: int, bg: str, mood: str = "idle") -> None:
    img = Image.new("RGB", (w, h), _rgb(bg))
    robot = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
    tmp = path.with_suffix(".tmp.png")
    render_png(tmp, 640, mood=mood, bg=None, alpha=True)
    robot = Image.open(tmp).convert("RGBA")
    x = (w - 640) // 2
    y = (h - 640) // 2 - h // 12
    img.paste(robot, (x, y), robot)
    img.save(path, "PNG")
    tmp.unlink(missing_ok=True)


def render_tinted(path: Path, size: int = 1024) -> None:
    """Single-color template: cream silhouette-ish robot, transparent ground."""
    src = path.with_name("_tinted_src.png")
    render_png(src, size, mood="idle", bg=None, alpha=True)
    im = Image.open(src).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 8:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            # Flatten to light gray template; keep alpha.
            lum = int(0.2126 * r + 0.7152 * g + 0.0722 * b)
            pixels[x, y] = (lum, lum, lum, a)
    im.save(path, "PNG")
    src.unlink(missing_ok=True)


def render_ico(png_rgb: Path, ico_paths: list[Path]) -> None:
    base = Image.open(png_rgb).convert("RGBA").resize((256, 256), Image.Resampling.LANCZOS)
    sizes = [(16, 16), (32, 32), (48, 48)]
    for dest in ico_paths:
        dest.parent.mkdir(parents=True, exist_ok=True)
        base.save(dest, format="ICO", sizes=sizes)


def write_svgs() -> None:
    MASCOT_WEB.mkdir(parents=True, exist_ok=True)
    MASCOT_MOBILE.mkdir(parents=True, exist_ok=True)
    (WEB_PUB / "icons").mkdir(parents=True, exist_ok=True)
    moods = {
        "idle": "idle",
        "correct": "correct",
        "mistake": "mistake",
        "streak": "streak",
        "neutral": "idle",
    }
    for name, mood in moods.items():
        svg = svg_robot(mood=mood, bg=None, size=120)
        (MASCOT_WEB / f"{name}.svg").write_text(svg)
        (MASCOT_MOBILE / f"{name}.svg").write_text(svg)
    (WEB_PUB / "icon.svg").write_text(svg_robot(mood="idle", bg=PRIMARY, size=1024))
    (WEB_PUB / "icon-dark.svg").write_text(svg_robot(mood="idle", bg=DARK_BG, size=1024))


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    MASCOT_WEB.mkdir(parents=True, exist_ok=True)
    MASCOT_MOBILE.mkdir(parents=True, exist_ok=True)
    MOBILE.mkdir(parents=True, exist_ok=True)
    write_svgs()

    render_png(MOBILE / "icon.png", 1024, mood="idle", bg=PRIMARY, alpha=False)
    render_png(MOBILE / "icon-dark.png", 1024, mood="idle", bg=DARK_BG, alpha=False)
    render_tinted(MOBILE / "icon-tinted.png", 1024)
    render_png(MOBILE / "adaptive-foreground.png", 1024, mood="idle", bg=None, alpha=True)
    render_png(MOBILE / "splash.png", 1024, mood="idle", bg=None, alpha=True)
    render_png(MOBILE / "favicon.png", 48, mood="idle", bg=PRIMARY, alpha=False)

    render_png(WEB_PUB / "icon-1024.png", 1024, mood="idle", bg=PRIMARY, alpha=False)
    render_png(WEB_PUB / "apple-touch-icon.png", 180, mood="idle", bg=PRIMARY, alpha=False)
    render_png(WEB_PUB / "icon-dark.png", 1024, mood="idle", bg=DARK_BG, alpha=False)
    render_png(WEB_PUB / "icon-tinted.png", 1024, mood="idle", bg=None, alpha=True)
    render_ico(WEB_PUB / "icon-1024.png", [WEB_PUB / "favicon.ico", WEB_APP / "favicon.ico"])

    for mood, fname in [
        ("idle", "idle"),
        ("correct", "correct"),
        ("mistake", "mistake"),
        ("streak", "streak"),
    ]:
        render_png(MASCOT_WEB / f"{fname}.png", 512, mood=mood, bg=SAND, alpha=False)
        render_png(MASCOT_MOBILE / f"{fname}.png", 512, mood=mood, bg=SAND, alpha=False)

    # Artifacts required by the color-palette task
    shutil.copy2(MOBILE / "icon.png", ART / "biti-icon.png")
    shutil.copy2(MOBILE / "icon.png", ART / "biti-icon-1024.png")
    shutil.copy2(MOBILE / "icon-dark.png", ART / "biti-icon-dark.png")
    shutil.copy2(MOBILE / "icon-tinted.png", ART / "biti-icon-tinted.png")
    render_splash(ART / "biti-icon-splash.png", 1284, 2778, SAND)
    shutil.copy2(MASCOT_WEB / "idle.png", ART / "biti-icon-mascot-idle.png")
    shutil.copy2(MASCOT_WEB / "correct.png", ART / "biti-icon-mascot-correct.png")
    shutil.copy2(MASCOT_WEB / "mistake.png", ART / "biti-icon-mascot-mistake.png")
    shutil.copy2(MASCOT_WEB / "streak.png", ART / "biti-icon-mascot-streak.png")
    print("wrote icons, mascots, favicons")


if __name__ == "__main__":
    main()
