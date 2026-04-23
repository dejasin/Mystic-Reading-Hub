#!/usr/bin/env node
/**
 * Headless renderer for the Mystic Oracle: Palm Reading App Store previews.
 *
 * Loads each preview at the exact 886 x 1920 capture stage with ?capture=1,
 * uses the Chrome DevTools Protocol screencast stream to capture JPEG frames
 * timestamped by chromium itself (so wall-clock-accurate even when the
 * screencast rate dips below 30 fps), then assembles them into an
 * App-Store-Connect-ready H.264 MP4 via ffmpeg concat with explicit per-frame
 * durations. The result has the correct real-time playback length.
 *
 * Stops capture when the page emits window.stopRecording() — which fires
 * exactly at the end of the closing brand frame, after the deterministic
 * useVideoPlayer first pass.
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

const STAGE_W = 886;
const STAGE_H = 1920;
const FPS = 30;
const BASE_URL = process.env.PREVIEW_BASE_URL ?? 'http://localhost:5000/oracle-preview-ritual/';
const OUT_DIR = resolve(__dirname, '..', 'public');
const HARD_TIMEOUT_MS = 60_000;

const ALL_PREVIEWS = [
  { hash: 'ritual',  out: '01-ritual.mp4' },
  { hash: 'reading', out: '02-reading.mp4' },
  { hash: 'beyond',  out: '03-beyond.mp4' },
];

const ONLY = process.env.PREVIEW_ONLY;
const PREVIEWS = ONLY ? ALL_PREVIEWS.filter((p) => p.hash === ONLY) : ALL_PREVIEWS;
if (PREVIEWS.length === 0) throw new Error(`No preview matches PREVIEW_ONLY=${ONLY}`);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'shell',
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  defaultViewport: { width: STAGE_W, height: STAGE_H, deviceScaleFactor: 1 },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--hide-scrollbars',
    `--window-size=${STAGE_W},${STAGE_H}`,
  ],
});

try {
  for (const { hash, out } of PREVIEWS) {
    const url = `${BASE_URL}?capture=1#${hash}`;
    const outPath = resolve(OUT_DIR, out);
    console.log(`\n— rendering ${hash} → ${out}`);
    console.log(`   url: ${url}`);

    const tmp = mkdtempSync(resolve(tmpdir(), `oracle-preview-${hash}-`));

    const page = await browser.newPage();
    await page.setViewport({ width: STAGE_W, height: STAGE_H, deviceScaleFactor: 1 });

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
    await page.waitForSelector('[data-capture-stage="886x1920"]', { timeout: 10_000 });

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
      maxWidth: STAGE_W,
      maxHeight: STAGE_H,
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
        `Hard timeout (${HARD_TIMEOUT_MS} ms) elapsed before window.stopRecording() fired for ${hash} — refusing to publish a partial capture.`,
      );
    }
    if (frameLog.length < 2) throw new Error(`Captured only ${frameLog.length} frames for ${hash}`);

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

    // App Store Connect rejects previews with no audio track at all
    // ("corrupt or missing audio"). Mux a silent stereo AAC track that
    // matches Apple's 6.5" preview spec (48 kHz, 256 kbps, stereo).
    await new Promise((res, rej) => {
      const ff = spawn(
        'ffmpeg',
        [
          '-y',
          '-loglevel', 'error',
          '-f', 'concat',
          '-safe', '0',
          '-i', listPath,
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
          '-vf', `fps=${FPS},scale=${STAGE_W}:${STAGE_H}:flags=lanczos,format=yuv420p`,
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
    const size = statSync(outPath).size;
    console.log(
      `   ${frameLog.length} frames · ${totalDur.toFixed(2)}s playback · ` +
      `${(size / 1024 / 1024).toFixed(2)} MB → ${out}`,
    );
  }
} finally {
  await browser.close();
}

console.log('\nAll previews rendered to', OUT_DIR);
