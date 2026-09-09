import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BEND_RANGE,
  DISC_RADIUS,
  LABEL_RADIUS,
  SQUASH_DURATION,
  pointerBendIntensity,
  vertexRigidity,
  isPointerOnDisc,
  squashAmount,
  bendDirection
} from '../fisica.js';

describe('pointerBendIntensity', () => {
  it('è 1 sopra il disco', () => {
    assert.equal(pointerBendIntensity(0), 1);
    assert.equal(pointerBendIntensity(DISC_RADIUS), 1);
  });
  it('decade nella corona e è 0 oltre 1.2 raggi', () => {
    const mid = (DISC_RADIUS + BEND_RANGE) / 2;
    const v = pointerBendIntensity(mid);
    assert.ok(v > 0 && v < 1);
    assert.equal(pointerBendIntensity(BEND_RANGE), 0);
    assert.equal(pointerBendIntensity(BEND_RANGE + 0.01), 0);
  });
});

describe('vertexRigidity', () => {
  it('è 0 sull’etichetta e ~1 sul bordo', () => {
    assert.equal(vertexRigidity(0), 0);
    assert.equal(vertexRigidity(LABEL_RADIUS), 0);
    assert.ok(vertexRigidity(DISC_RADIUS) > 0.99);
  });
});

describe('isPointerOnDisc', () => {
  it('true solo dentro il raggio', () => {
    assert.equal(isPointerOnDisc(DISC_RADIUS), true);
    assert.equal(isPointerOnDisc(DISC_RADIUS + 0.01), false);
  });
});

describe('squashAmount', () => {
  it('è 0 prima del tap e dopo la durata', () => {
    assert.equal(squashAmount(-0.1), 0);
    assert.equal(squashAmount(SQUASH_DURATION), 0);
    assert.equal(squashAmount(SQUASH_DURATION + 1), 0);
  });
  it('è alto subito dopo il tap e poi scende', () => {
    const a = squashAmount(0.05);
    const b = squashAmount(1.5);
    assert.ok(a > 0.5);
    assert.ok(b < a);
    assert.ok(b > 0);
  });
});

describe('bendDirection', () => {
  it('restituisce un vettore unitario', () => {
    const d = bendDirection(3, 4);
    assert.ok(Math.abs(d.x * d.x + d.y * d.y - 1) < 1e-6);
    assert.ok(Math.abs(d.x - 0.6) < 1e-6);
  });
  it('è zero sul centro', () => {
    const d = bendDirection(0, 0);
    assert.equal(d.x, 0);
    assert.equal(d.y, 0);
  });
});
