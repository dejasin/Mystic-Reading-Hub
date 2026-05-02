#!/usr/bin/env python3
"""
Oracle — App Store submission asset pipeline.

Processes raw screenshots and an optional simulator screen recording into
files that meet Apple's 6.9" iPhone 16 Pro Max specs:

  Screenshots
    - 1290 x 2796 px PNG, 72 DPI, RGB, ≤ 500 KB each
    - Letterboxed onto a dark-navy backdrop (#0A0E1A) so non-matching
      aspect ratios do not get stretched
    - Optional gold (#C9A84C) caption rendered along the bottom

  Preview video
    - 886 x 1920 px H.264 MP4, 30 fps, ≤ 30 s, ≤ 500 MB
    - Trimmed and letterboxed onto the same navy backdrop
    - First and last frames frozen as required still frames

Dependencies
    pip install Pillow
    ffmpeg must be on PATH (any modern build with libx264 + libfreetype)

Usage
    python tools/appstore-assets/process_assets.py \\
        --screenshots-dir path/to/raw_screens \\
        --captions tools/appstore-assets/captions.json \\
        --video path/to/simulator_recording.mov \\
        --output-dir tools/appstore-assets/output

The --captions JSON maps source filename → caption string, e.g.
    { "01_home.png": "Your daily reflection, in your hand." }
Files without an entry are exported without a caption.

Both --video and --captions are optional. If --screenshots-dir is omitted
only the video is processed; if --video is omitted only screenshots run.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont


# ── Apple 6.9" iPhone 16 Pro Max specs ───────────────────────────────────────
SCREENSHOT_W, SCREENSHOT_H = 1290, 2796
SCREENSHOT_MAX_BYTES = 500 * 1024
SCREENSHOT_DPI = (72, 72)

VIDEO_W, VIDEO_H = 886, 1920
VIDEO_MAX_SECONDS = 30
VIDEO_FPS = 30
VIDEO_MAX_BYTES = 500 * 1024 * 1024
STILL_FRAME_SECONDS = 0.5  # opening + closing still

# ── Oracle palette ───────────────────────────────────────────────────────────
NAVY = (10, 14, 26)         # #0A0E1A
GOLD = (201, 168, 76)       # #C9A84C

CAPTION_FONT_RATIO = 0.038      # caption height ≈ 3.8% of frame height
CAPTION_BOTTOM_PAD = 120        # px from frame bottom
CAPTION_SIDE_PAD = 90           # px gutter on left/right


# ── Font discovery ───────────────────────────────────────────────────────────
def _find_sans_font() -> Optional[Path]:
    """Locate a clean sans-serif TTF available on this system."""
    candidates = [
        # Common Linux installs
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        # Nix store (Replit) — search lazily below.
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for c in candidates:
        p = Path(c)
        if p.exists():
            return p
    # Fallback: scan the Nix store for any DejaVu / Liberation sans face.
    for root in ("/nix/store",):
        rootp = Path(root)
        if not rootp.exists():
            continue
        for hit in rootp.rglob("DejaVuSans*.ttf"):
            return hit
    return None


_FONT_PATH = _find_sans_font()


def _load_font(px: int) -> ImageFont.ImageFont:
    if _FONT_PATH is None:
        return ImageFont.load_default()
    return ImageFont.truetype(str(_FONT_PATH), size=px)


# ── Screenshot pipeline ──────────────────────────────────────────────────────
@dataclass
class ScreenshotResult:
    src: Path
    dst: Path
    bytes_written: int
    caption: str


def _fit_into_canvas(src: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resize without stretching: scale to fit, center on a navy canvas."""
    src = src.convert("RGB")
    sw, sh = src.size
    scale = min(target_w / sw, target_h / sh)
    new_w = max(1, int(round(sw * scale)))
    new_h = max(1, int(round(sh * scale)))
    resized = src.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), NAVY)
    off = ((target_w - new_w) // 2, (target_h - new_h) // 2)
    canvas.paste(resized, off)
    return canvas


def _draw_caption(img: Image.Image, text: str) -> None:
    if not text:
        return
    draw = ImageDraw.Draw(img)
    font_px = int(round(img.height * CAPTION_FONT_RATIO))
    font = _load_font(font_px)

    # Word-wrap so the caption fits within the side gutters.
    max_text_w = img.width - 2 * CAPTION_SIDE_PAD
    words = text.split()
    lines: list[str] = []
    current = ""
    for w in words:
        trial = (current + " " + w).strip()
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_text_w or not current:
            current = trial
        else:
            lines.append(current)
            current = w
    if current:
        lines.append(current)

    line_h = draw.textbbox((0, 0), "Ag", font=font)[3]
    total_h = line_h * len(lines) + (len(lines) - 1) * int(line_h * 0.25)
    y = img.height - CAPTION_BOTTOM_PAD - total_h
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        x = (img.width - w) // 2
        draw.text((x, y), line, font=font, fill=GOLD)
        y += int(line_h * 1.25)


def _save_under_limit(img: Image.Image, dst: Path) -> int:
    """
    PNG is lossless — there is no quality knob — but we can squeeze the file
    via Pillow's optimize flag and, if still over budget, by paletting the
    backdrop. If even that fails we fall back to pngcrush-style retries
    (level + filter sweep). Apple's 500 KB cap is generous for static UI
    captures so this rarely needs the full sweep.
    """
    img.info["dpi"] = SCREENSHOT_DPI
    # Pass 1 — straight optimized PNG.
    img.save(dst, format="PNG", optimize=True, dpi=SCREENSHOT_DPI)
    if dst.stat().st_size <= SCREENSHOT_MAX_BYTES:
        return dst.stat().st_size

    # Pass 2 — sweep zlib compression levels.
    best = dst.stat().st_size
    for level in (9, 8, 7, 6):
        img.save(dst, format="PNG", optimize=True, compress_level=level, dpi=SCREENSHOT_DPI)
        size = dst.stat().st_size
        if size < best:
            best = size
        if size <= SCREENSHOT_MAX_BYTES:
            return size

    # Pass 3 — quantize to a 256-colour palette. Still lossless-ish for the
    # navy backdrop + UI, and usually halves the file.
    quant = img.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE)
    quant.save(dst, format="PNG", optimize=True, compress_level=9, dpi=SCREENSHOT_DPI)
    return dst.stat().st_size


def process_screenshots(
    src_dir: Path,
    out_dir: Path,
    captions: dict[str, str],
) -> list[ScreenshotResult]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sources = sorted(
        p for p in src_dir.iterdir()
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".heic"}
    )
    results: list[ScreenshotResult] = []
    for idx, src in enumerate(sources, start=1):
        with Image.open(src) as raw:
            framed = _fit_into_canvas(raw, SCREENSHOT_W, SCREENSHOT_H)
        caption = captions.get(src.name, "")
        if caption:
            _draw_caption(framed, caption)
        dst = out_dir / f"screenshot_{idx:02d}.png"
        size = _save_under_limit(framed, dst)
        results.append(ScreenshotResult(src=src, dst=dst, bytes_written=size, caption=caption))
    return results


# ── Video pipeline ───────────────────────────────────────────────────────────
@dataclass
class VideoResult:
    src: Path
    dst: Path
    bytes_written: int
    duration_seconds: float


def _ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out) if out else 0.0


def process_video(src: Path, out_dir: Path) -> VideoResult:
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / "preview_01.mp4"

    # The complex filter does, in order:
    #   1. Scale to fit inside 886x1920 without stretching (force_original_aspect)
    #   2. Pad the rest with the navy backdrop (#0A0E1A)
    #   3. Force 30 fps and SAR=1
    pad_color = "0x0A0E1A"
    vf = (
        f"scale={VIDEO_W}:{VIDEO_H}:force_original_aspect_ratio=decrease,"
        f"pad={VIDEO_W}:{VIDEO_H}:(ow-iw)/2:(oh-ih)/2:color={pad_color},"
        f"setsar=1,fps={VIDEO_FPS}"
    )

    # Trim to the Apple-allowed window. We render through tpad so the first
    # and last frames are explicitly held for STILL_FRAME_SECONDS — Apple's
    # "must start and end on a still frame" requirement.
    body_seconds = max(1.0, VIDEO_MAX_SECONDS - 2 * STILL_FRAME_SECONDS)
    vf_full = (
        vf +
        f",tpad=start_duration={STILL_FRAME_SECONDS}:start_mode=clone"
        f":stop_duration={STILL_FRAME_SECONDS}:stop_mode=clone"
    )

    cmd = [
        "ffmpeg", "-y",
        "-t", f"{body_seconds:.3f}",        # cap raw input duration
        "-i", str(src),
        "-vf", vf_full,
        "-r", str(VIDEO_FPS),
        "-c:v", "libx264",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-preset", "slow",
        "-crf", "20",
        "-movflags", "+faststart",
        "-an",                              # App Store previews can be silent;
                                            # add an audio track upstream if needed.
        str(dst),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return VideoResult(
        src=src,
        dst=dst,
        bytes_written=dst.stat().st_size,
        duration_seconds=_ffprobe_duration(dst),
    )


# ── Verification checklist ───────────────────────────────────────────────────
def _verify_screenshot(r: ScreenshotResult) -> tuple[bool, list[str]]:
    issues: list[str] = []
    with Image.open(r.dst) as img:
        if img.size != (SCREENSHOT_W, SCREENSHOT_H):
            issues.append(f"size {img.size} ≠ {SCREENSHOT_W}x{SCREENSHOT_H}")
        if img.mode != "RGB" and img.mode != "P":
            issues.append(f"mode {img.mode} not RGB/P")
        if img.format != "PNG":
            issues.append(f"format {img.format} not PNG")
    if r.bytes_written > SCREENSHOT_MAX_BYTES:
        issues.append(f"size {r.bytes_written/1024:.0f} KB > 500 KB")
    return (not issues, issues)


def _verify_video(r: VideoResult) -> tuple[bool, list[str]]:
    issues: list[str] = []
    if r.duration_seconds > VIDEO_MAX_SECONDS + 0.05:
        issues.append(f"duration {r.duration_seconds:.2f}s > {VIDEO_MAX_SECONDS}s")
    if r.bytes_written > VIDEO_MAX_BYTES:
        issues.append(f"size {r.bytes_written/1024/1024:.1f} MB > 500 MB")
    # Probe stream info for resolution + fps.
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate,codec_name",
            "-of", "json", str(r.dst),
        ],
        check=True, capture_output=True, text=True,
    )
    info = json.loads(probe.stdout)["streams"][0]
    if (info["width"], info["height"]) != (VIDEO_W, VIDEO_H):
        issues.append(f"video {info['width']}x{info['height']} ≠ {VIDEO_W}x{VIDEO_H}")
    num, den = info["r_frame_rate"].split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    if abs(fps - VIDEO_FPS) > 0.05:
        issues.append(f"fps {fps:.2f} ≠ {VIDEO_FPS}")
    if info["codec_name"] not in {"h264", "hevc"}:
        issues.append(f"codec {info['codec_name']} not h264/hevc")
    return (not issues, issues)


def _print_checklist(
    screenshots: list[ScreenshotResult],
    video: Optional[VideoResult],
) -> bool:
    all_ok = True
    print("\nChecklist — App Store 6.9\" iPhone 16 Pro Max")
    print("─" * 60)
    for r in screenshots:
        ok, issues = _verify_screenshot(r)
        all_ok = all_ok and ok
        mark = "OK " if ok else "BAD"
        kb = r.bytes_written / 1024
        cap = f"  caption: \"{r.caption}\"" if r.caption else ""
        print(f"  [{mark}] {r.dst.name}  ({kb:6.1f} KB){cap}")
        for i in issues:
            print(f"         ↳ {i}")
    if video is not None:
        ok, issues = _verify_video(video)
        all_ok = all_ok and ok
        mark = "OK " if ok else "BAD"
        mb = video.bytes_written / 1024 / 1024
        print(
            f"  [{mark}] {video.dst.name}  ({mb:5.1f} MB, {video.duration_seconds:.2f}s)"
        )
        for i in issues:
            print(f"         ↳ {i}")
    print("─" * 60)
    print("Result:", "ALL CHECKS PASSED" if all_ok else "SOME CHECKS FAILED")
    return all_ok


# ── CLI ──────────────────────────────────────────────────────────────────────
def main() -> int:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("error: ffmpeg/ffprobe must be on PATH", file=sys.stderr)
        return 2

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--screenshots-dir", type=Path, help="folder of raw screenshots")
    ap.add_argument("--video", type=Path, help="raw simulator screen recording")
    ap.add_argument("--captions", type=Path, help="JSON mapping {source_name: caption}")
    ap.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
        help="output folder (default: tools/appstore-assets/output)",
    )
    args = ap.parse_args()

    if not args.screenshots_dir and not args.video:
        ap.error("nothing to do — pass --screenshots-dir and/or --video")

    captions: dict[str, str] = {}
    if args.captions:
        captions = json.loads(args.captions.read_text())
        if not isinstance(captions, dict):
            ap.error("--captions JSON must be an object {filename: caption}")

    args.output_dir.mkdir(parents=True, exist_ok=True)

    shots: list[ScreenshotResult] = []
    if args.screenshots_dir:
        if not args.screenshots_dir.is_dir():
            ap.error(f"--screenshots-dir not found: {args.screenshots_dir}")
        shots = process_screenshots(args.screenshots_dir, args.output_dir, captions)
        print(f"Processed {len(shots)} screenshot(s).")

    video: Optional[VideoResult] = None
    if args.video:
        if not args.video.is_file():
            ap.error(f"--video not found: {args.video}")
        video = process_video(args.video, args.output_dir)
        print(f"Processed video → {video.dst.name}.")

    ok = _print_checklist(shots, video)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
