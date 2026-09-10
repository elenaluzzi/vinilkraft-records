import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_IDS, DEFAULT_THEME, themeOf } from '../temi.js';

describe('temi', () => {
  it('tre temi: verde, violetto, giallo', () => {
    assert.deepEqual(THEME_IDS, ['verde', 'violetto', 'giallo']);
    assert.equal(DEFAULT_THEME, 'verde');
  });
  it('etichette e campioni distinti', () => {
    const v = themeOf('verde');
    const p = themeOf('violetto');
    const g = themeOf('giallo');
    assert.equal(v.label, 'verde acido');
    assert.equal(p.label, 'violetto');
    assert.equal(g.label, 'giallo');
    assert.notEqual(v.swatch, p.swatch);
    assert.notEqual(v.swatch, g.swatch);
    assert.notDeepEqual(v.base, p.base);
    assert.notDeepEqual(v.base, g.base);
  });
  it('id sconosciuto torna al verde', () => {
    assert.equal(themeOf('nope').id, 'verde');
    assert.deepEqual(themeOf('verde').base, [0.08, 0.95, 0.18]);
  });
  it('ogni tema ha un rgb tasti diverso', () => {
    const a = themeOf('verde').keyRgb;
    const b = themeOf('violetto').keyRgb;
    const c = themeOf('giallo').keyRgb;
    assert.match(a, /^\d+, \d+, \d+$/);
    assert.notEqual(a, b);
    assert.notEqual(a, c);
    assert.notEqual(b, c);
  });
});
