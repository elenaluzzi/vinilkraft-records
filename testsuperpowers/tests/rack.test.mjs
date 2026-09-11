import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NARROW_PX,
  STORAGE_KEY,
  PLUGIN_IDS,
  PLUGIN_LABELS,
  PLUGIN_TITLES,
  PLUGIN_ARIA,
  CONTROLS,
  isNarrowViewport,
  clamp01,
  defaultParams,
  parseParams,
  loadParams,
  createRackState,
  togglePlugin,
  closePlugin,
  setParam
} from '../rack.js';

function mem(initial) {
  const m = new Map(initial ? Object.entries(initial) : []);
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); }
  };
}

describe('costanti plugin', () => {
  it('quattro id, sigle e titoli', () => {
    assert.deepEqual(PLUGIN_IDS, ['rev', 'eco', 'eq', 'cmp']);
    assert.equal(PLUGIN_LABELS.rev, 'REV');
    assert.equal(PLUGIN_LABELS.eco, 'ECO');
    assert.equal(PLUGIN_LABELS.eq, 'EQ');
    assert.equal(PLUGIN_LABELS.cmp, 'CMP');
    assert.equal(PLUGIN_TITLES.rev, 'RIVERBERO');
    assert.equal(PLUGIN_TITLES.eco, 'ECO');
    assert.equal(PLUGIN_TITLES.eq, 'EQUALIZZATORE');
    assert.equal(PLUGIN_TITLES.cmp, 'COMPRESSORE');
    assert.equal(PLUGIN_ARIA.rev, 'riverbero');
    assert.equal(PLUGIN_ARIA.eco, 'eco');
    assert.equal(PLUGIN_ARIA.eq, 'equalizzatore');
    assert.equal(PLUGIN_ARIA.cmp, 'compressore');
    assert.equal(NARROW_PX, 700);
    assert.equal(STORAGE_KEY, 'vinile_rack');
    assert.deepEqual(CONTROLS.rev.map((c) => c.id), ['livello', 'coda', 'stanza', 'mix']);
    assert.deepEqual(CONTROLS.eco.map((c) => c.id), ['tempo', 'ripetizioni', 'mix']);
    assert.deepEqual(CONTROLS.eq.map((c) => c.id), ['gravi', 'medi', 'acuti', 'presenza', 'brillantezza']);
    assert.deepEqual(CONTROLS.cmp.map((c) => c.id), ['soglia', 'rapporto', 'attacco', 'mix']);
  });
});

describe('viewport', () => {
  it('stretto sotto 700', () => {
    assert.equal(isNarrowViewport(699), true);
    assert.equal(isNarrowViewport(700), false);
    assert.equal(isNarrowViewport(1280), false);
  });
});

describe('toggle', () => {
  it('apre, sostituisce, chiude, ignora id falso', () => {
    const s = createRackState(mem());
    assert.equal(s.open, null);
    assert.equal(togglePlugin(s, 'rev'), 'rev');
    assert.equal(togglePlugin(s, 'eq'), 'eq');
    assert.equal(s.open, 'eq');
    assert.equal(togglePlugin(s, 'eq'), null);
    assert.equal(togglePlugin(s, 'nope'), null);
    closePlugin(s);
    togglePlugin(s, 'cmp');
    closePlugin(s);
    assert.equal(s.open, null);
  });
});

describe('params', () => {
  it('default 0.5, clamp, persistenza, JSON rotto', () => {
    assert.equal(clamp01(-1), 0);
    assert.equal(clamp01(2), 1);
    assert.equal(clamp01('x'), 0.5);
    const d = defaultParams();
    assert.equal(d.rev.coda, 0.5);
    assert.equal(d.eq.gravi, 0.5);
    const broken = parseParams('{');
    assert.equal(broken.cmp.mix, 0.5);
    const st = mem();
    const s = createRackState(st);
    assert.equal(setParam(s, 'rev', 'coda', 0.8), 0.8);
    assert.equal(s.params.rev.coda, 0.8);
    const s2 = createRackState(st);
    assert.equal(s2.params.rev.coda, 0.8);
    assert.equal(s2.open, null);
    assert.equal(setParam(s, 'rev', 'ghost', 1), 0.5);
    const empty = loadParams(null);
    assert.equal(empty.eco.tempo, 0.5);
  });
});
