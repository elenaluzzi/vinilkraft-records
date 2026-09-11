import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { samplesQuiet, drawPluginGraph } from '../rack-draw.js';

function mockCtx(w, h) {
  const calls = [];
  return {
    calls,
    canvas: { width: w, height: h },
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    clearRect() { calls.push('clear'); },
    beginPath() { calls.push('begin'); },
    moveTo() { calls.push('move'); },
    lineTo() { calls.push('line'); },
    stroke() { calls.push('stroke'); },
    fill() { calls.push('fill'); },
    closePath() { calls.push('close'); },
    fillRect() { calls.push('rect'); }
  };
}

describe('samplesQuiet', () => {
  it('silenzio vs suono', () => {
    assert.equal(samplesQuiet(new Float32Array(8)), true);
    const loud = new Float32Array([0, 0.4, -0.5, 0]);
    assert.equal(samplesQuiet(loud), false);
    assert.equal(samplesQuiet(null), true);
  });
});

describe('drawPluginGraph', () => {
  it('ogni plugin disegna e il silenzio resta quasi vuoto', () => {
    ['rev', 'eco', 'eq', 'cmp'].forEach((id) => {
      const quiet = mockCtx(120, 40);
      drawPluginGraph(quiet, id, new Float32Array(32), '61, 255, 74');
      assert.ok(quiet.calls.indexOf('clear') !== -1);
      const loud = mockCtx(120, 40);
      const s = new Float32Array(32);
      for (let i = 0; i < 32; i++) s[i] = Math.sin(i / 3);
      drawPluginGraph(loud, id, s, '61, 255, 74');
      assert.ok(loud.calls.length > quiet.calls.length);
    });
  });
});
