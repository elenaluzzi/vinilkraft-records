import { PAD_STEPS, PAD_COUNT, SIXTEENTHS_PER_BAR } from './pannello.js';

export function normalizeTheme(id) {
  return id === 'giallo' || id === 'violetto' ? id : 'verde';
}

export function voiceOf(tema) {
  const t = normalizeTheme(tema);
  if (t === 'giallo') return { type: 'sine', gain: 0.08, attack: 0.02, release: 0.35, detune: 0 };
  if (t === 'violetto') return { type: 'triangle', gain: 0.1, attack: 0.03, release: 0.7, detune: -400 };
  return { type: 'sawtooth', gain: 0.12, attack: 0.01, release: 0.18, detune: 0 };
}

export function padKind(tema, index) {
  const t = normalizeTheme(tema);
  if (t === 'giallo') {
    if (index === 5 || index === 7) return 'carpet';
    if (index === 4 || index === 6) return 'rhythm';
    return 'hit';
  }
  if (t === 'violetto') {
    if (index === 4 || index === 5 || index === 6) return 'carpet';
    return 'hit';
  }
  return 'hit';
}

const GIALLO_STEPS = [
  [0, 4, 8, 12],
  [4, 12],
  [0, 2, 4, 6, 8, 10, 12, 14],
  [4, 12],
  [0, 4, 8, 12],
  [],
  [0, 2, 4, 6, 8, 10, 12, 14],
  []
];

const VIOLETTO_STEPS = [
  [0, 8],
  [4, 12],
  [0, 8],
  [6, 14],
  [],
  [],
  [],
  [4, 12]
];

export function padSteps(tema, index) {
  if (index < 0 || index >= PAD_COUNT) return [];
  const t = normalizeTheme(tema);
  if (t === 'giallo') return GIALLO_STEPS[index];
  if (t === 'violetto') return VIOLETTO_STEPS[index];
  return PAD_STEPS[index];
}

export function padShouldHitForTheme(tema, index, sixteenth) {
  const steps = padSteps(tema, index);
  if (!steps.length) return false;
  const s = ((sixteenth % SIXTEENTHS_PER_BAR) + SIXTEENTHS_PER_BAR) % SIXTEENTHS_PER_BAR;
  return steps.indexOf(s) !== -1;
}

const ARP = [130.81, 164.81, 196, 246.94, 261.63, 246.94, 196, 164.81];

export function arpeggioHz(sixteenth) {
  const s = ((sixteenth % SIXTEENTHS_PER_BAR) + SIXTEENTHS_PER_BAR) % SIXTEENTHS_PER_BAR;
  return ARP[Math.floor(s / 2) % ARP.length];
}

export function pitchedHz(hz, pitchDrop) {
  const d = Math.min(1, Math.max(0, pitchDrop || 0));
  return hz * Math.pow(2, -d * 7 / 12);
}

export function squashKind(tema) {
  const t = normalizeTheme(tema);
  if (t === 'giallo') return 'soft';
  if (t === 'violetto') return 'echo';
  return 'harsh';
}

export function padHitRecipe(tema, index, sixteenth) {
  if (padKind(tema, index) === 'carpet') return null;
  const t = normalizeTheme(tema);
  if (t === 'giallo') {
    const recipes = [
      { wave: 'sine', freq: 90, freqEnd: 38, peak: 0.42, attack: 0.006, decay: 0.2, stop: 0.26 },
      { wave: 'noise', filter: 'bandpass', filterHz: 2200, peak: 0.16, attack: 0.004, decay: 0.1, stop: 0.14 },
      { wave: 'noise', filter: 'highpass', filterHz: 7000, peak: 0.1, attack: 0.002, decay: 0.04, stop: 0.08 },
      { wave: 'noise', filter: 'bandpass', filterHz: 1400, peak: 0.18, attack: 0.003, decay: 0.1, stop: 0.14, clap: true },
      { wave: 'sine', freq: 55, peak: 0.22, attack: 0.008, decay: 0.18, stop: 0.22 },
      null,
      { wave: 'sine', freq: arpeggioHz(sixteenth), peak: 0.12, attack: 0.01, decay: 0.12, stop: 0.16 },
      null
    ];
    return recipes[index] || null;
  }
  if (t === 'violetto') {
    const recipes = [
      { wave: 'sine', freq: 70, freqEnd: 28, peak: 0.55, attack: 0.02, decay: 0.35, stop: 0.42 },
      { wave: 'noise', filter: 'bandpass', filterHz: 3200, q: 8, peak: 0.22, attack: 0.001, decay: 0.08, stop: 0.12 },
      { wave: 'sine', freq: 48, peak: 0.35, attack: 0.01, decay: 0.28, stop: 0.32 },
      { wave: 'sine', freq: 1480, peak: 0.12, attack: 0.001, decay: 0.08, stop: 0.1 },
      null,
      null,
      null,
      { wave: 'noise', filter: 'bandpass', filterHz: 400, q: 4, peak: 0.2, attack: 0.004, decay: 0.16, stop: 0.2 }
    ];
    return recipes[index] || null;
  }
  return { verde: true, index };
}

export function padCarpetRecipe(tema, index) {
  if (padKind(tema, index) !== 'carpet') return null;
  const t = normalizeTheme(tema);
  if (t === 'giallo' && index === 5) {
    return { freqs: [220, 277.18, 329.63], type: 'sine', peak: 0.055, attack: 0.08, breathe: true };
  }
  if (t === 'giallo' && index === 7) {
    return { noise: true, filter: 'bandpass', filterHz: 2400, peak: 0.045, attack: 0.12, breathe: false };
  }
  if (t === 'violetto' && index === 4) {
    return { freqs: [174.61, 220], type: 'triangle', peak: 0.07, attack: 0.15, breathe: true };
  }
  if (t === 'violetto' && index === 5) {
    return { noise: true, filter: 'lowpass', filterHz: 700, peak: 0.07, attack: 0.2, breathe: true };
  }
  if (t === 'violetto' && index === 6) {
    return { freqs: [36.71], type: 'sine', peak: 0.14, attack: 0.12, breathe: false };
  }
  return null;
}
