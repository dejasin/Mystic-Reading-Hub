# Capturing Oracle: AI Life Advisor App Store Preview Videos

This artifact ships **three independent preview compositions** for the iOS app
**Oracle: AI Life Advisor** — _Ritual_, _Session_, and _Beyond_. Each one
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
| I  | `#ritual`  | The Ritual — palm capture        | "Your session starts with your palm." | ~17.5s |
| II | `#reading` | The Session Reveal               | "A session written for you."          | ~23.1s |
| III| `#beyond`  | Beyond the Session               | "Your daily AI life advisor."         | ~26.0s |

Each preview opens on a bold typographic hook caption (visible inside the first
~600 ms, the Apple autoplay-with-sound-off frame) over the gold-on-night
visual language used throughout the brand, then transitions into the in-app
motion (palm capture, streaming session + Archetype, chat / deep dives /
synastry / vault). Every preview ends on a unified closing brand frame:

> **Oracle**
> Powered by your palm · Guided by AI
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
ingestion, and a stereo AAC audio track at 48 kHz / 256 kbps containing the
preview's pre-mixed mystical ambient bed plus its synchronized cue SFX
(palm-trace shimmer, archetype-reveal chime, and gold-divider whooshes).

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

## Audio: ambient bed + cue SFX

Audio is **synthesized programmatically** by `scripts/build-audio.mjs` using
`ffmpeg` lavfi sources (`sine`, `aevalsrc`, `anoisesrc`) and filters
(`amix`, `aecho`, `tremolo`, `afade`, `loudnorm`). Because every sample is
generated locally from primitive oscillators and noise, the resulting audio
is original, royalty-free, and cleared for App Store use without any
third-party attribution.

Source SFX written to `public/audio/`:

| File           | What it is                                                 |
|----------------|-------------------------------------------------------------|
| `bed.wav`      | Mystical ambient drone (A2 / E3 / A3 / E4 sines + tremolo) |
| `shimmer.wav`  | Palm-trace shimmer — rising glissando + bell harmonics      |
| `chime.wav`    | Archetype-reveal chime — C5/C6/G6 bell with long decay      |
| `whoosh.wav`   | Gold-divider whoosh — band-passed pink-noise sweep          |

Per-preview pre-mixes (also under `public/audio/`) place those cues at the
exact scene boundaries from `src/components/video/{Ritual,Reading,Beyond}Video.tsx`
on top of the ambient bed, fade the bed in/out at the start/end, and apply
EBU R128 `loudnorm` to **I = -16 LUFS, TP = -1.5 dB, LRA = 11** so the three
previews sound consistent next to each other:

```
public/audio/ritual-mix.wav    17.50 s · 4 cues
public/audio/reading-mix.wav   23.10 s · 5 cues
public/audio/beyond-mix.wav    26.00 s · 6 cues
```

### Rebuilding

```bash
# Synthesize source SFX and per-preview mixes (idempotent, ~2 s on this box).
pnpm --filter @workspace/oracle-preview-ritual run build:audio

# If only the audio changed (visuals are unchanged), re-mux the already-rendered
# MP4s in place — much faster than re-running the full headless capture.
pnpm --filter @workspace/oracle-preview-ritual run mux:audio
```

`scripts/record-previews.mjs` automatically picks up the matching pre-mix for
each preview (`ritual-mix.wav`, `reading-mix.wav`, `beyond-mix.wav`) and muxes
it into the exported MP4. If a mix is missing it falls back to a silent stereo
AAC track and prints a warning.

If you change `SCENE_DURATIONS` in any of the three `*Video.tsx` files, update
the `cues` and `durationMs` for that preview in `scripts/build-audio.mjs` and
re-run `build:audio` so the cues stay aligned to the visuals.

## Notes for App Store Connect upload

- **One `.mp4` per preview per device group** — three uploads under each device
  group you target.
- **Duration**: 15–30 seconds (all three compositions fit inside this window at
  every supported size).
- **Audio**: each MP4 ships with a synchronized stereo AAC track containing a
  mystical ambient bed plus the cue SFX timed to the visual beats. The mixes
  are pre-normalized to roughly **-16 LUFS** (true-peak ≤ -1.5 dBFS, LRA 11)
  so loudness is consistent across all three previews and matches Apple's
  typical App Preview level target. Because Apple autoplays previews with
  sound on by default, the audio is intentionally subtle — no voice-over.
- **Localization**: English only (per the task scope).

## What you cannot edit (please leave alone)

- `src/lib/video/hooks.ts` — the recording lifecycle is wired to the exact
  `startRecording` / `stopRecording` boundaries. Modifying the hook will break
  Option B and the `?capture=1` workflow.
