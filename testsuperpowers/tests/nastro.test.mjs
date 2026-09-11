import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_REC_SEC,
  IDLE,
  RECORDING,
  PLAYING,
  createTapeState,
  isRecLampOn,
  tapRec,
  tapNewTake,
  checkRecLimit,
  onPlayEnded,
  formatTapeTime,
  displayedTapeSec
} from '../nastro.js';

describe('costanti', () => {
  it('tetto 60 s', () => {
    assert.equal(MAX_REC_SEC, 60);
  });
});

describe('tempo nastro', () => {
  it('formatta m:ss e mostra rec in corso o durata ferma', () => {
    assert.equal(formatTapeTime(0), '0:00');
    assert.equal(formatTapeTime(9), '0:09');
    assert.equal(formatTapeTime(60), '1:00');
    const s = createTapeState();
    assert.equal(displayedTapeSec(s, 10), 0);
    tapRec(s, 1);
    assert.equal(displayedTapeSec(s, 4), 3);
    tapRec(s, 5);
    assert.equal(s.tapeSec, 4);
    assert.equal(displayedTapeSec(s, 99), 4);
    tapNewTake(s);
    assert.equal(displayedTapeSec(s, 0), 0);
  });
});

describe('tapRec', () => {
  it('vuoto avvia rec, secondo tap stop+play, poi play, in play no-op', () => {
    const s = createTapeState();
    assert.equal(s.mode, IDLE);
    assert.equal(isRecLampOn(s), false);
    assert.equal(tapRec(s, 1).action, 'startRec');
    assert.equal(s.mode, RECORDING);
    assert.equal(isRecLampOn(s), true);
    assert.equal(s.recStartedAt, 1);
    assert.equal(tapRec(s, 3).action, 'stopRecAndPlay');
    assert.equal(s.mode, PLAYING);
    assert.equal(s.hasTape, true);
    assert.equal(isRecLampOn(s), false);
    onPlayEnded(s);
    assert.equal(s.mode, IDLE);
    assert.equal(s.hasTape, true);
    assert.equal(tapRec(s, 10).action, 'play');
    assert.equal(s.mode, PLAYING);
    assert.equal(tapRec(s, 11).action, 'none');
    assert.equal(s.mode, PLAYING);
  });
});

describe('tapNewTake', () => {
  it('cancella e idle, anche durante rec', () => {
    const s = createTapeState();
    tapRec(s, 0);
    assert.equal(tapNewTake(s).action, 'clear');
    assert.equal(s.mode, IDLE);
    assert.equal(s.hasTape, false);
    assert.equal(isRecLampOn(s), false);
  });
});

describe('checkRecLimit', () => {
  it('a 60 s stop+play, prima no', () => {
    const s = createTapeState();
    tapRec(s, 5);
    assert.equal(checkRecLimit(s, 64.9).action, 'none');
    assert.equal(checkRecLimit(s, 65).action, 'stopRecAndPlay');
    assert.equal(s.mode, PLAYING);
    assert.equal(s.hasTape, true);
    assert.equal(s.tapeSec, MAX_REC_SEC);
  });
});
