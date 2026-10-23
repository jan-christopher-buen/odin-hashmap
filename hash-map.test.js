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

test('missing keys return undefined or false', () => {
  const map = new HashMap();
  assert.equal(map.get('missing'), undefined);
  assert.equal(map.has('missing'), false);
  assert.equal(map.remove('missing'), false);
  assert.equal(map.length(), 0);
});

test('set inserts and overwrites only the exact key', () => {
  const map = new HashMap();
  assert.equal(map.set('a', 1), undefined);
  map.set('q', 2);
  map.set('A', 3);
  assert.equal(map.length(), 3);
  assert.equal(map.get('a'), 1);
  assert.equal(map.get('q'), 2);
  assert.equal(map.get('A'), 3);
  map.set('q', 'updated');
  assert.equal(map.get('q'), 'updated');
  assert.equal(map.get('a'), 1);
  assert.equal(map.get('A'), 3);
  assert.equal(map.length(), 3);
  assert.equal(map.capacity, 16);
});

for (const removedKey of ['a', 'q', 'A']) {
  test(`removing collision key ${removedKey} preserves both neighbors`, () => {
    const map = new HashMap();
    map.set('a', 1);
    map.set('q', 2);
    map.set('A', 3);
    assert.equal(map.remove(removedKey), true);
    assert.equal(map.remove(removedKey), false);
    assert.equal(map.has(removedKey), false);
    assert.equal(map.length(), 2);
    for (const [key, value] of [['a', 1], ['q', 2], ['A', 3]]) {
      if (key !== removedKey) assert.equal(map.get(key), value);
    }
    assert.equal(map.remove('absent'), false);
    assert.equal(map.length(), 2);
  });
}

test('values preserve undefined, falsy values, and references', () => {
  const map = new HashMap();
  const object = { name: 'test' };
  const fn = () => 'hello';
  for (const [key, value] of [['u', undefined], ['n', null], ['f', false], ['z', 0], ['o', object], ['fn', fn]]) {
    map.set(key, value);
    assert.equal(map.get(key), value);
    assert.equal(map.has(key), true);
  }
  assert.equal(map.has('absent'), false);
  assert.equal(map.get('absent'), undefined);
  assert.equal(map.length(), 6);
});

test('empty, Unicode, and very long keys are retrievable', () => {
  const map = new HashMap();
  const longKey = 'very-long-😀'.repeat(10000);
  map.set('', 'empty');
  map.set('日本語😀', 'unicode');
  map.set(longKey, 'long');
  assert.equal(map.get(''), 'empty');
  assert.equal(map.get('日本語😀'), 'unicode');
  assert.equal(map.get(longKey), 'long');
  assert.equal(map.has('日本語'), false);
  assert.equal(map.remove(''), true);
  assert.equal(map.length(), 2);
});

test('all key-taking methods reject non-string keys without mutation', () => {
  const map = new HashMap();
  map.set('safe', 10);
  for (const key of [undefined, null, false, 0, NaN, {}, [], new String('a'), Symbol('a'), 1n, () => {}]) {
    assert.throws(() => map.hash(key), TypeError);
    assert.throws(() => map.set(key, 'bad'), TypeError);
    assert.throws(() => map.get(key), TypeError);
    assert.throws(() => map.has(key), TypeError);
    assert.throws(() => map.remove(key), TypeError);
    assert.equal(map.length(), 1);
    assert.equal(map.capacity, 16);
    assert.equal(map.get('safe'), 10);
  }
});

test('map instances own independent chains and counts', () => {
  const first = new HashMap();
  const second = new HashMap();
  first.set('a', 1);
  second.set('a', 2);
  first.remove('a');
  assert.equal(first.length(), 0);
  assert.equal(second.get('a'), 2);
  assert.equal(second.length(), 1);
});
