#!/usr/bin/env node
/**
 * Re-mux already-rendered preview MP4s, replacing the silent audio track with
 * the matching pre-mixed audio bed under `public/audio/`.
 *
 * Useful when the visuals haven't changed but the audio has been rebuilt — far
 * faster than re-running the full puppeteer + screencast capture in
 * `scripts/record-previews.mjs`.
 *
 * Walks every `public/**\/0[1-3]-*.mp4`, copies the H.264 video stream
 * unchanged, encodes the matching audio mix to AAC 256 kbps stereo @ 48 kHz,
 * and writes back to the same path with `+faststart`.
 */

import { spawn } from 'node:child_process';
import { existsSync, renameSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');
const AUDIO_DIR = resolve(PUBLIC_DIR, 'audio');

const PREVIEWS = [
  { out: '01-ritual.mp4',  audio: 'ritual-mix.wav'  },
  { out: '02-reading.mp4', audio: 'reading-mix.wav' },
  { out: '03-beyond.mp4',  audio: 'beyond-mix.wav'  },
];

const SIZE_DIRS = ['', 'iphone-6.7', 'ipad'];

function ff(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
    p.on('error', rej);
  });
}

let muxed = 0;
let skipped = 0;

for (const sizeDir of SIZE_DIRS) {
  for (const { out, audio } of PREVIEWS) {
    const videoPath = resolve(PUBLIC_DIR, sizeDir, out);
    const audioPath = resolve(AUDIO_DIR, audio);
    if (!existsSync(videoPath)) {
      skipped++;
      continue;
    }
    if (!existsSync(audioPath)) {
      console.warn(`⚠ missing audio ${audioPath}, skipping ${videoPath}`);
      skipped++;
      continue;
    }
    const tmpPath = videoPath + '.tmp.mp4';
    await ff([
      '-i', videoPath,
      '-i', audioPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '256k',
      '-ar', '48000',
      '-ac', '2',
      '-shortest',
      '-movflags', '+faststart',
      tmpPath,
    ]);
    renameSync(tmpPath, videoPath);
    const sizeBytes = statSync(videoPath).size;
    console.log(`  ✓ ${sizeDir ? sizeDir + '/' : ''}${out}  (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
    muxed++;
  }
}

console.log(`\nMuxed ${muxed} video(s), skipped ${skipped}.`);
