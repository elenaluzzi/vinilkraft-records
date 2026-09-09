import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { effectParams } from '../audio-params.js';

describe('effectParams', () => {
  it('a zero è pulito', () => {
    const p = effectParams(0, 0);
    assert.equal(p.distortion, 0);
    assert.equal(p.delay, 0);
    assert.equal(p.filterHz, 12000);
    assert.equal(p.glitchGain, 0);
  });
  it('la piega sporca filtro e delay', () => {
    const p = effectParams(1, 0);
    assert.ok(p.distortion > 0.4);
    assert.ok(p.delay > 0.15);
    assert.ok(p.filterHz < 4000);
    assert.equal(p.glitchGain, 0);
  });
  it('lo schiaccia accende il glitch', () => {
    const p = effectParams(0, 1);
    assert.ok(p.glitchGain > 0.6);
    assert.ok(p.distortion > 0.2);
  });
  it('clampa valori fuori range', () => {
    const p = effectParams(9, -2);
    const q = effectParams(1, 0);
    assert.deepEqual(p, q);
  });
});
