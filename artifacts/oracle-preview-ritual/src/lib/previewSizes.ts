/**
 * Apple App Store Connect preview-video device sizes supported by this artifact.
 *
 * Each entry maps a short URL key (`?size=…`) to:
 *  - `width` × `height` — the exact capture dimensions Apple expects.
 *  - `label` — short human-readable name shown in the index page selector.
 *  - `appleSlot` — the App Store Connect device-group slot the export targets.
 *  - `outDir` — relative subfolder under `public/` where rendered MP4s are written.
 *    The default 6.5" iPhone keeps `''` (top level) so existing exports stay in
 *    place; the new sizes drop into per-size subfolders.
 *
 * 6.7" iPhone uses native 1284 × 2778 (sharper than the 886 × 1920 fallback).
 * iPad uses portrait 1200 × 1600 to match the app's portrait-only orientation.
 */
export type PreviewSizeKey = '6.5' | '6.7' | 'ipad';

export interface PreviewSize {
  width: number;
  height: number;
  label: string;
  appleSlot: string;
  outDir: string;
}

export const PREVIEW_SIZES: Record<PreviewSizeKey, PreviewSize> = {
  '6.5': {
    width: 886,
    height: 1920,
    label: '6.5" iPhone',
    appleSlot: 'iPhone 6.5" Display',
    outDir: '',
  },
  '6.7': {
    width: 1284,
    height: 2778,
    label: '6.7" iPhone',
    appleSlot: 'iPhone 6.7" Display',
    outDir: 'iphone-6.7',
  },
  ipad: {
    width: 1200,
    height: 1600,
    label: 'iPad (portrait)',
    appleSlot: 'iPad Pro (3rd gen) 12.9"',
    outDir: 'ipad',
  },
};

export const PREVIEW_SIZE_KEYS: PreviewSizeKey[] = ['6.5', '6.7', 'ipad'];

export const DEFAULT_PREVIEW_SIZE: PreviewSizeKey = '6.5';

export function isPreviewSizeKey(value: string | null | undefined): value is PreviewSizeKey {
  return value !== null && value !== undefined && (PREVIEW_SIZE_KEYS as string[]).includes(value);
}
