export const LOW_MIDI = 48;
export const HIGH_MIDI = 72;
export const PAD_COUNT = 8;
export const BPM = 120;
export const SIXTEENTHS_PER_BAR = 16;

export const PAD_STEPS = [
  [0, 4, 8, 12],
  [4, 12],
  [0, 2, 4, 6, 8, 10, 12, 14],
  [4, 12],
  [6, 14],
  [8],
  [0, 10],
  [14]
];

export function midiHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isBlackKey(midi) {
  const pc = ((midi % 12) + 12) % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function createPanelState() {
  return { keys: Object.create(null), pads: Array(PAD_COUNT).fill(false) };
}

export function pressKey(state, midi) {
  if (midi < LOW_MIDI || midi > HIGH_MIDI) return;
  state.keys[midi] = true;
}

export function releaseKey(state, midi) {
  delete state.keys[midi];
}

export function heldMidis(state) {
  return Object.keys(state.keys).map(Number).sort((a, b) => a - b);
}

export function togglePad(state, index) {
  if (index < 0 || index >= PAD_COUNT) return false;
  state.pads[index] = !state.pads[index];
  return state.pads[index];
}

export function padOn(state, index) {
  if (index < 0 || index >= PAD_COUNT) return false;
  return state.pads[index] === true;
}

export function padShouldHit(padIndex, sixteenth) {
  if (padIndex < 0 || padIndex >= PAD_COUNT) return false;
  const s = ((sixteenth % SIXTEENTHS_PER_BAR) + SIXTEENTHS_PER_BAR) % SIXTEENTHS_PER_BAR;
  return PAD_STEPS[padIndex].indexOf(s) !== -1;
}
