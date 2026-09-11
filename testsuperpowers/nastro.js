export const MAX_REC_SEC = 60;
export const IDLE = 'idle';
export const RECORDING = 'recording';
export const PLAYING = 'playing';

export function createTapeState() {
  return { mode: IDLE, hasTape: false, recStartedAt: 0, tapeSec: 0 };
}

export function isRecLampOn(state) {
  return state.mode === RECORDING;
}

export function tapRec(state, nowSec) {
  if (state.mode === PLAYING) return { action: 'none' };
  if (state.mode === RECORDING) {
    state.mode = PLAYING;
    state.hasTape = true;
    state.tapeSec = Math.min(MAX_REC_SEC, Math.max(0, nowSec - state.recStartedAt));
    return { action: 'stopRecAndPlay' };
  }
  if (state.hasTape) {
    state.mode = PLAYING;
    return { action: 'play' };
  }
  state.mode = RECORDING;
  state.recStartedAt = nowSec;
  return { action: 'startRec' };
}

export function tapNewTake(state) {
  state.mode = IDLE;
  state.hasTape = false;
  state.recStartedAt = 0;
  state.tapeSec = 0;
  return { action: 'clear' };
}

export function checkRecLimit(state, nowSec) {
  if (state.mode !== RECORDING) return { action: 'none' };
  if (nowSec - state.recStartedAt < MAX_REC_SEC) return { action: 'none' };
  state.mode = PLAYING;
  state.hasTape = true;
  state.tapeSec = MAX_REC_SEC;
  return { action: 'stopRecAndPlay' };
}

export function onPlayEnded(state) {
  if (state.mode === PLAYING) state.mode = IDLE;
}

export function formatTapeTime(sec) {
  const s = Math.min(MAX_REC_SEC, Math.max(0, Math.floor(sec)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

export function displayedTapeSec(state, nowSec) {
  if (state.mode === RECORDING) {
    return Math.min(MAX_REC_SEC, Math.max(0, nowSec - state.recStartedAt));
  }
  return state.tapeSec;
}
