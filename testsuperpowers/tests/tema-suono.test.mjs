import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PAD_STEPS } from '../pannello.js';
import {
  normalizeTheme,
  voiceOf,
  padKind,
  padSteps,
  padShouldHitForTheme,
  arpeggioHz,
  padHitRecipe,
  padCarpetRecipe,
  squashKind,
  pitchedHz
} from '../tema-suono.js';

describe('normalizeTheme', () => {
  it('giallo e violetto restano, il resto è verde', () => {
    assert.equal(normalizeTheme('giallo'), 'giallo');
    assert.equal(normalizeTheme('violetto'), 'violetto');
    assert.equal(normalizeTheme('verde'), 'verde');
    assert.equal(normalizeTheme('nope'), 'verde');
    assert.equal(normalizeTheme(undefined), 'verde');
  });
});

describe('voiceOf', () => {
  it('verde sawtooth coda breve, giallo sine tenue, violetto triangle coda lunga', () => {
    const v = voiceOf('verde');
    const g = voiceOf('giallo');
    const p = voiceOf('violetto');
    assert.equal(v.type, 'sawtooth');
    assert.equal(v.gain, 0.12);
    assert.equal(v.attack, 0.01);
    assert.equal(v.release, 0.18);
    assert.equal(v.detune, 0);
    assert.equal(g.type, 'sine');
    assert.ok(g.gain < v.gain);
    assert.ok(g.release > v.release);
    assert.equal(p.type, 'triangle');
    assert.ok(p.release > g.release);
    assert.ok(p.detune < 0);
  });
});

describe('padKind', () => {
  it('verde tutti hit', () => {
    for (let i = 0; i < 8; i++) assert.equal(padKind('verde', i), 'hit');
  });
  it('giallo 1-4 hit, basso e arpeggio rhythm, accordi e aria carpet', () => {
    assert.equal(padKind('giallo', 0), 'hit');
    assert.equal(padKind('giallo', 3), 'hit');
    assert.equal(padKind('giallo', 4), 'rhythm');
    assert.equal(padKind('giallo', 5), 'carpet');
    assert.equal(padKind('giallo', 6), 'rhythm');
    assert.equal(padKind('giallo', 7), 'carpet');
  });
  it('violetto 1-4 e 8 hit, 5-7 carpet', () => {
    assert.equal(padKind('violetto', 0), 'hit');
    assert.equal(padKind('violetto', 3), 'hit');
    assert.equal(padKind('violetto', 4), 'carpet');
    assert.equal(padKind('violetto', 5), 'carpet');
    assert.equal(padKind('violetto', 6), 'carpet');
    assert.equal(padKind('violetto', 7), 'hit');
  });
});

describe('padSteps', () => {
  it('verde riusa PAD_STEPS', () => {
    for (let i = 0; i < 8; i++) assert.deepEqual(padSteps('verde', i), PAD_STEPS[i]);
  });
  it('tappeti senza passi griglia', () => {
    assert.deepEqual(padSteps('giallo', 5), []);
    assert.deepEqual(padSteps('giallo', 7), []);
    assert.deepEqual(padSteps('violetto', 4), []);
    assert.deepEqual(padSteps('violetto', 5), []);
    assert.deepEqual(padSteps('violetto', 6), []);
  });
  it('giallo basso sui quarti, arpeggio sugli ottavi', () => {
    assert.deepEqual(padSteps('giallo', 4), [0, 4, 8, 12]);
    assert.deepEqual(padSteps('giallo', 6), [0, 2, 4, 6, 8, 10, 12, 14]);
  });
});

describe('padShouldHitForTheme', () => {
  it('verde cassa sui quarti', () => {
    assert.equal(padShouldHitForTheme('verde', 0, 0), true);
    assert.equal(padShouldHitForTheme('verde', 0, 1), false);
    assert.equal(padShouldHitForTheme('verde', 0, 16), true);
  });
  it('carpet mai sulla griglia', () => {
    assert.equal(padShouldHitForTheme('giallo', 5, 0), false);
    assert.equal(padShouldHitForTheme('violetto', 4, 0), false);
  });
});

describe('arpeggioHz e pitchedHz', () => {
  it('arpeggio sale e pitchedHz scende con pitchDrop', () => {
    assert.ok(arpeggioHz(2) > arpeggioHz(0));
    assert.equal(pitchedHz(100, 0), 100);
    assert.ok(pitchedHz(100, 1) < 70);
  });
});

describe('ricette e squash', () => {
  it('squash: verde harsh, giallo soft, violetto echo', () => {
    assert.equal(squashKind('verde'), 'harsh');
    assert.equal(squashKind('giallo'), 'soft');
    assert.equal(squashKind('violetto'), 'echo');
  });
  it('hit giallo ha ricetta, carpet no', () => {
    assert.ok(padHitRecipe('giallo', 0, 0));
    assert.equal(padHitRecipe('giallo', 5, 0), null);
    assert.ok(padCarpetRecipe('giallo', 5));
    assert.equal(padCarpetRecipe('giallo', 0), null);
    assert.ok(padCarpetRecipe('violetto', 4));
    assert.equal(padHitRecipe('violetto', 7, 0).wave, 'noise');
  });
  it('arpeggio usa la frequenza della scala', () => {
    assert.equal(padHitRecipe('giallo', 6, 0).freq, arpeggioHz(0));
  });
});
