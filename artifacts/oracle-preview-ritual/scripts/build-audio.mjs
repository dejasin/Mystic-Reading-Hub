#!/usr/bin/env node
/**
 * Synthesize the App Store preview audio bed and SFX cues for
 * Mystic Oracle: Palm Reading and pre-mix one stereo track per preview.
 *
 * Everything here is generated programmatically with ffmpeg (sine + lavfi
 * sources + filters), so the resulting audio is original, royalty-free, and
 * cleared for App Store use without any third-party attribution.
 *
 * Outputs (under `public/audio/`):
 *   bed.wav            mystical drone (loopable source)
 *   shimmer.wav        palm-trace shimmer SFX
 *   chime.wav          archetype-reveal chime SFX
 *   whoosh.wav         gold-divider whoosh SFX
 *   ritual-mix.wav     pre-mixed track for the Ritual preview
 *   reading-mix.wav    pre-mixed track for the Reading preview
 *   beyond-mix.wav     pre-mixed track for the Beyond preview
 *
 * The per-preview mixes are normalized to ~ -16 LUFS (TP -1.5 dB, LRA 11) so
 * loudness is consistent across all three videos and matches Apple's typical
 * App Preview level target.
 *
 * Cue timings are intentionally aligned to the SCENE_DURATIONS in
 * src/components/video/{Ritual,Reading,Beyond}Video.tsx — keep them in sync
 * if you change those.
 */

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'audio');
mkdirSync(OUT, { recursive: true });

const SR = 48000;

function ff(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
    p.on('error', rej);
  });
}

// ---------- SFX synthesis ----------

// Mystical ambient bed: A2 / E3 / A3 / E4 sine drones, slow tremolo,
// long echo for "hall" depth, gentle low-pass for warmth. 30 s mono source.
async function buildBed() {
  const dur = 30;
  const fc = [
    `sine=f=110:d=${dur}[a]`,
    `sine=f=164.81:d=${dur}[b]`,
    `sine=f=220:d=${dur}[c]`,
    `sine=f=329.63:d=${dur}[d]`,
    `[a][b][c][d]amix=inputs=4:weights=0.55|0.42|0.30|0.10:normalize=0[m]`,
    `[m]tremolo=f=0.17:d=0.28,aecho=0.7:0.55:120|260|400:0.32|0.22|0.14,lowpass=f=2200,highpass=f=60,volume=0.45[o]`,
  ].join(';');
  await ff([
    '-filter_complex', fc,
    '-map', '[o]',
    '-ar', String(SR),
    '-ac', '1',
    resolve(OUT, 'bed.wav'),
  ]);
}

// Palm-trace shimmer: rising glissando + bell harmonics, ~1.4 s.
async function buildShimmer() {
  const dur = 1.4;
  const fc = [
    `aevalsrc=exprs='0.5*sin(2*PI*(1500+1800*t)*t)':d=${dur}:s=${SR}[g]`,
    `sine=f=2200:d=${dur}[h1]`,
    `sine=f=3300:d=${dur}[h2]`,
    `[g][h1][h2]amix=inputs=3:weights=1.0|0.35|0.18:normalize=0[m]`,
    `[m]afade=t=in:st=0:d=0.05,afade=t=out:st=0.5:d=0.9,volume=0.7[o]`,
  ].join(';');
  await ff([
    '-filter_complex', fc,
    '-map', '[o]',
    '-ar', String(SR),
    '-ac', '1',
    resolve(OUT, 'shimmer.wav'),
  ]);
}

// Archetype-reveal chime: bell-like tone (C5 + C6 + G6) with long decay.
async function buildChime() {
  const dur = 1.8;
  const fc = [
    `sine=f=523.25:d=${dur}[r]`,
    `sine=f=1046.5:d=${dur}[r2]`,
    `sine=f=1567.98:d=${dur}[r3]`,
    `[r][r2][r3]amix=inputs=3:weights=1.0|0.45|0.20:normalize=0[m]`,
    `[m]afade=t=in:st=0:d=0.005,afade=t=out:st=0.05:d=${(dur - 0.05).toFixed(3)},aecho=0.7:0.6:80|180:0.3|0.2,volume=0.6[o]`,
  ].join(';');
  await ff([
    '-filter_complex', fc,
    '-map', '[o]',
    '-ar', String(SR),
    '-ac', '1',
    resolve(OUT, 'chime.wav'),
  ]);
}

// Gold-divider whoosh: filtered pink-noise sweep, ~0.7 s.
async function buildWhoosh() {
  const dur = 0.7;
  const fc = [
    `anoisesrc=color=pink:amplitude=0.6:d=${dur}[n]`,
    `[n]highpass=f=200,lowpass=f=4000,afade=t=in:st=0:d=0.1,afade=t=out:st=0.45:d=0.25,volume=0.55[o]`,
  ].join(';');
  await ff([
    '-filter_complex', fc,
    '-map', '[o]',
    '-ar', String(SR),
    '-ac', '1',
    resolve(OUT, 'whoosh.wav'),
  ]);
}

// ---------- Per-preview mixes ----------
//
// Cue offsets (ms from preview start) line up with scene boundaries declared
// in src/components/video/*Video.tsx.
const PREVIEWS = {
  ritual: {
    out: 'ritual-mix.wav',
    durationMs: 17500, // 2800 + 3500 + 7000 + 4200
    cues: [
      { sfx: 'whoosh',  atMs: 2600 },   // hook → frame
      { sfx: 'whoosh',  atMs: 6200 },   // frame → trace
      { sfx: 'shimmer', atMs: 6500 },   // palm-trace shimmer
      { sfx: 'whoosh',  atMs: 13200 },  // trace → close
    ],
  },
  reading: {
    out: 'reading-mix.wav',
    durationMs: 23100, // 2800 + 4800 + 4800 + 6500 + 4200
    cues: [
      { sfx: 'whoosh', atMs: 2600 },    // hook → currents
      { sfx: 'whoosh', atMs: 7500 },    // currents → crossroads
      { sfx: 'whoosh', atMs: 12300 },   // crossroads → archetype
      { sfx: 'chime',  atMs: 12700 },   // archetype reveal
      { sfx: 'whoosh', atMs: 18800 },   // archetype → close
    ],
  },
  beyond: {
    out: 'beyond-mix.wav',
    durationMs: 26000, // 2800 + 5000 + 4500 + 5000 + 4500 + 4200
    cues: [
      { sfx: 'whoosh', atMs: 2600 },    // hook → chat
      { sfx: 'whoosh', atMs: 7700 },    // chat → deepDive
      { sfx: 'whoosh', atMs: 12200 },   // deepDive → synastry
      { sfx: 'whoosh', atMs: 17100 },   // synastry → vault
      { sfx: 'chime',  atMs: 17500 },   // vault reveal
      { sfx: 'whoosh', atMs: 21700 },   // vault → close
    ],
  },
};

async function buildPreviewMix(name, spec) {
  const totalSec = spec.durationMs / 1000;
  const cueInputs = spec.cues.flatMap((c) => ['-i', resolve(OUT, `${c.sfx}.wav`)]);
  const inputs = [
    '-stream_loop', '-1', '-i', resolve(OUT, 'bed.wav'),
    ...cueInputs,
  ];
  const filterParts = [];
  filterParts.push(
    `[0:a]atrim=duration=${totalSec},asetpts=N/SR/TB,` +
      `afade=t=in:st=0:d=1.2,afade=t=out:st=${(totalSec - 1.5).toFixed(3)}:d=1.5,` +
      `volume=0.55[bed]`,
  );
  const cueLabels = [];
  spec.cues.forEach((c, i) => {
    const inIdx = i + 1;
    const lbl = `c${i}`;
    filterParts.push(`[${inIdx}:a]adelay=${c.atMs}|${c.atMs}[${lbl}]`);
    cueLabels.push(`[${lbl}]`);
  });
  filterParts.push(
    `[bed]${cueLabels.join('')}amix=inputs=${1 + cueLabels.length}:normalize=0:dropout_transition=0[mixed]`,
  );
  filterParts.push(
    `[mixed]aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11[out]`,
  );
  await ff([
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[out]',
    '-ar', String(SR),
    '-ac', '2',
    '-t', String(totalSec),
    resolve(OUT, spec.out),
  ]);
  console.log(`  ✓ ${spec.out} (${totalSec.toFixed(2)}s, ${spec.cues.length} cues)`);
}

console.log('Synthesizing source SFX…');
await buildBed();
await buildShimmer();
await buildChime();
await buildWhoosh();
console.log('  ✓ bed.wav · shimmer.wav · chime.wav · whoosh.wav');

console.log('Building per-preview mixes (loudnorm I=-16 LUFS)…');
for (const [name, spec] of Object.entries(PREVIEWS)) {
  await buildPreviewMix(name, spec);
}
console.log('\nAudio assets written to', OUT);
