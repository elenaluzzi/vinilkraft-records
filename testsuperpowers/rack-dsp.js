import { clamp01, clampMix } from './rack.js';

export function mixWet(mix) {
  return clampMix(mix);
}

export function mixDry(mix) {
  return 1 - clampMix(mix);
}

export function dspEq(p) {
  const g = (v, span) => (clamp01(v) - 0.5) * span;
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    graviDb: g(p && p.gravi, 24),
    mediDb: g(p && p.medi, 20),
    acutiDb: g(p && p.acuti, 24),
    presenzaDb: g(p && p.presenza, 16),
    brillantezzaDb: g(p && p.brillantezza, 16)
  };
}

export function dspCmp(p) {
  const soglia = clamp01(p && p.soglia);
  const rapporto = clamp01(p && p.rapporto);
  const attacco = clamp01(p && p.attacco);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    thresholdDb: -40 + soglia * 32,
    ratio: 1.5 + rapporto * 8.5,
    attackSec: 0.003 + attacco * 0.037,
    knee: 8,
    releaseSec: 0.12
  };
}

export function dspEco(p) {
  const tempo = clamp01(p && p.tempo);
  const rip = clamp01(p && p.ripetizioni);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    delaySec: 0.14 + tempo * 0.42,
    feedback: 0.12 + rip * 0.58,
    toneHz: 3200
  };
}

export function dspRev(p) {
  const livello = clamp01(p && p.livello);
  const coda = clamp01(p && p.coda);
  const stanza = clamp01(p && p.stanza);
  return {
    wet: mixWet(p && p.mix),
    dry: mixDry(p && p.mix),
    inputGain: 0.25 + livello * 0.75,
    decaySec: 0.7 + coda * 2.1,
    dampHz: 1800 + stanza * 6200
  };
}
