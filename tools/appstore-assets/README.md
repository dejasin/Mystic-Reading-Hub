# Oracle — App Store submission asset pipeline

Batch-processes raw iPhone screenshots and an optional simulator screen
recording into files that meet Apple's **6.9" iPhone 16 Pro Max** specs.

## What it produces

| Asset       | Spec                                                                |
| ----------- | ------------------------------------------------------------------- |
| Screenshots | `1290 × 2796` PNG, 72 DPI, RGB, ≤ 500 KB each                       |
| Preview     | `886 × 1920` H.264 MP4, 30 fps, ≤ 30 s, ≤ 500 MB, opens/ends still  |

Letterboxing uses the Oracle navy backdrop **`#0A0E1A`**. Optional
captions are rendered along the bottom in Oracle gold **`#C9A84C`**.

## Install

```bash
pip install Pillow
# ffmpeg + ffprobe must be on PATH (already provided by the Replit env)
```

## Run

```bash
python tools/appstore-assets/process_assets.py \
    --screenshots-dir path/to/raw_screens \
    --captions tools/appstore-assets/captions.json \
    --video path/to/simulator_recording.mov \
    --output-dir tools/appstore-assets/output
```

`--video` and `--captions` are both optional. Pass either or both inputs.

### Captions file

```json
{
  "01_home.png":     "Your daily reflection, in your hand.",
  "02_reading.png":  "A reading written for who you are.",
  "03_chat.png":     "Ask the Oracle anything."
}
```

Source filenames that are missing from the JSON are exported without a
caption. Output filenames are normalized to `screenshot_01.png`,
`screenshot_02.png`, … in alphabetical order of the source files.

## What the script verifies before exiting

For every output file the script re-opens the result and checks:

- screenshots: exact pixel dimensions, RGB/PNG, ≤ 500 KB
- video: exact pixel dimensions, codec ∈ {h264, hevc}, fps ≈ 30, duration
  ≤ 30 s, file size ≤ 500 MB

A final per-file checklist is printed and the process exits non-zero if
any asset fails its check.
