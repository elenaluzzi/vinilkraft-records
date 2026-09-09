function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function effectParams(piega, schiaccia) {
  const p = clamp01(piega);
  const s = clamp01(schiaccia);
  return {
    distortion: Math.min(1, p * 0.75 + s * 0.45),
    delay: p * 0.28,
    filterHz: 12000 - p * 9000 - s * 2500,
    glitchGain: s * 0.85
  };
}
