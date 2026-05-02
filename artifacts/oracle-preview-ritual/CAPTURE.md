# Capturing Mystic Oracle: Palm Reading App Store Preview Videos

This artifact ships **three independent preview compositions** for the iOS app
**Mystic Oracle: Palm Reading** — _Ritual_, _Reading_, and _Beyond_. Each one
renders inside a fixed portrait stage and adapts to **three Apple-supported
canvases**:

| Size key (`?size=`) | Pixels      | App Store Connect device group   | Output folder            |
|---------------------|-------------|----------------------------------|--------------------------|
| `6.5` _(default)_   |  886 × 1920 | iPhone 6.5" Display              | `public/`                |
| `6.7`               | 1284 × 2778 | iPhone 6.7" Display              | `public/iphone-6.7/`     |
| `ipad`              | 1200 × 1600 | iPad Pro (3rd gen) 12.9", portrait | `public/ipad/`         |

The 6.5" iPhone export is also accepted by App Store Connect for the 6.7" slot,
but using the **native** 1284 × 2778 canvas gives sharper text and renders 1:1
on modern hardware. The iPad canvas reflows the same scenes into a 4:3 portrait
frame — the videos are designed in viewport-relative units, so layouts adapt
without clipping.

## The three previews

| # | Route | Title | Opening hook caption | Approx. duration |
|---|-------|-------|----------------------|------------------|
| I  | `#ritual`  | The Ritual — palm capture        | "Read your palm in seconds."    | ~17.5s |
| II | `#reading` | The Reading Reveal               | "A reading written for you."    | ~23.1s |
| III| `#beyond`  | Beyond the Reading               | "Your daily mystic companion."  | ~26.0s |

Each preview opens on a bold typographic hook caption (visible inside the first
~600 ms, the Apple autoplay-with-sound-off frame) over the gold-on-night
visual language used throughout the brand, then transitions into the in-app
motion (palm capture, streaming reading + Archetype, chat / deep dives /
synastry / vault). Every preview ends on a unified closing brand frame:

> **Mystic Oracle**
> Palm Reading · Astrology · Daily Guidance
> Available on the App Store

All three are auto-playing, loopable, and contain **zero interactive elements**
(no CTAs, no forms, no nav).

The landing page at `/oracle-preview-ritual/` lists all three with size pills
that link to each variant.

## Deterministic playback

The player is wired through the `useVideoPlayer` hook in `src/lib/video/hooks.ts`:

- On mount, it calls `window.startRecording?.()` (a no-op unless an external
  capture script is attached).
- After the **first complete pass** of all scenes, it calls
  `window.stopRecording?.()` once. The stop boundary fires precisely at the end
  of the closing brand frame, so each preview has a single deterministic export
  boundary.
- After that boundary the composition continues to loop indefinitely so
  reviewers can watch it back-to-back, but the recording call only fires once
  per page-load — refresh the page to start a new clean pass.

## Recording an `.mp4` for App Store Connect

Apple accepts App Preview videos as portrait H.264 .mp4 / .mov, 15–30 seconds,
matching the device-group canvas. All three compositions sit comfortably inside
that window at every supported size.

There are two supported workflows. Both produce a frame that exactly matches
the requested stage.

### Option A — Browser screen recording (simplest)

1. Open the artifact preview in a Chromium-based browser at full-screen.
2. Navigate to one preview with the **`?capture=1`** flag set. Add `&size=…` to
   pick the canvas:
   ```
   /oracle-preview-ritual/?capture=1&size=6.5#ritual    → 886 × 1920
   /oracle-preview-ritual/?capture=1&size=6.7#reading   → 1284 × 2778
   /oracle-preview-ritual/?capture=1&size=ipad#beyond   → 1200 × 1600
   ```
   With `?capture=1` the stage renders at its true pixel size (no scale-to-fit),
   surrounded by a black letterbox. This guarantees the captured pixels are 1:1
   with App Store Connect's expected resolution.
3. Use a screen recorder (macOS QuickTime "Screen Recording", OBS, or
   `chrome --headless --record`) to capture exactly the stage region.
4. Refresh the page to begin the recording window. Stop recording the moment
   the composition loops back to its first scene (you'll see the typographic
   hook replay) — the `useVideoPlayer` hook fires `window.stopRecording?.()`
   precisely at this boundary, at the end of the closing brand frame.
5. Trim and export to `.mp4` (H.264, ~30 fps, ≤500 MB). Repeat for each route
   and each size you need.

### Option B — Headless puppeteer + ffmpeg (deterministic, reproducible)

This artifact ships a one-shot headless renderer at
`scripts/record-previews.mjs`. It launches the bundled Chrome (installed via
`puppeteer browsers install chrome`), opens each preview at its exact pixel
canvas with `?capture=1&size=…`, captures frames at 30 fps over the
deterministic playback window, and pipes them to `ffmpeg` to produce H.264 MP4s.

```bash
# Install Chrome once (puppeteer ships its own bundle, ~170 MB).
pnpm --filter @workspace/oracle-preview-ritual exec puppeteer browsers install chrome

# Make sure the dev server is running on the artifact's preview path.
pnpm --filter @workspace/oracle-preview-ritual dev

# Render every preview at every size (default).
pnpm --filter @workspace/oracle-preview-ritual exec node scripts/record-previews.mjs

# Render only one size (6.5 / 6.7 / ipad), or a comma-separated list.
PREVIEW_SIZE=6.7 pnpm --filter @workspace/oracle-preview-ritual exec node scripts/record-previews.mjs
PREVIEW_SIZE=6.7,ipad pnpm --filter @workspace/oracle-preview-ritual exec node scripts/record-previews.mjs

# Render only one preview.
PREVIEW_ONLY=ritual pnpm --filter @workspace/oracle-preview-ritual exec node scripts/record-previews.mjs
```

The script writes one MP4 per preview-size combination:

```
public/01-ritual.mp4               public/01-ritual.mp4 was already at 6.5
public/02-reading.mp4              (the 6.5" exports keep the original
public/03-beyond.mp4               top-level paths for backward compat).

public/iphone-6.7/01-ritual.mp4
public/iphone-6.7/02-reading.mp4
public/iphone-6.7/03-beyond.mp4

public/ipad/01-ritual.mp4
public/ipad/02-reading.mp4
public/ipad/03-beyond.mp4
```

Each is H.264 yuv420p, 30 fps, with `+faststart` for App Store Connect
ingestion, and a silent stereo AAC track (Apple rejects previews with no
audio track at all).

After rendering, run the recording-lifecycle sanity check:

```bash
bash artifacts/oracle-preview-ritual/scripts/validate-recording.sh
```

To verify each export is at its target dimensions:

```bash
for f in $(find artifacts/oracle-preview-ritual/public -name '*.mp4'); do
  echo "$f"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f"
done
```

## Notes for App Store Connect upload

- **One `.mp4` per preview per device group** — three uploads under each device
  group you target.
- **Duration**: 15–30 seconds (all three compositions fit inside this window at
  every supported size).
- **No audio**: these previews are visual-only by design; the muxed silent AAC
  track exists only because App Store Connect rejects previews with no audio
  stream at all.
- **Localization**: English only (per the task scope).

## What you cannot edit (please leave alone)

- `src/lib/video/hooks.ts` — the recording lifecycle is wired to the exact
  `startRecording` / `stopRecording` boundaries. Modifying the hook will break
  Option B and the `?capture=1` workflow.
