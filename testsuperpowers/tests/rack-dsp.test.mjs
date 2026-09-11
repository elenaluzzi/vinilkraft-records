import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mixWet, mixDry, dspEq, dspCmp, dspEco, dspRev } from '../rack-dsp.js';
import { defaultParams } from '../rack.js';

describe('mixWet / mixDry', () => {
  it('zero chiude, uno apre, non finito è zero', () => {
    assert.equal(mixWet(0), 0);
    assert.equal(mixDry(0), 1);
    assert.equal(mixWet(1), 1);
    assert.equal(mixDry(1), 0);
    assert.equal(mixWet('x'), 0);
    assert.ok(Math.abs(mixWet(0.5) - 0.5) < 1e-9);
  });
});

describe('dsp a mix 0', () => {
  it('wet a zero sui quattro, bande piatte a 0.5', () => {
    const d = defaultParams();
    const eq = dspEq(d.eq);
    assert.equal(eq.wet, 0);
    assert.equal(eq.dry, 1);
    assert.equal(eq.graviDb, 0);
    assert.equal(eq.mediDb, 0);
    assert.equal(eq.acutiDb, 0);
    const cmp = dspCmp(d.cmp);
    assert.equal(cmp.wet, 0);
    assert.equal(cmp.dry, 1);
    const eco = dspEco(d.eco);
    assert.equal(eco.wet, 0);
    assert.equal(eco.dry, 1);
    const rev = dspRev(d.rev);
    assert.equal(rev.wet, 0);
    assert.equal(rev.dry, 1);
  });
});

describe('dsp a mix 1', () => {
  it('wet pieno e range da laboratorio', () => {
    const eq = dspEq({ mix: 1, gravi: 1, medi: 0, acuti: 1, presenza: 1, brillantezza: 0 });
    assert.equal(eq.wet, 1);
    assert.ok(eq.graviDb >= 10);
    assert.ok(eq.mediDb <= -8);
    const cmp = dspCmp({ mix: 1, soglia: 0, rapporto: 1, attacco: 0 });
    assert.equal(cmp.wet, 1);
    assert.ok(cmp.thresholdDb <= -28);
    assert.ok(cmp.ratio >= 6);
    assert.ok(cmp.attackSec <= 0.01);
    const eco = dspEco({ mix: 1, tempo: 1, ripetizioni: 1 });
    assert.equal(eco.wet, 1);
    assert.ok(eco.delaySec >= 0.45);
    assert.ok(eco.feedback >= 0.55);
    const rev = dspRev({ mix: 1, livello: 1, coda: 1, stanza: 1 });
    assert.equal(rev.wet, 1);
    assert.ok(rev.inputGain >= 0.85);
    assert.ok(rev.decaySec >= 2.2);
    assert.ok(rev.dampHz >= 6000);
  });
});
