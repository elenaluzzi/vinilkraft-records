export const DISC_RADIUS = 1;
export const BEND_RANGE = 1.2;
export const LABEL_RADIUS = 0.22;
export const SQUASH_DURATION = 2;

export function pointerBendIntensity(distFromCenter) {
  if (distFromCenter > BEND_RANGE) return 0;
  if (distFromCenter <= DISC_RADIUS) return 1;
  return 1 - (distFromCenter - DISC_RADIUS) / (BEND_RANGE - DISC_RADIUS);
}

export function vertexRigidity(vertexRadius) {
  if (vertexRadius <= LABEL_RADIUS) return 0;
  const t = (vertexRadius - LABEL_RADIUS) / (DISC_RADIUS - LABEL_RADIUS);
  return Math.min(1, Math.max(0, t));
}

export function isPointerOnDisc(distFromCenter) {
  return distFromCenter <= DISC_RADIUS;
}

export function squashAmount(secondsSinceTap) {
  if (secondsSinceTap < 0 || secondsSinceTap >= SQUASH_DURATION) return 0;
  const t = secondsSinceTap / SQUASH_DURATION;
  return Math.cos((t * Math.PI) / 2) * Math.exp(-1.2 * t);
}

export function bendDirection(px, py) {
  const len = Math.hypot(px, py);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: px / len, y: py / len };
}
