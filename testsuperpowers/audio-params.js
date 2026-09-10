function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function effectParams(piega, schiaccia) {
  const p = clamp01(piega);
  const s = clamp01(schiaccia);
  const glitchGain = Math.min(1, p * 1 + s * 0.85);
  return {
    distortion: Math.min(1, p * 0.88 + s * 0.5),
    delay: p * 0.06 + s * 0.03,
    filterHz: 12000 - p * 8500 - s * 2500,
    glitchGain,
    stutter: Math.min(1, p * 0.92 + s * 0.35),
    dry: 1
  };
}
