"""Generate The Oracle's full icon set:

- icon.png            (1024x1024 RGB, App Store master)
- splash-icon.png     (1024x1024 RGB, splash mirror)
- adaptive-icon.png   (432x432 RGBA, transparent background, foreground sigil
                       inside ~66% safe zone — Android adaptive icon foreground)
- notification-icon.png (96x96 RGBA, monochrome white silhouette — Android
                         notification icon)
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 1024
ASSETS_DIR = Path("artifacts/oracle/assets/images")
ICON_PATH = ASSETS_DIR / "icon.png"
SPLASH_PATH = ASSETS_DIR / "splash-icon.png"
ADAPTIVE_PATH = ASSETS_DIR / "adaptive-icon.png"
NOTIFICATION_PATH = ASSETS_DIR / "notification-icon.png"
APP_JSON_PATH = Path("artifacts/oracle/app.json")


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_background(size: int) -> Image.Image:
    top = (10, 10, 15)
    bottom = (26, 10, 46)
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    cx, cy = size / 2, size * 0.55
    max_d = math.hypot(size, size)
    for y in range(size):
        base = lerp(top, bottom, y / size)
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / max_d
            warm = max(0.0, 0.45 - d) / 0.45
            color = lerp(base, (55, 28, 80), warm)
            px[x, y] = color
    return img


def add_stars(img: Image.Image, count: int = 70) -> None:
    rng = random.Random(11)
    draw = ImageDraw.Draw(img, "RGBA")
    for _ in range(count):
        x = rng.randint(0, SIZE - 1)
        y = rng.randint(0, SIZE - 1)
        # Skip stars that fall over the palm area
        if 0.22 < x / SIZE < 0.78 and 0.18 < y / SIZE < 0.92:
            if rng.random() < 0.85:
                continue
        r = rng.choice([1, 1, 2, 2, 3])
        a = rng.randint(110, 230)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(255, 240, 210, a))


def smooth_curve(points, samples_per_seg: int = 24):
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(len(pts) - 3):
        p0, p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2], pts[i + 3]
        for s in range(samples_per_seg):
            t = s / samples_per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * (
                (2 * p1[0])
                + (-p0[0] + p2[0]) * t
                + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
            )
            y = 0.5 * (
                (2 * p1[1])
                + (-p0[1] + p2[1]) * t
                + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
            )
            out.append((x, y))
    out.append(points[-1])
    return out


def palm_silhouette_mask(size: int) -> Image.Image:
    """Bold, simple hand silhouette as a grayscale mask."""
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)

    cx = size / 2

    palm_top = size * 0.44
    palm_bottom = size * 0.86
    palm_left = size * 0.30
    palm_right = size * 0.70
    d.rounded_rectangle(
        (palm_left, palm_top, palm_right, palm_bottom),
        radius=int(size * 0.13),
        fill=255,
    )

    d.polygon(
        [
            (size * 0.36, size * 0.84),
            (size * 0.64, size * 0.84),
            (size * 0.60, size * 0.97),
            (size * 0.40, size * 0.97),
        ],
        fill=255,
    )

    finger_w = size * 0.085
    finger_gap = size * 0.012
    total_w = finger_w * 4 + finger_gap * 3
    start_x = cx - total_w / 2
    finger_bottom = palm_top + size * 0.05
    finger_tops = [
        size * 0.20,
        size * 0.16,
        size * 0.18,
        size * 0.24,
    ]
    for i in range(4):
        fx = start_x + i * (finger_w + finger_gap)
        top = finger_tops[i]
        d.rounded_rectangle(
            (fx, top, fx + finger_w, finger_bottom),
            radius=int(finger_w / 2),
            fill=255,
        )

    thumb = Image.new("L", (size, size), 0)
    td = ImageDraw.Draw(thumb)
    tw = size * 0.11
    th = size * 0.32
    base_x = size * 0.34
    base_y = size * 0.66
    td.rounded_rectangle(
        (base_x - tw / 2, base_y - th, base_x + tw / 2, base_y + size * 0.02),
        radius=int(tw / 2),
        fill=255,
    )
    thumb = thumb.rotate(55, resample=Image.BICUBIC, center=(base_x, base_y))
    mask = ImageChops.lighter(mask, thumb)

    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    return mask


def colored_silhouette(mask: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", mask.size, color + (0,))
    solid = Image.new("RGBA", mask.size, color + (255,))
    layer.paste(solid, (0, 0), mask)
    return layer


def gold_glow(mask: Image.Image, color=(245, 158, 11), radius=70, intensity=1.0) -> Image.Image:
    glow = Image.new("RGBA", mask.size, color + (0,))
    solid = Image.new("RGBA", mask.size, color + (255,))
    glow.paste(solid, (0, 0), mask)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=radius))
    if intensity != 1.0:
        alpha = glow.split()[3].point(lambda v: min(255, int(v * intensity)))
        glow.putalpha(alpha)
    return glow


def draw_palm_lines(size: int, palm_mask: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    gold = (245, 158, 11, 255)
    bright = (255, 220, 130, 255)
    w = int(size * 0.024)

    heart = [
        (size * 0.36, size * 0.55),
        (size * 0.45, size * 0.51),
        (size * 0.56, size * 0.505),
        (size * 0.66, size * 0.53),
    ]
    head = [
        (size * 0.36, size * 0.63),
        (size * 0.46, size * 0.62),
        (size * 0.58, size * 0.635),
        (size * 0.67, size * 0.665),
    ]
    life = [
        (size * 0.50, size * 0.50),
        (size * 0.43, size * 0.58),
        (size * 0.40, size * 0.68),
        (size * 0.42, size * 0.78),
        (size * 0.50, size * 0.83),
    ]
    fate = [
        (size * 0.58, size * 0.83),
        (size * 0.575, size * 0.77),
        (size * 0.57, size * 0.72),
    ]

    for pts in (heart, head, life, fate):
        smooth = smooth_curve(pts, samples_per_seg=20)
        d.line(smooth, fill=gold, width=w, joint="curve")
        d.line(smooth, fill=bright, width=max(2, w // 3), joint="curve")

    clipped = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    clipped.paste(layer, (0, 0), palm_mask)

    glow = clipped.filter(ImageFilter.GaussianBlur(radius=12))
    out = Image.alpha_composite(Image.new("RGBA", (size, size), (0, 0, 0, 0)), glow)
    out = Image.alpha_composite(out, clipped)
    return out


def draw_focal_orb(size: int) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size / 2, size * 0.66
    for r, a in [(240, 40), (170, 65), (115, 105), (75, 165)]:
        glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 200, 80, a))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=r * 0.35))
        layer = Image.alpha_composite(layer, glow)
    core = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cd = ImageDraw.Draw(core)
    cd.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=(255, 215, 0, 255))
    cd.ellipse((cx - 24, cy - 28, cx + 24, cy + 20), fill=(255, 248, 225, 255))
    core = core.filter(ImageFilter.GaussianBlur(radius=2))
    layer = Image.alpha_composite(layer, core)
    return layer


def render_icon() -> Image.Image:
    bg = make_background(SIZE)
    add_stars(bg, count=60)

    palm_mask = palm_silhouette_mask(SIZE)

    outer_glow = gold_glow(palm_mask, color=(245, 158, 11), radius=95, intensity=1.2)
    amber_glow = gold_glow(palm_mask, color=(255, 180, 60), radius=42, intensity=1.4)

    palm = colored_silhouette(palm_mask, (45, 27, 78))

    lines = draw_palm_lines(SIZE, palm_mask)
    orb = draw_focal_orb(SIZE)

    composite = bg.convert("RGBA")
    composite = Image.alpha_composite(composite, outer_glow)
    composite = Image.alpha_composite(composite, amber_glow)
    composite = Image.alpha_composite(composite, palm)
    composite = Image.alpha_composite(composite, lines)
    composite = Image.alpha_composite(composite, orb)

    return composite.convert("RGB")


def render_adaptive_foreground() -> Image.Image:
    """Adaptive icon foreground: 432x432 RGBA, transparent background.

    Android places this on a 432x432 canvas where the inner ~264x264 (~66%)
    is the always-visible safe zone. Render the sigil at full SIZE then
    downscale and composite it within that safe zone.
    """
    target = 432
    safe = int(target * 0.66)

    palm_mask = palm_silhouette_mask(SIZE)
    outer = gold_glow(palm_mask, color=(245, 158, 11), radius=95, intensity=1.2)
    amber = gold_glow(palm_mask, color=(255, 180, 60), radius=42, intensity=1.4)
    palm = colored_silhouette(palm_mask, (45, 27, 78))
    lines = draw_palm_lines(SIZE, palm_mask)
    orb = draw_focal_orb(SIZE)

    composite = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    composite = Image.alpha_composite(composite, outer)
    composite = Image.alpha_composite(composite, amber)
    composite = Image.alpha_composite(composite, palm)
    composite = Image.alpha_composite(composite, lines)
    composite = Image.alpha_composite(composite, orb)

    scaled = composite.resize((safe, safe), resample=Image.LANCZOS)
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    offset = (target - safe) // 2
    canvas.paste(scaled, (offset, offset), scaled)
    return canvas


def render_notification_icon() -> Image.Image:
    """96x96 RGBA monochrome silhouette for Android notification icon.

    Android renders notification icons as solid white masks tinted by the
    system. Output a transparent canvas with the hand silhouette drawn as
    pure white alpha.
    """
    target = 96
    mask = palm_silhouette_mask(SIZE)
    scaled_mask = mask.resize((target, target), resample=Image.LANCZOS)
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    white = Image.new("RGBA", (target, target), (255, 255, 255, 255))
    canvas.paste(white, (0, 0), scaled_mask)
    return canvas


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    icon = render_icon()
    icon.save(ICON_PATH, format="PNG", optimize=True)
    icon.save(SPLASH_PATH, format="PNG", optimize=True)

    adaptive = render_adaptive_foreground()
    adaptive.save(ADAPTIVE_PATH, format="PNG", optimize=True)

    notification = render_notification_icon()
    notification.save(NOTIFICATION_PATH, format="PNG", optimize=True)

    print("=" * 60)
    print("Verification")
    print("=" * 60)

    checks_passed = 0
    total = 8

    if ICON_PATH.exists():
        print(f"[PASS] icon exists at {ICON_PATH}")
        checks_passed += 1
    else:
        print(f"[FAIL] icon missing at {ICON_PATH}")

    with Image.open(ICON_PATH) as v:
        if v.size == (1024, 1024):
            print("[PASS] icon size 1024x1024")
            checks_passed += 1
        else:
            print(f"[FAIL] icon size {v.size}")
        if v.mode == "RGB":
            print("[PASS] icon mode RGB (no alpha)")
            checks_passed += 1
        else:
            print(f"[FAIL] icon mode {v.mode}")

    fsize = ICON_PATH.stat().st_size
    if fsize > 50 * 1024:
        print(f"[PASS] icon file size {fsize} bytes (> 50KB)")
        checks_passed += 1
    else:
        print(f"[FAIL] icon file size {fsize} bytes (<= 50KB)")

    if ADAPTIVE_PATH.exists():
        with Image.open(ADAPTIVE_PATH) as v:
            if v.size == (432, 432) and v.mode == "RGBA":
                print(f"[PASS] adaptive 432x432 RGBA at {ADAPTIVE_PATH}")
                checks_passed += 1
            else:
                print(f"[FAIL] adaptive size/mode: {v.size} / {v.mode}")
    else:
        print(f"[FAIL] adaptive missing at {ADAPTIVE_PATH}")

    if NOTIFICATION_PATH.exists():
        with Image.open(NOTIFICATION_PATH) as v:
            if v.size == (96, 96) and v.mode == "RGBA":
                print(f"[PASS] notification 96x96 RGBA at {NOTIFICATION_PATH}")
                checks_passed += 1
            else:
                print(f"[FAIL] notification size/mode: {v.size} / {v.mode}")
    else:
        print(f"[FAIL] notification missing at {NOTIFICATION_PATH}")

    with open(APP_JSON_PATH) as f:
        app = json.load(f)
    icon_ok = app["expo"]["icon"] == "./assets/images/icon.png"
    splash_ok = app["expo"]["splash"]["image"] == "./assets/images/splash-icon.png"
    adaptive_cfg_ok = (
        app["expo"]["android"]["adaptiveIcon"]["foregroundImage"]
        == "./assets/images/adaptive-icon.png"
    )
    if icon_ok and splash_ok:
        print("[PASS] app.json icon + splash paths")
        checks_passed += 1
    else:
        print(f"[FAIL] icon_ok={icon_ok} splash_ok={splash_ok}")

    if adaptive_cfg_ok:
        print("[PASS] app.json android.adaptiveIcon.foregroundImage path")
        checks_passed += 1
    else:
        print("[FAIL] app.json adaptiveIcon path missing or wrong")

    if SPLASH_PATH.exists() and SPLASH_PATH.stat().st_size == ICON_PATH.stat().st_size:
        print(f"[INFO] splash-icon.png mirrored ({SPLASH_PATH.stat().st_size} bytes)")

    print("=" * 60)
    print(f"{checks_passed}/{total} checks passed")
    print("=" * 60)


if __name__ == "__main__":
    main()
