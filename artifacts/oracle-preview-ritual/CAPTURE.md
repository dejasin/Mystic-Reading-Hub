# Capturing Mystic Oracle: Palm Reading App Store Preview Videos

This artifact ships **three independent preview compositions** for the iOS app
**Mystic Oracle: Palm Reading**, each rendered inside a fixed **886 × 1920**
stage (the Apple App Store Connect spec for 6.5" iPhone Display previews).

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

The landing page at `/oracle-preview-ritual/` lists all three with click-throughs.

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

Apple requires App Preview videos at exactly the 6.5" stage dimensions:
**886 × 1920 portrait, H.264, .mp4 or .mov, 15–30 seconds**. All three
compositions sit comfortably inside that window.

There are two supported workflows. Both produce a frame that exactly matches
the stage.

### Option A — Browser screen recording (simplest)

1. Open the artifact preview in a Chromium-based browser at full-screen.
2. Navigate to one preview with the **`?capture=1`** flag set, e.g.:
   ```
   /oracle-preview-ritual/?capture=1#ritual
   /oracle-preview-ritual/?capture=1#reading
   /oracle-preview-ritual/?capture=1#beyond
   ```
   With `?capture=1` the stage renders at its true **886 × 1920** size (no
   scale-to-fit), surrounded by a black letterbox. This guarantees the captured
   pixels are 1:1 with App Store Connect's expected resolution.
3. Use a screen recorder (macOS QuickTime "Screen Recording", OBS, or
   `chrome --headless --record`) to capture exactly the 886 × 1920 region.
4. Refresh the page to begin the recording window. Stop recording the moment
   the composition loops back to its first scene (you'll see the typographic
   hook replay) — the `useVideoPlayer` hook fires `window.stopRecording?.()`
   precisely at this boundary, at the end of the closing brand frame.
5. Trim and export to `.mp4` (H.264, ~30 fps, ≤500 MB). Repeat for each route.

### Option B — Headless puppeteer + ffmpeg (deterministic, reproducible)

This artifact ships a one-shot headless renderer at
`scripts/record-previews.mjs`. It launches the bundled Chrome (installed via
`puppeteer browsers install chrome`), opens each preview at exact 886 × 1920
with `?capture=1`, captures frames at 30 fps over the deterministic playback
window, and pipes them to `ffmpeg` to produce H.264 MP4s.

```bash
# Install Chrome once (puppeteer ships its own bundle, ~170 MB).
pnpm --filter @workspace/oracle-preview-ritual exec puppeteer browsers install chrome

# Make sure the dev server is running on the artifact's preview path.
pnpm --filter @workspace/oracle-preview-ritual dev

# Render all three previews, then drop the .mp4s into public/.
pnpm --filter @workspace/oracle-preview-ritual exec node scripts/record-previews.mjs
```

The script writes:

- `public/01-ritual.mp4`
- `public/02-reading.mp4`
- `public/03-beyond.mp4`

Each is 886 × 1920 H.264 yuv420p, 30 fps, with `+faststart` for App Store
Connect ingestion. Filenames are numbered so the App Store Connect upload
order is obvious.

After rendering, run the recording-lifecycle sanity check:

```bash
bash artifacts/oracle-preview-ritual/scripts/validate-recording.sh
```

## Notes for App Store Connect upload

- **One `.mp4` per preview** — three uploads total, all under the
  **iPhone 6.5" Display** device group.
- **Duration**: 15–30 seconds (all three compositions fit inside this window).
- **No audio**: these previews are visual-only by design. Apple accepts silent
  previews. (Soundtrack work is tracked separately.)
- **Localization**: English only (per the task scope).

## What you cannot edit (please leave alone)

- `src/lib/video/hooks.ts` — the recording lifecycle is wired to the exact
  `startRecording` / `stopRecording` boundaries. Modifying the hook will break
  Option B and the `?capture=1` workflow.
