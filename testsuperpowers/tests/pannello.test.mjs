import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOW_MIDI,
  HIGH_MIDI,
  PAD_COUNT,
  FILTER_COUNT,
  BPM,
  SIXTEENTHS_PER_BAR,
  midiHz,
  isBlackKey,
  createPanelState,
  pressKey,
  releaseKey,
  heldMidis,
  togglePad,
  padOn,
  padShouldHit
} from '../pannello.js';

describe('costanti', () => {
  it('due ottave e otto pad a 120', () => {
    assert.equal(LOW_MIDI, 48);
    assert.equal(HIGH_MIDI, 72);
    assert.equal(PAD_COUNT, 8);
    assert.equal(FILTER_COUNT, 4);
    assert.equal(BPM, 120);
    assert.equal(SIXTEENTHS_PER_BAR, 16);
  });
});

describe('midiHz / isBlackKey', () => {
  it('A4 è 440', () => {
    assert.ok(Math.abs(midiHz(69) - 440) < 1e-6);
  });
  it('Do e neri', () => {
    assert.equal(isBlackKey(48), false);
    assert.equal(isBlackKey(49), true);
    assert.equal(isBlackKey(50), false);
  });
});

describe('tasti', () => {
  it('hold e release, ignora fuori range', () => {
    const s = createPanelState();
    pressKey(s, 48);
    pressKey(s, 60);
    pressKey(s, 47);
    pressKey(s, 73);
    assert.deepEqual(heldMidis(s), [48, 60]);
    releaseKey(s, 48);
    assert.deepEqual(heldMidis(s), [60]);
    releaseKey(s, 60);
    assert.deepEqual(heldMidis(s), []);
  });
});

describe('pad latch', () => {
  it('toggle e più pad insieme', () => {
    const s = createPanelState();
    assert.equal(togglePad(s, 0), true);
    assert.equal(togglePad(s, 2), true);
    assert.equal(padOn(s, 0), true);
    assert.equal(padOn(s, 2), true);
    assert.equal(togglePad(s, 0), false);
    assert.equal(padOn(s, 0), false);
    assert.equal(padOn(s, 2), true);
    assert.equal(togglePad(s, -1), false);
    assert.equal(togglePad(s, 8), false);
  });
});

describe('padShouldHit', () => {
  it('cassa sui quarti', () => {
    assert.equal(padShouldHit(0, 0), true);
    assert.equal(padShouldHit(0, 4), true);
    assert.equal(padShouldHit(0, 8), true);
    assert.equal(padShouldHit(0, 12), true);
    assert.equal(padShouldHit(0, 1), false);
  });
  it('wrap del sedicesimo e indice invalido', () => {
    assert.equal(padShouldHit(0, 16), true);
    assert.equal(padShouldHit(9, 0), false);
  });
});
