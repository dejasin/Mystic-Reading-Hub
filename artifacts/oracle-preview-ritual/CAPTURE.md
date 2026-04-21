# Capturing The Oracle App Store Preview Videos

This artifact ships **three independent preview compositions**, each rendered inside a fixed **886 × 1920** stage (the Apple App Store Connect spec for 6.5" iPhone Display previews).

## The three previews

| # | Route | Title | Approx. duration |
|---|-------|-------|------------------|
| I | `#ritual` | The Ritual — palm-capture ceremony | ~20s |
| II | `#reading` | The Reading Reveal — streaming reading + Archetype | ~26s |
| III | `#beyond` | Beyond the Reading — Chat, Deep Dives, Synastry, Vault | ~25s |

All three are auto-playing, loopable, and contain **zero interactive elements** (no CTAs, no forms, no nav).

The landing page at `/oracle-preview-ritual/` lists all three with click-throughs.

## Deterministic playback

The player is wired through the `useVideoPlayer` hook in `src/lib/video/hooks.ts`:

- On mount, it calls `window.startRecording?.()` (a no-op unless an external capture script is attached).
- After the **first complete pass** of all scenes, it calls `window.stopRecording?.()` once. Each preview therefore has a single deterministic export boundary.
- After that boundary the composition continues to loop indefinitely so reviewers can watch it back-to-back, but the recording call only fires once per page-load — refresh the page to start a new clean pass.

## Recording an `.mp4` for App Store Connect

Apple requires App Preview videos at exactly the 6.5" stage dimensions: **886 × 1920 portrait, H.264, .mp4 or .mov, 15–30 seconds**.

There are two supported workflows. Both produce a frame that exactly matches the stage.

### Option A — Browser screen recording (simplest)

1. Open the artifact preview in a Chromium-based browser at full-screen.
2. Navigate to one preview with the **`?capture=1`** flag set, e.g.:
   ```
   /oracle-preview-ritual/?capture=1#ritual
   /oracle-preview-ritual/?capture=1#reading
   /oracle-preview-ritual/?capture=1#beyond
   ```
   With `?capture=1` the stage renders at its true **886 × 1920** size (no scale-to-fit), surrounded by a black letterbox. This guarantees the captured pixels are 1:1 with App Store Connect's expected resolution.
3. Use a screen recorder (macOS QuickTime "Screen Recording", OBS, or `chrome --headless --record`) to capture exactly the 886 × 1920 region.
4. Refresh the page to begin the recording window. Stop recording the moment the composition loops back to its first scene (you'll see the title card replay) — the `useVideoPlayer` hook fires `window.stopRecording?.()` precisely at this boundary.
5. Trim and export to `.mp4` (H.264, ~30 fps, ≤500 MB). Repeat for each of the three routes.

### Option B — Headless Chromium + ffmpeg (deterministic, reproducible)

If you want bit-identical reruns, capture each preview headlessly. A minimal recipe:

```bash
# Per preview, run the Chromium headless recorder pointed at the
# capture URL. The page emits window.startRecording() on mount and
# window.stopRecording() at the end of the first pass — wire those
# to start/stop your ffmpeg pipe.
PREVIEW_URL="https://<your-host>/oracle-preview-ritual/?capture=1#ritual"
ffmpeg -framerate 30 -f image2pipe -i pipe:0 \
  -c:v libx264 -pix_fmt yuv420p -s 886x1920 \
  -movflags +faststart oracle-ritual.mp4
```

Repeat with `#reading` and `#beyond`.

## Notes for App Store Connect upload

- **One `.mp4` per preview** — three uploads total, all under the **iPhone 6.5" Display** device group.
- **Duration**: 15–30 seconds (all three compositions fit comfortably inside this window).
- **No audio**: these previews are visual-only by design. Apple accepts silent previews.
- **Localization**: English only (per the task scope).

## What you cannot edit (please leave alone)

- `src/lib/video/hooks.ts` — the recording lifecycle is wired to the exact `startRecording` / `stopRecording` boundaries. Modifying the hook will break Option B and the `?capture=1` workflow.
