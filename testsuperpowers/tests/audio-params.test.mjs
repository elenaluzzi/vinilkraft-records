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
    assert.equal(p.stutter, 0);
    assert.equal(p.dry, 1);
  });
  it('la piega glitcha i bordi, volume sempre pieno', () => {
    const p = effectParams(1, 0);
    const z = effectParams(0, 0);
    assert.ok(p.glitchGain > 0.85);
    assert.ok(p.stutter > 0.75);
    assert.equal(p.dry, 1);
    assert.equal(z.dry, 1);
    assert.ok(p.delay < 0.1);
    assert.ok(p.distortion > 0.6);
    assert.ok(p.filterHz < 5000);
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
  it('senza tema o verde: wow e pitchDrop a zero, delayTime dal glitch', () => {
    const a = effectParams(1, 0);
    const b = effectParams(1, 0, 'verde');
    assert.equal(a.wow, 0);
    assert.equal(a.pitchDrop, 0);
    assert.equal(b.glitchGain, a.glitchGain);
    assert.ok(a.delayTime > 0.05);
  });
  it('giallo: niente glitch/stutter, c\'è wow', () => {
    const p = effectParams(1, 0, 'giallo');
    const z = effectParams(0, 0, 'giallo');
    assert.equal(p.glitchGain, 0);
    assert.equal(p.stutter, 0);
    assert.equal(p.dry, 1);
    assert.ok(p.wow > 0.5);
    assert.equal(p.pitchDrop, 0);
    assert.ok(p.distortion < 0.2);
    assert.equal(z.wow, 0);
  });
  it('violetto: niente stutter, delay profondo e pitchDrop', () => {
    const p = effectParams(1, 0, 'violetto');
    const v = effectParams(1, 0, 'verde');
    assert.equal(p.stutter, 0);
    assert.equal(p.glitchGain, 0);
    assert.ok(p.delay > v.delay);
    assert.ok(p.delayTime > 0.3);
    assert.ok(p.pitchDrop > 0.7);
    assert.equal(p.wow, 0);
  });
});
