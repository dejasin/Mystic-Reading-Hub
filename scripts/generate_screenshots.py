"""Generate 5 App Store marketing screenshots for Oracle: AI Life Advisor.

Apple 6.7"+ display (iPhone 16 Pro Max) screenshot size: 1320 x 2868.
Output: artifacts/oracle/assets/app-store/screenshot-{1..5}.png
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1320, 2868
OUT_DIR = Path("artifacts/oracle/assets/app-store")

GOLD = (201, 168, 76)
GOLD_LIGHT = (235, 207, 132)
CREAM = (240, 224, 192)
BG_TOP = (10, 10, 20)
BG_MID = (20, 12, 38)
BG_BOTTOM = (8, 6, 16)
MUTED = (160, 145, 110)


# ─────────────────────────── font discovery ───────────────────────────
def find_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    common_paths = [
        "/usr/share/fonts/truetype/dejavu",
        "/usr/share/fonts/truetype/liberation",
        "/usr/share/fonts/truetype/freefont",
        "/usr/share/fonts/TTF",
        "/usr/share/fonts/dejavu",
        "/usr/share/fonts",
    ]
    for name in candidates:
        for base in common_paths:
            p = Path(base) / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
        # Try absolute path or current dir
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def font_serif_bold(size: int) -> ImageFont.FreeTypeFont:
    return find_font(
        ["DejaVuSerif-Bold.ttf", "LiberationSerif-Bold.ttf", "FreeSerifBold.ttf"],
        size,
    )


def font_serif(size: int) -> ImageFont.FreeTypeFont:
    return find_font(
        ["DejaVuSerif.ttf", "LiberationSerif-Regular.ttf", "FreeSerif.ttf"],
        size,
    )


def font_serif_italic(size: int) -> ImageFont.FreeTypeFont:
    return find_font(
        ["DejaVuSerif-Italic.ttf", "LiberationSerif-Italic.ttf", "FreeSerifItalic.ttf"],
        size,
    )


def font_sans(size: int) -> ImageFont.FreeTypeFont:
    return find_font(
        ["DejaVuSans.ttf", "LiberationSans-Regular.ttf", "FreeSans.ttf"],
        size,
    )


# ─────────────────────────── primitives ───────────────────────────
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_background() -> Image.Image:
    img = Image.new("RGB", (W, H), BG_TOP)
    px = img.load()
    cx = W / 2
    cy = H * 0.42
    max_d = math.hypot(W, H)
    for y in range(H):
        if y < H * 0.5:
            base = lerp(BG_TOP, BG_MID, y / (H * 0.5))
        else:
            base = lerp(BG_MID, BG_BOTTOM, (y - H * 0.5) / (H * 0.5))
        for x in range(W):
            d = math.hypot(x - cx, y - cy) / max_d
            warm = max(0.0, 0.32 - d) / 0.32
            color = lerp(base, (60, 35, 90), warm * 0.6)
            px[x, y] = color
    return img


def add_stars(img: Image.Image, count: int = 220, seed: int = 7) -> None:
    rng = random.Random(seed)
    draw = ImageDraw.Draw(img, "RGBA")
    for _ in range(count):
        x = rng.randint(0, W - 1)
        y = rng.randint(0, H - 1)
        r = rng.choice([1, 1, 2, 2, 3])
        a = rng.randint(80, 200)
        c = rng.choice([(255, 240, 210, a), (255, 230, 170, a), (220, 200, 230, a)])
        draw.ellipse((x - r, y - r, x + r, y + r), fill=c)


def draw_sigil(img: Image.Image, cx: int, cy: int, size: int) -> None:
    """Sun-and-cross style gold sigil."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    r = size // 2

    # Outer ring
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=GOLD, width=4)
    # Inner ring
    d.ellipse((cx - r + 14, cy - r + 14, cx + r - 14, cy + r - 14),
              outline=GOLD, width=2)
    # Cross
    d.line((cx, cy - r + 28, cx, cy + r - 28), fill=GOLD, width=3)
    d.line((cx - r + 28, cy, cx + r - 28, cy), fill=GOLD, width=3)
    # Diagonals
    off = int((r - 28) * 0.707)
    d.line((cx - off, cy - off, cx + off, cy + off), fill=GOLD_LIGHT, width=2)
    d.line((cx + off, cy - off, cx - off, cy + off), fill=GOLD_LIGHT, width=2)
    # Center dot
    d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=GOLD_LIGHT)

    glow = layer.filter(ImageFilter.GaussianBlur(radius=12))
    img.paste(glow, (0, 0), glow)
    img.paste(layer, (0, 0), layer)


def draw_centered_text(
    img: Image.Image,
    text: str,
    font: ImageFont.FreeTypeFont,
    y: int,
    color: tuple[int, int, int] = CREAM,
    letter_spacing: int = 0,
) -> int:
    """Draw text horizontally centered. Returns line height used."""
    d = ImageDraw.Draw(img)
    if letter_spacing > 0:
        # Manually space letters
        widths = []
        for ch in text:
            bbox = d.textbbox((0, 0), ch, font=font)
            widths.append(bbox[2] - bbox[0])
        total = sum(widths) + letter_spacing * (len(text) - 1)
        x = (W - total) // 2
        for i, ch in enumerate(text):
            d.text((x, y), ch, font=font, fill=color)
            x += widths[i] + letter_spacing
    else:
        bbox = d.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        d.text(((W - w) // 2, y), text, font=font, fill=color)
    bbox = d.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    words = text.split()
    lines: list[str] = []
    cur: list[str] = []
    for w in words:
        trial = " ".join(cur + [w])
        bbox = d.textbbox((0, 0), trial, font=font)
        if (bbox[2] - bbox[0]) > max_w and cur:
            lines.append(" ".join(cur))
            cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append(" ".join(cur))
    return lines


def draw_paragraph(
    img: Image.Image,
    text: str,
    font: ImageFont.FreeTypeFont,
    y: int,
    color: tuple[int, int, int] = CREAM,
    max_w: int = 1100,
    line_gap: int = 16,
) -> int:
    lines = wrap_text(text, font, max_w)
    d = ImageDraw.Draw(img)
    for line in lines:
        bbox = d.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        d.text(((W - w) // 2, y), line, font=font, fill=color)
        y += h + line_gap
    return y


def draw_divider(img: Image.Image, y: int) -> None:
    d = ImageDraw.Draw(img)
    cx = W // 2
    d.line((cx - 80, y, cx - 24, y), fill=GOLD, width=2)
    d.line((cx + 24, y, cx + 80, y), fill=GOLD, width=2)
    d.text((cx - 8, y - 18), "✦", font=font_serif_bold(28), fill=GOLD)


def draw_phone_frame(img: Image.Image, x: int, y: int, w: int, h: int) -> None:
    """Decorative rounded-rect phone frame with thin gold border."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((x, y, x + w, y + h), radius=58, outline=GOLD, width=3)
    d.rounded_rectangle(
        (x + 3, y + 3, x + w - 3, y + h - 3),
        radius=55,
        fill=(14, 10, 28, 220),
    )
    img.paste(layer, (0, 0), layer)


def draw_radar_mock(img: Image.Image, cx: int, cy: int, r: int) -> None:
    """Stylized radar chart for behavioral profile screenshot."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    n = 6
    # Concentric rings
    for level in (0.25, 0.5, 0.75, 1.0):
        pts = []
        for i in range(n):
            a = -math.pi / 2 + i * 2 * math.pi / n
            pts.append((cx + math.cos(a) * r * level, cy + math.sin(a) * r * level))
        d.polygon(pts, outline=(*GOLD, 70))
    # Spokes
    for i in range(n):
        a = -math.pi / 2 + i * 2 * math.pi / n
        d.line((cx, cy, cx + math.cos(a) * r, cy + math.sin(a) * r),
               fill=(*GOLD, 70), width=1)
    # Filled polygon
    scores = [0.78, 0.65, 0.82, 0.55, 0.88, 0.70]
    pts = []
    for i, s in enumerate(scores):
        a = -math.pi / 2 + i * 2 * math.pi / n
        pts.append((cx + math.cos(a) * r * s, cy + math.sin(a) * r * s))
    d.polygon(pts, fill=(*GOLD, 90), outline=GOLD)
    for x, y in pts:
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=GOLD_LIGHT)

    img.paste(layer, (0, 0), layer)

    # Axis labels
    labels = ["INTUITION", "EMOTIONAL DEPTH", "DRIVE",
              "ADAPTABILITY", "INNER KNOWING", "EXPRESSION"]
    f = font_sans(28)
    dl = ImageDraw.Draw(img)
    for i, lbl in enumerate(labels):
        a = -math.pi / 2 + i * 2 * math.pi / n
        lx = cx + math.cos(a) * (r + 70)
        ly = cy + math.sin(a) * (r + 70)
        bbox = dl.textbbox((0, 0), lbl, font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        dl.text((lx - w / 2, ly - h / 2), lbl, font=f, fill=CREAM)


# ─────────────────────────── screens ───────────────────────────
def screen_intake(out: Path) -> None:
    """Frame 4 — The Intake. Onboarding capture: name, date of birth, context."""
    img = make_background()
    add_stars(img, count=220, seed=11)

    y = 200
    draw_centered_text(img, "THE INTAKE", font_serif_bold(96), y,
                       color=GOLD, letter_spacing=10)
    y += 160
    draw_divider(img, y)
    y += 90
    y = draw_paragraph(
        img,
        "A few questions. Your context. The signal Oracle needs to read you clearly.",
        font_serif_italic(44), y, color=MUTED, max_w=1080, line_gap=18,
    )
    y += 60

    # Mocked intake fields
    d = ImageDraw.Draw(img)
    fields = [
        ("Your Name", "Alex Rivera"),
        ("Date of Birth", "March 14, 1991"),
        ("What brings you to Oracle?", "Career direction. Whether to leave."),
    ]
    fl = font_sans(36)
    fv = font_serif(48)
    field_w = 1100
    field_x = (W - field_w) // 2
    for label, value in fields:
        d.text((field_x + 8, y), label.upper(), font=fl, fill=GOLD)
        y += 60
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        dl.rounded_rectangle((field_x, y, field_x + field_w, y + 110),
                             radius=14, fill=(30, 22, 50, 220),
                             outline=(*GOLD, 100), width=1)
        img.paste(layer, (0, 0), layer)
        d.text((field_x + 32, y + 32), value, font=fv, fill=CREAM)
        y += 150

    # Bottom CTA pill
    pill_h = 130
    pill_w = 760
    px = (W - pill_w) // 2
    py = int(H * 0.86)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    dl.rounded_rectangle((px, py, px + pill_w, py + pill_h),
                         radius=pill_h // 2, fill=(*GOLD, 255))
    img.paste(layer, (0, 0), layer)
    f = font_sans(46)
    bbox = ImageDraw.Draw(img).textbbox((0, 0), "Begin Your Session", font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    ImageDraw.Draw(img).text(
        ((W - tw) // 2, py + (pill_h - th) // 2 - 4),
        "Begin Your Session", font=f, fill=BG_TOP,
    )

    img.save(out, format="PNG", optimize=True)


def screen_profile(out: Path) -> None:
    """Frame 3 — Your Profile. Six-dimension behavioral radar."""
    img = make_background()
    add_stars(img, count=200, seed=23)

    y = 180
    draw_centered_text(img, "YOUR PROFILE", font_serif_bold(96), y,
                       color=GOLD, letter_spacing=10)
    y += 140
    draw_centered_text(img, "YOUR INNER WIRING", font_serif_bold(56), y,
                       color=CREAM, letter_spacing=8)
    y += 130
    draw_divider(img, y)
    y += 80
    y = draw_paragraph(
        img,
        "Six dimensions, mapped from your behavioral profile.",
        font_serif_italic(46), y, color=MUTED, max_w=1100, line_gap=18,
    )

    # Radar chart center
    radar_cy = int(H * 0.46)
    draw_radar_mock(img, W // 2, radar_cy, 380)

    # Bottom rows — three sample scores
    items = [
        ("Intuition", 78),
        ("Inner Knowing", 88),
        ("Drive", 82),
    ]
    by = int(H * 0.74)
    fa = font_sans(44)
    fb = font_sans(44)
    d = ImageDraw.Draw(img)
    card_w = 1100
    card_x = (W - card_w) // 2
    for label, score in items:
        # Row card
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        dl.rounded_rectangle((card_x, by, card_x + card_w, by + 130),
                             radius=18, fill=(30, 22, 50, 210),
                             outline=(*GOLD, 60), width=1)
        img.paste(layer, (0, 0), layer)
        d.text((card_x + 38, by + 32), label, font=fa, fill=CREAM)
        sl = f"{score}"
        bbox = d.textbbox((0, 0), sl, font=fb)
        w = bbox[2] - bbox[0]
        d.text((card_x + card_w - w - 38, by + 32), sl, font=fb, fill=GOLD)
        # Bar
        bar_y = by + 96
        bar_x = card_x + 38
        bar_w = card_w - 76
        d.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + 8),
                            radius=4, fill=(*GOLD, 50))
        d.rounded_rectangle((bar_x, bar_y, bar_x + int(bar_w * score / 100), bar_y + 8),
                            radius=4, fill=GOLD)
        by += 168

    img.save(out, format="PNG", optimize=True)


def screen_reading(out: Path) -> None:
    """Frame 2 — Real Guidance. Sample reading with italic disclaimer."""
    img = make_background()
    add_stars(img, count=220, seed=37)

    y = 200
    draw_centered_text(img, "REAL GUIDANCE", font_serif_bold(96), y,
                       color=GOLD, letter_spacing=10)
    y += 160
    draw_centered_text(img, "YOUR ORACLE SESSION", font_serif_bold(52), y,
                       color=CREAM, letter_spacing=8)
    y += 120
    draw_divider(img, y)
    y += 90

    # Italic disclaimer
    y = draw_paragraph(
        img,
        "What follows is not a prediction. It is a map of the patterns The Oracle reads in your behavioral profile — to help you see yourself more clearly.",
        font_serif_italic(44), y, color=MUTED, max_w=1080, line_gap=18,
    )
    y += 60

    # Section: IDENTITY BLUEPRINT
    draw_centered_text(img, "✦  IDENTITY BLUEPRINT  ✦", font_serif_bold(50), y,
                       color=GOLD, letter_spacing=4)
    y += 110
    y = draw_paragraph(
        img,
        "You move through the world with a quiet, watchful intensity. You see what others miss — and you carry the weight of that seeing. The pattern you keep returning to is one of holding back until certainty arrives. Certainty rarely arrives.",
        font_serif(46), y, color=CREAM, max_w=1080, line_gap=20,
    )
    y += 60

    draw_centered_text(img, "✦  PRIMARY BLOCK  ✦", font_serif_bold(50), y,
                       color=GOLD, letter_spacing=4)
    y += 110
    y = draw_paragraph(
        img,
        "Your edge is not your hesitation — it is your discernment. The work is to act on it sooner.",
        font_serif(46), y, color=CREAM, max_w=1080, line_gap=20,
    )

    img.save(out, format="PNG", optimize=True)


def screen_chat(out: Path) -> None:
    """Frame 1 — The Advisor. Oracle Chat conversation. (Lead frame.)"""
    img = make_background()
    add_stars(img, count=220, seed=51)

    y = 200
    draw_centered_text(img, "THE ADVISOR", font_serif_bold(96), y,
                       color=GOLD, letter_spacing=10)
    y += 160
    draw_divider(img, y)
    y += 100
    y = draw_paragraph(
        img,
        "Oracle Chat continues the conversation — grounded in your behavioral profile.",
        font_serif_italic(46), y, color=MUTED, max_w=1080, line_gap=20,
    )
    y += 80

    # Mocked chat bubbles
    d = ImageDraw.Draw(img)
    fb = font_sans(40)

    def draw_bubble(text: str, y: int, side: str = "user") -> int:
        max_w = 920
        lines = wrap_text(text, fb, max_w - 80)
        line_h = 56
        bw = max_w
        bh = len(lines) * line_h + 80
        if side == "user":
            bx = W - bw - 80
            color = (*GOLD, 240)
            text_color = BG_TOP
        else:
            bx = 80
            color = (40, 30, 65, 240)
            text_color = CREAM
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dl = ImageDraw.Draw(layer)
        dl.rounded_rectangle((bx, y, bx + bw, y + bh),
                             radius=36, fill=color,
                             outline=(*GOLD, 180) if side != "user" else None,
                             width=1)
        img.paste(layer, (0, 0), layer)
        ty = y + 40
        dt = ImageDraw.Draw(img)
        for ln in lines:
            dt.text((bx + 40, ty), ln, font=fb, fill=text_color)
            ty += line_h
        return y + bh + 40

    y = draw_bubble("Why do I keep walking away from things right before they work?", y, side="user")
    y = draw_bubble("You retreat the moment certainty becomes possible. The fear isn't of failure — it's of being seen succeeding. Stay one beat longer than feels comfortable.", y, side="oracle")
    y = draw_bubble("What would 'one beat longer' look like this week?", y, side="user")

    img.save(out, format="PNG", optimize=True)


def screen_subscription(out: Path) -> None:
    """Frame 5 — Always With You. Oracle Pro / ongoing relationship."""
    img = make_background()
    add_stars(img, count=240, seed=83)

    draw_sigil(img, W // 2, int(H * 0.16), 220)

    y = int(H * 0.27)
    draw_centered_text(img, "ALWAYS WITH YOU", font_serif_bold(84), y,
                       color=GOLD, letter_spacing=10)
    y += 140
    draw_centered_text(img, "ORACLE PRO", font_serif_bold(72), y,
                       color=CREAM, letter_spacing=12)
    y += 180
    draw_divider(img, y)
    y += 100
    y = draw_paragraph(
        img,
        "Unlock the complete experience.",
        font_serif_italic(52), y, color=CREAM, max_w=1080, line_gap=20,
    )
    y += 60

    # Bullets
    bullets = [
        "Full session — every dimension of your profile",
        "Your Archetype + Primary Block + Activation Key",
        "Unlimited Oracle Chat access",
        "Deep dives across career, love, money, family",
    ]
    f = font_sans(46)
    d = ImageDraw.Draw(img)
    for b in bullets:
        bbox = d.textbbox((0, 0), "✦  " + b, font=f)
        w = bbox[2] - bbox[0]
        d.text(((W - w) // 2, y), "✦  ", font=f, fill=GOLD)
        d.text(((W - w) // 2 + d.textbbox((0, 0), "✦  ", font=f)[2], y),
               b, font=f, fill=CREAM)
        y += 72

    # Price card
    y += 60
    card_w = 900
    card_h = 280
    card_x = (W - card_w) // 2
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    dl.rounded_rectangle((card_x, y, card_x + card_w, y + card_h),
                         radius=24, fill=(30, 22, 50, 220),
                         outline=GOLD, width=2)
    img.paste(layer, (0, 0), layer)

    draw_centered_text(img, "$9.99 / month", font_serif_bold(80), y + 60,
                       color=GOLD, letter_spacing=2)
    draw_centered_text(img, "Cancel anytime", font_sans(38), y + 170,
                       color=MUTED, letter_spacing=2)

    # CTA pill
    pill_h = 130
    pill_w = 760
    px = (W - pill_w) // 2
    py = y + card_h + 80
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    dl.rounded_rectangle((px, py, px + pill_w, py + pill_h),
                         radius=pill_h // 2, fill=GOLD)
    img.paste(layer, (0, 0), layer)
    f = font_sans(50)
    bbox = ImageDraw.Draw(img).textbbox((0, 0), "Unlock Full Session", font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    ImageDraw.Draw(img).text(
        ((W - tw) // 2, py + (pill_h - th) // 2 - 4),
        "Unlock Full Session", font=f, fill=BG_TOP,
    )

    img.save(out, format="PNG", optimize=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    screens = [
        ("screenshot-1.png", screen_chat),
        ("screenshot-2.png", screen_reading),
        ("screenshot-3.png", screen_profile),
        ("screenshot-4.png", screen_intake),
        ("screenshot-5.png", screen_subscription),
    ]

    for old in OUT_DIR.glob("screenshot_*.png"):
        old.unlink()

    print("=" * 60)
    print("Generating App Store screenshots")
    print(f"Target size: {W} x {H}")
    print("=" * 60)

    passed = 0
    for fname, fn in screens:
        out = OUT_DIR / fname
        fn(out)
        with Image.open(out) as v:
            ok = v.size == (W, H)
            tag = "[PASS]" if ok else "[FAIL]"
            sz = out.stat().st_size
            print(f"{tag} {fname}  {v.size}  mode={v.mode}  {sz} bytes")
            if ok:
                passed += 1

    print("=" * 60)
    print(f"{passed}/{len(screens)} screenshots generated at correct size")
    print("=" * 60)


if __name__ == "__main__":
    main()
