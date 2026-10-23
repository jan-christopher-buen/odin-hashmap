import test from 'node:test';
import assert from 'node:assert/strict';
import { HashMap } from './hash-map.js';

test('defaults expose capacity, load factor, and an empty count', () => {
  const map = new HashMap();
  assert.equal(map.capacity, 16);
  assert.equal(map.loadFactor, 0.75);
  assert.equal(map.length(), 0);
  assert.throws(() => { map.capacity = 32; }, TypeError);
  assert.throws(() => { map.loadFactor = 1; }, TypeError);
});

test('hash uses the polynomial rule with known collisions', () => {
  const map = new HashMap();
  assert.equal(map.hash(''), 0);
  assert.equal(map.hash('a'), 1);
  assert.equal(map.hash('q'), 1);
  assert.equal(map.hash('A'), 1);
  assert.equal(map.hash('apple'), 10);
  assert.equal(map.hash('😀'), 3);
});

test('very long string hashes remain valid bucket indexes', () => {
  const map = new HashMap();
  const index = map.hash('long-key-😀'.repeat(10000));
  assert.equal(Number.isInteger(index), true);
  assert.ok(index >= 0 && index < map.capacity);
});

test('hash rejects non-string keys without changing defaults', () => {
  const map = new HashMap();
  for (const key of [undefined, null, false, 0, NaN, {}, [], new String('a'), Symbol('a'), 1n, () => {}]) {
    assert.throws(() => map.hash(key), TypeError);
  }
  assert.equal(map.length(), 0);
  assert.equal(map.capacity, 16);
});
