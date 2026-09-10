function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function effectParams(piega, schiaccia, tema) {
  const p = clamp01(piega);
  const s = clamp01(schiaccia);
  const t = tema === 'giallo' || tema === 'violetto' ? tema : 'verde';
  if (t === 'giallo') {
    return {
      distortion: Math.min(1, p * 0.12 + s * 0.08),
      delay: p * 0.12 + s * 0.06,
      delayTime: 0.07 + p * 0.05,
      filterHz: 9000 - p * 1800 - s * 800,
      glitchGain: 0,
      stutter: 0,
      dry: 1,
      wow: Math.min(1, p * 0.7 + s * 0.2),
      pitchDrop: 0
    };
  }
  if (t === 'violetto') {
    return {
      distortion: Math.min(1, p * 0.25 + s * 0.15),
      delay: Math.min(0.55, p * 0.42 + s * 0.22),
      delayTime: 0.16 + p * 0.28 + s * 0.1,
      filterHz: 4200 - p * 2200 - s * 800,
      glitchGain: 0,
      stutter: 0,
      dry: 1,
      wow: 0,
      pitchDrop: Math.min(1, p * 0.85 + s * 0.25)
    };
  }
  const glitchGain = Math.min(1, p * 1 + s * 0.85);
  return {
    distortion: Math.min(1, p * 0.88 + s * 0.5),
    delay: p * 0.06 + s * 0.03,
    delayTime: 0.004 + glitchGain * 0.09,
    filterHz: 12000 - p * 8500 - s * 2500,
    glitchGain,
    stutter: Math.min(1, p * 0.92 + s * 0.35),
    dry: 1,
    wow: 0,
    pitchDrop: 0
  };
}
