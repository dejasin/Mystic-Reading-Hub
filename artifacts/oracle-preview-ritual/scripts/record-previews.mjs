#!/usr/bin/env node
/**
 * Headless renderer for the Mystic Oracle: Palm Reading App Store previews.
 *
 * Loads each preview at its exact capture stage with ?capture=1 (and
 * &size=6.5|6.7|ipad), uses the Chrome DevTools Protocol screencast stream to
 * capture JPEG frames timestamped by chromium itself (so wall-clock-accurate
 * even when the screencast rate dips below 30 fps), then assembles them into
 * App-Store-Connect-ready H.264 MP4s via ffmpeg concat with explicit per-frame
 * durations. The result has the correct real-time playback length.
 *
 * Stops capture when the page emits window.stopRecording() — which fires
 * exactly at the end of the closing brand frame, after the deterministic
 * useVideoPlayer first pass.
 *
 * Sizes (PREVIEW_SIZE env var, defaults to "all"):
 *   - 6.5  →  886 × 1920    Apple iPhone 6.5" Display       (public/)
 *   - 6.7  → 1284 × 2778    Apple iPhone 6.7" Display       (public/iphone-6.7/)
 *   - ipad → 1200 × 1600    Apple iPad Pro 12.9" portrait   (public/ipad/)
 *   - all  → render every supported size
 *
 * Single preview override: PREVIEW_ONLY=ritual|reading|beyond.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FPS = 30;
const BASE_URL = process.env.PREVIEW_BASE_URL ?? 'http://localhost:5000/oracle-preview-ritual/';
const PUBLIC_DIR = resolve(__dirname, '..', 'public');
const HARD_TIMEOUT_MS = 60_000;

const ALL_SIZES = {
  '6.5': { width: 886,  height: 1920, outDir: '' },
  '6.7': { width: 1284, height: 2778, outDir: 'iphone-6.7' },
  ipad:  { width: 1200, height: 1600, outDir: 'ipad' },
};

const ALL_PREVIEWS = [
  { hash: 'ritual',  out: '01-ritual.mp4',  audio: 'ritual-mix.wav'  },
  { hash: 'reading', out: '02-reading.mp4', audio: 'reading-mix.wav' },
  { hash: 'beyond',  out: '03-beyond.mp4',  audio: 'beyond-mix.wav'  },
];

const AUDIO_DIR = resolve(PUBLIC_DIR, 'audio');

const ONLY = process.env.PREVIEW_ONLY;
const PREVIEWS = ONLY ? ALL_PREVIEWS.filter((p) => p.hash === ONLY) : ALL_PREVIEWS;
if (PREVIEWS.length === 0) throw new Error(`No preview matches PREVIEW_ONLY=${ONLY}`);

const SIZE_FLAG = (process.env.PREVIEW_SIZE ?? 'all').toLowerCase();
const SIZES = SIZE_FLAG === 'all'
  ? Object.entries(ALL_SIZES)
  : SIZE_FLAG.split(',').map((k) => {
      const key = k.trim();
      if (!ALL_SIZES[key]) {
        throw new Error(`Unknown PREVIEW_SIZE="${key}". Use one of: ${Object.keys(ALL_SIZES).join(', ')}, or "all".`);
      }
      return [key, ALL_SIZES[key]];
    });

const browser = await puppeteer.launch({
  headless: 'shell',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  defaultViewport: { width: 886, height: 1920, deviceScaleFactor: 1 },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--hide-scrollbars',
  ],
});

try {
  for (const [sizeKey, size] of SIZES) {
    const outDir = resolve(PUBLIC_DIR, size.outDir);
    mkdirSync(outDir, { recursive: true });

    console.log(`\n=== Size ${sizeKey} (${size.width}×${size.height}) → ${outDir} ===`);

    for (const { hash, out, audio } of PREVIEWS) {
      const url = `${BASE_URL}?capture=1&size=${encodeURIComponent(sizeKey)}#${hash}`;
      const outPath = resolve(outDir, out);
      console.log(`\n— rendering ${hash} @ ${sizeKey} → ${size.outDir ? `${size.outDir}/` : ''}${out}`);
      console.log(`   url: ${url}`);

      const tmp = mkdtempSync(resolve(tmpdir(), `oracle-preview-${sizeKey}-${hash}-`));

      const page = await browser.newPage();
      await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: 1 });

      await page.evaluateOnNewDocument(() => {
        // @ts-ignore
        window.__recordingDone = new Promise((resolve) => {
          let started = false;
          // @ts-ignore
          window.startRecording = async () => { started = true; };
          // @ts-ignore
          window.stopRecording = () => { if (started) resolve(); };
        });
      });

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
      await page.waitForSelector(`[data-capture-stage="${size.width}x${size.height}"]`, { timeout: 10_000 });

      const cdp = await page.createCDPSession();
      /** @type {Array<{ idx: number; ts: number }>} */
      const frameLog = [];
      let frameIdx = 0;
      let stopped = false;

      cdp.on('Page.screencastFrame', async (frame) => {
        const myIdx = frameIdx++;
        try {
          const buf = Buffer.from(frame.data, 'base64');
          writeFileSync(resolve(tmp, `f-${String(myIdx).padStart(6, '0')}.jpg`), buf);
          // metadata.timestamp is seconds since some epoch (monotonic)
          frameLog.push({ idx: myIdx, ts: frame.metadata.timestamp ?? 0 });
        } finally {
          try { await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }); } catch {}
        }
      });

      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 95,
        maxWidth: size.width,
        maxHeight: size.height,
        everyNthFrame: 1,
      });

      const start = Date.now();
      page.evaluate(() => window.__recordingDone).then(() => { stopped = true; });
      while (!stopped && Date.now() - start < HARD_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, 100));
      }

      try { await cdp.send('Page.stopScreencast'); } catch {}
      await new Promise((r) => setTimeout(r, 250));
      await page.close();

      if (!stopped) {
        throw new Error(
          `Hard timeout (${HARD_TIMEOUT_MS} ms) elapsed before window.stopRecording() fired for ${hash} @ ${sizeKey} — refusing to publish a partial capture.`,
        );
      }
      if (frameLog.length < 2) throw new Error(`Captured only ${frameLog.length} frames for ${hash} @ ${sizeKey}`);

      // Build concat list with explicit per-frame durations from chromium timestamps.
      const baseTs = frameLog[0].ts;
      const concatLines = [];
      for (let i = 0; i < frameLog.length; i++) {
        const cur = frameLog[i];
        const next = frameLog[i + 1];
        // Last frame: hold for one nominal frame.
        const dur = next ? Math.max(1 / 1000, next.ts - cur.ts) : 1 / FPS;
        concatLines.push(`file '${resolve(tmp, `f-${String(cur.idx).padStart(6, '0')}.jpg`)}'`);
        concatLines.push(`duration ${dur.toFixed(6)}`);
      }
      // ffmpeg concat demuxer needs the last file repeated
      const lastIdx = frameLog[frameLog.length - 1].idx;
      concatLines.push(`file '${resolve(tmp, `f-${String(lastIdx).padStart(6, '0')}.jpg`)}'`);
      const listPath = resolve(tmp, 'frames.txt');
      writeFileSync(listPath, concatLines.join('\n'));

      const totalDur = frameLog[frameLog.length - 1].ts - baseTs;

      // Mux the per-preview pre-mixed audio bed (mystical drone + cue SFX,
      // pre-normalized to ~ -16 LUFS by scripts/build-audio.mjs). Falls back to
      // a silent stereo AAC track if the audio asset is missing — App Store
      // Connect rejects previews with no audio stream at all.
      const audioPath = audio ? resolve(AUDIO_DIR, audio) : null;
      const hasAudio = audioPath && existsSync(audioPath);
      if (audio && !hasAudio) {
        console.warn(
          `   ⚠ audio asset missing (${audioPath}). Run \`node scripts/build-audio.mjs\` ` +
            `to generate it. Falling back to silent track for this render.`,
        );
      }
      const audioInputArgs = hasAudio
        ? ['-i', audioPath]
        : ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000'];
      await new Promise((res, rej) => {
        const ff = spawn(
          'ffmpeg',
          [
            '-y',
            '-loglevel', 'error',
            '-f', 'concat',
            '-safe', '0',
            '-i', listPath,
            ...audioInputArgs,
            '-vf', `fps=${FPS},scale=${size.width}:${size.height}:flags=lanczos,format=yuv420p`,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-r', String(FPS),
            '-c:a', 'aac',
            '-b:a', '256k',
            '-ar', '48000',
            '-ac', '2',
            '-shortest',
            '-movflags', '+faststart',
            outPath,
          ],
          { stdio: ['ignore', 'inherit', 'inherit'] },
        );
        ff.on('exit', (c) => (c === 0 ? res(undefined) : rej(new Error(`ffmpeg exit ${c}`))));
        ff.on('error', rej);
      });

      rmSync(tmp, { recursive: true, force: true });

      if (!existsSync(outPath)) throw new Error(`ffmpeg produced no output at ${outPath}`);
      const sizeBytes = statSync(outPath).size;
      console.log(
        `   ${frameLog.length} frames · ${totalDur.toFixed(2)}s playback · ` +
        `${(sizeBytes / 1024 / 1024).toFixed(2)} MB → ${size.outDir ? `${size.outDir}/` : ''}${out}`,
      );
    }
  }
} finally {
  await browser.close();
}

console.log('\nAll previews rendered to', PUBLIC_DIR);
