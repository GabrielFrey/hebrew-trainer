#!/usr/bin/env python3
"""Original Biti robot artwork: SVG + PNG icon, adaptive, splash, mascot states.

Geometry lives in a 120×120 box with the character inside ~13–107 (≈80%
safe zone) so iOS squircle masking does not crop the antenna. Limbs use a
near-ink navy so they separate from brand #184A82. Eyes are ink rings +
large pupils so the face still reads at 60px and 29px.
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = Path("/opt/cursor/artifacts")
WEB_PUB = ROOT / "apps/web/public"
WEB_APP = ROOT / "apps/web/src/app"
MOBILE = ROOT / "apps/mobile/assets"
MASCOT_WEB = WEB_PUB / "mascot"
MASCOT_MOBILE = MOBILE / "mascot"

CREAM = "#F6F0E4"
PLATE = "#E7DCC8"
CHEEK = "#E8C4B0"
NAVY = "#0A1628"
OUTLINE = "#142033"
INK = "#142033"
WHITE = "#FFFFFF"
ANTENNA = "#B45309"
GOLD = "#FCD34D"
TEAL = "#0C5F58"
PRIMARY = "#184A82"
SAND = "#EEF2F7"
DARK_BG = "#101820"


def _mood_geom(mood: str) -> dict:
    sad = mood in {"mistake", "sad"}
    happy = mood in {"correct", "happy", "streak"}
    think = mood == "think"
    return {
        "sad": sad,
        "happy": happy,
        "think": think,
        "streak": mood == "streak",
        "ax2": 51 if sad else 60,
        "ay2": 22 if sad else 19.5,
        "ball": (49, 21) if sad else (60, 18.8),
        "ball_r": 5.4,
        "pupil_dx": 2.2 if think else 1.4,
        "pupil_dy": 2.4 if think else (1.6 if sad else 1.3),
        "smile": {
            "idle": ((48, 73.5), (60, 81.5), (72, 73.5)),
            "neutral": ((48, 73.5), (60, 81.5), (72, 73.5)),
            "correct": ((46, 72), (60, 85), (74, 72)),
            "happy": ((46, 72), (60, 85), (74, 72)),
            "streak": ((45, 71.5), (60, 86), (75, 71.5)),
            "mistake": ((48, 80), (60, 73), (72, 80)),
            "sad": ((48, 80), (60, 73), (72, 80)),
            "think": ((50, 76), (63, 80), (73, 75)),
        }[mood],
        "mouth_w": 4.6 if happy else 4.2,
        "ball_fill": GOLD if mood == "streak" else ANTENNA,
    }


def svg_robot(mood: str = "idle", bg: str | None = PRIMARY, size: int = 120) -> str:
    g = _mood_geom(mood)
    extras = ""
    if g["streak"]:
        extras = f"""
  <path d="M26 30 L28.5 36 L35 34 L30 39 L31 46 L26 42 L20 46 L22 39 L17 34 L24 36 Z" fill="{GOLD}" stroke="{OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M90 26 L92 31.5 L98 30 L94 35 L95 41 L90 37.5 L85 41 L86.5 35 L82 30 L88 31.5 Z" fill="{GOLD}" stroke="{OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
"""
    if mood in {"correct", "happy"}:
        extras += f"""
  <path d="M86 42 L91 33 L96 42" fill="none" stroke="{TEAL}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
"""
    bg_el = f'<rect width="120" height="120" fill="{bg}"/>' if bg else ""
    bx, by = g["ball"]
    pdx, pdy = g["pupil_dx"], g["pupil_dy"]
    smile = g["smile"]
    smile_d = f"M{smile[0][0]} {smile[0][1]} Q{smile[1][0]} {smile[1][1]} {smile[2][0]} {smile[2][1]}"
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 120 120" role="img" aria-label="Biti the robot">
  <title>Biti</title>
  {bg_el}
  <circle cx="28" cy="58" r="12.4" fill="{CREAM}"/>
  <circle cx="92" cy="58" r="12.4" fill="{CREAM}"/>
  <circle cx="28" cy="58" r="10.6" fill="{NAVY}"/>
  <circle cx="92" cy="58" r="10.6" fill="{NAVY}"/>
  <circle cx="28" cy="58" r="4.4" fill="#1A2C44"/>
  <circle cx="92" cy="58" r="4.4" fill="#1A2C44"/>
  <ellipse cx="60" cy="90.5" rx="20" ry="12.2" fill="{OUTLINE}"/>
  <ellipse cx="60" cy="90.5" rx="17.8" ry="10.4" fill="{CREAM}"/>
  <path d="M42 84 Q32 93 40 101" fill="none" stroke="{NAVY}" stroke-width="10.4" stroke-linecap="round"/>
  <path d="M78 84 Q88 93 80 101" fill="none" stroke="{NAVY}" stroke-width="10.4" stroke-linecap="round"/>
  <circle cx="60" cy="58" r="31.2" fill="{OUTLINE}"/>
  <circle cx="60" cy="58" r="28.6" fill="{CREAM}"/>
  <path d="M39 48 Q60 41.5 81 48" fill="none" stroke="{PLATE}" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="41" cy="68.5" rx="6.4" ry="3.8" fill="{CHEEK}"/>
  <ellipse cx="79" cy="68.5" rx="6.4" ry="3.8" fill="{CHEEK}"/>
  <line x1="60" y1="29.5" x2="{g['ax2']}" y2="{g['ay2']}" stroke="{NAVY}" stroke-width="4.6" stroke-linecap="round"/>
  <circle cx="{bx}" cy="{by}" r="{g['ball_r']}" fill="{g['ball_fill']}" stroke="{OUTLINE}" stroke-width="1.8"/>
  {extras}
  <circle cx="45.5" cy="55" r="12.4" fill="{OUTLINE}"/>
  <circle cx="74.5" cy="55" r="12.4" fill="{OUTLINE}"/>
  <circle cx="45.5" cy="55" r="9.7" fill="{WHITE}"/>
  <circle cx="74.5" cy="55" r="9.7" fill="{WHITE}"/>
  <circle cx="{45.5 + pdx}" cy="{55 + pdy}" r="7.3" fill="{INK}"/>
  <circle cx="{74.5 + pdx}" cy="{55 + pdy}" r="7.3" fill="{INK}"/>
  <circle cx="{45.5 + pdx + 2.4}" cy="{55 + pdy - 2.6}" r="2.7" fill="{WHITE}"/>
  <circle cx="{74.5 + pdx + 2.4}" cy="{55 + pdy - 2.6}" r="2.7" fill="{WHITE}"/>
  <circle cx="{45.5 + pdx - 2.6}" cy="{55 + pdy + 2.4}" r="1.15" fill="{WHITE}"/>
  <circle cx="{74.5 + pdx - 2.6}" cy="{55 + pdy + 2.4}" r="1.15" fill="{WHITE}"/>
  <path d="{smile_d}" fill="none" stroke="{INK}" stroke-width="{g['mouth_w']}" stroke-linecap="round"/>
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
    content_scale: float = 1.0,
) -> None:
    """Supersample the 120-unit robot onto a square canvas."""
    s = size * scale
    mode = "RGBA" if alpha else "RGB"
    fill = (0, 0, 0, 0) if (alpha and bg is None) else (_rgb(bg or PRIMARY) + ((255,) if alpha else ()))
    img = Image.new(mode, (s, s), fill)
    d = ImageDraw.Draw(img)
    g = _mood_geom(mood)

    def u(v: float) -> float:
        return ((v - 60) * content_scale + 60) / 120.0 * s

    def ur(v: float) -> float:
        return v * content_scale / 120.0 * s

    def color(h: str):
        return _rgb(h) + ((255,) if alpha else ())

    def circle(cx, cy, r, fill_c):
        x, y, rad = u(cx), u(cy), ur(r)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=color(fill_c))

    def ellipse(cx, cy, rx, ry, fill_c, stroke=None, sw=0.0):
        x, y = u(cx), u(cy)
        box = [x - ur(rx), y - ur(ry), x + ur(rx), y + ur(ry)]
        if stroke and sw:
            d.ellipse(box, fill=color(fill_c) if fill_c else None, outline=color(stroke), width=max(1, int(ur(sw))))
        else:
            d.ellipse(box, fill=color(fill_c))

    def capsule(points, radius, fill_c):
        for x, y in points:
            circle(x, y, radius, fill_c)

    def line(x1, y1, x2, y2, fill_c, width):
        steps = 40
        pts = []
        for i in range(steps + 1):
            t = i / steps
            pts.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
        capsule(pts, width / 2, fill_c)

    def quad_bezier(p0, p1, p2, n=56):
        pts = []
        for i in range(n + 1):
            t = i / n
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
            pts.append((x, y))
        return pts

    def star(cx, cy, r, fill_c):
        pts = []
        for i in range(10):
            ang = math.pi / 2 + i * math.pi / 5
            rad = r if i % 2 == 0 else r * 0.42
            pts.append((u(cx + rad * math.cos(ang)), u(cy - rad * math.sin(ang))))
        d.polygon(pts, fill=color(fill_c), outline=color(OUTLINE))

    # Ears — cream rim so navy cups separate from both #184A82 and dark canvas
    circle(28, 58, 12.4, CREAM)
    circle(92, 58, 12.4, CREAM)
    circle(28, 58, 10.6, NAVY)
    circle(92, 58, 10.6, NAVY)
    circle(28, 58, 4.4, "#1A2C44")
    circle(92, 58, 4.4, "#1A2C44")

    ellipse(60, 90.5, 20.0, 12.2, OUTLINE)
    ellipse(60, 90.5, 17.8, 10.4, CREAM)

    capsule(quad_bezier((42, 84), (32, 93), (40, 101)), 5.2, NAVY)
    capsule(quad_bezier((78, 84), (88, 93), (80, 101)), 5.2, NAVY)

    circle(60, 58, 31.2, OUTLINE)
    circle(60, 58, 28.6, CREAM)

    capsule(quad_bezier((39, 48), (60, 41.5), (81, 48)), 1.2, PLATE)

    ellipse(41, 68.5, 6.4, 3.8, CHEEK)
    ellipse(79, 68.5, 6.4, 3.8, CHEEK)

    bx, by = g["ball"]
    line(60, 29.5, g["ax2"], g["ay2"], NAVY, 4.6)
    circle(bx, by, g["ball_r"] + 0.9, OUTLINE)
    circle(bx, by, g["ball_r"], g["ball_fill"])

    if g["streak"]:
        star(26, 36, 7.2, GOLD)
        star(94, 32, 6.4, GOLD)

    pdx, pdy = g["pupil_dx"], g["pupil_dy"]
    for ex in (45.5, 74.5):
        circle(ex, 55, 12.4, OUTLINE)
        circle(ex, 55, 9.7, WHITE)
        circle(ex + pdx, 55 + pdy, 7.3, INK)
        circle(ex + pdx + 2.4, 55 + pdy - 2.6, 2.7, WHITE)
        circle(ex + pdx - 2.6, 55 + pdy + 2.4, 1.15, WHITE)

    capsule(quad_bezier(*g["smile"]), g["mouth_w"] / 2, INK)

    if mood in {"correct", "happy"}:
        check_a = [(86 + (91 - 86) * i / 16, 42 + (33 - 42) * i / 16) for i in range(17)]
        check_b = [(91 + (97 - 91) * i / 18, 33 + (44 - 33) * i / 18) for i in range(19)]
        capsule(check_a + check_b, 1.9, TEAL)

    out = img.resize((size, size), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not alpha:
        out = out.convert("RGB")
    out.save(path, "PNG")


def render_splash(path: Path, w: int, h: int, bg: str, mood: str = "idle") -> None:
    img = Image.new("RGB", (w, h), _rgb(bg))
    tmp = path.with_suffix(".tmp.png")
    render_png(tmp, 640, mood=mood, bg=None, alpha=True)
    robot = Image.open(tmp).convert("RGBA")
    x = (w - 640) // 2
    y = (h - 640) // 2 - h // 12
    img.paste(robot, (x, y), robot)
    img.save(path, "PNG")
    tmp.unlink(missing_ok=True)


def render_tinted(path: Path, size: int = 1024) -> None:
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


def _font(size: int):
    for name in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ):
        p = Path(name)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def _squircle_mask(size: int) -> Image.Image:
    """Approximate iOS icon mask (continuous-corner ~22.37% radius)."""
    r = int(size * 0.2237)
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(radius=size * 0.004))


def render_preview_sheet(icon_1024: Path, dest: Path) -> None:
    """1024 / 180 / 60 / 29 plus grayscale and a masked 180 for crop check."""
    src = Image.open(icon_1024).convert("RGB")
    sand = _rgb(SAND)
    canvas = Image.new("RGB", (1480, 980), sand)
    draw = ImageDraw.Draw(canvas)
    font = _font(22)
    small = _font(16)

    def paste(im: Image.Image, xy, label: str):
        canvas.paste(im, xy)
        draw.text((xy[0], xy[1] + im.size[1] + 8), label, fill=_rgb(INK), font=small)

    paste(src.resize((420, 420), Image.Resampling.LANCZOS), (40, 40), "1024 → 420 preview")
    s180 = src.resize((180, 180), Image.Resampling.LANCZOS)
    s60 = src.resize((60, 60), Image.Resampling.LANCZOS)
    s29 = src.resize((29, 29), Image.Resampling.LANCZOS)
    paste(s180, (500, 40), "180 px")
    paste(s60, (720, 40), "60 px")
    paste(s29, (820, 40), "29 px")

    masked = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
    masked.paste(s180.convert("RGBA"), (0, 0))
    m = _squircle_mask(180)
    masked.putalpha(m)
    backing = Image.new("RGB", (180, 180), sand)
    backing.paste(masked, mask=masked.split()[-1])
    paste(backing, (500, 280), "180 px iOS-mask (antenna must stay inside)")

    gray1024 = src.convert("L").convert("RGB").resize((280, 280), Image.Resampling.LANCZOS)
    gray60 = src.convert("L").convert("RGB").resize((60, 60), Image.Resampling.LANCZOS)
    paste(gray1024, (40, 520), "1024 grayscale")
    paste(gray60, (360, 520), "60 grayscale")

    draw.text((40, 16), "Biti icon size sheet — safe zone ~80% center", fill=_rgb(INK), font=font)
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, "PNG")

    # Also export the actual requested sizes as discrete files.
    src.save(ART / "biti-icon-1024.png")
    s180.save(ART / "biti-icon-180.png")
    s60.save(ART / "biti-icon-60.png")
    s29.save(ART / "biti-icon-29.png")


def write_svgs() -> None:
    MASCOT_WEB.mkdir(parents=True, exist_ok=True)
    MASCOT_MOBILE.mkdir(parents=True, exist_ok=True)
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
    render_png(MOBILE / "adaptive-foreground.png", 1024, mood="idle", bg=None, alpha=True, content_scale=0.82)
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

    shutil.copy2(MOBILE / "icon.png", ART / "biti-icon.png")
    shutil.copy2(MOBILE / "icon-dark.png", ART / "biti-icon-dark.png")
    shutil.copy2(MOBILE / "icon-tinted.png", ART / "biti-icon-tinted.png")
    render_splash(ART / "biti-icon-splash.png", 1284, 2778, SAND)
    shutil.copy2(MASCOT_WEB / "idle.png", ART / "biti-icon-mascot-idle.png")
    shutil.copy2(MASCOT_WEB / "correct.png", ART / "biti-icon-mascot-correct.png")
    shutil.copy2(MASCOT_WEB / "mistake.png", ART / "biti-icon-mascot-mistake.png")
    shutil.copy2(MASCOT_WEB / "streak.png", ART / "biti-icon-mascot-streak.png")
    render_preview_sheet(MOBILE / "icon.png", ART / "biti-icon-preview-sheet.png")
    print("wrote icons, mascots, favicons, preview sheet")


if __name__ == "__main__":
    main()
