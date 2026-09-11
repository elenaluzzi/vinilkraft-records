import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_Y,
  GRID_STEP,
  gridLine,
  gridFade
} from '../pavimento.js';

describe('pavimento Superstudio', () => {
  it('sta sotto il bordo basso del disco inclinato', () => {
    assert.ok(FLOOR_Y < -0.24);
  });

  it('linea bianca sugli assi della maglia, cella nera in mezzo', () => {
    assert.ok(gridLine(0, 0) > 0.8);
    assert.ok(gridLine(GRID_STEP, 0) > 0.8);
    assert.ok(gridLine(GRID_STEP / 2, GRID_STEP / 2) < 0.05);
  });

  it('si perde in lontananza e resta piena vicino al disco', () => {
    assert.equal(gridFade(0, 0), 1);
    assert.equal(gridFade(0, 20), 0);
  });
});
