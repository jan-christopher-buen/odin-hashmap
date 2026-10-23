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

test('empty enumerations return fresh empty arrays', () => {
  const map = new HashMap();
  for (const method of ['keys', 'values', 'entries']) {
    assert.deepEqual(map[method](), []);
    assert.notEqual(map[method](), map[method]());
  }
});

test('enumeration includes collisions and duplicate values without assuming order', () => {
  const map = new HashMap();
  map.set('a', 'same');
  map.set('q', 'same');
  map.set('A', 'other');
  map.set('z', undefined);
  assert.deepEqual(map.keys().sort(), ['A', 'a', 'q', 'z']);
  assert.deepEqual(map.values().sort(), ['other', 'same', 'same', undefined]);
  assert.deepEqual(map.entries().sort(([a], [b]) => a.localeCompare(b)),
    [['a', 'same'], ['A', 'other'], ['q', 'same'], ['z', undefined]].sort(([a], [b]) => a.localeCompare(b)));
});

test('returned arrays and entry pairs cannot change stored keys or values', () => {
  const map = new HashMap();
  const object = { count: 1 };
  map.set('a', object);
  map.set('q', null);
  const keys = map.keys();
  keys.fill('changed');
  const values = map.values();
  values.fill('changed');
  const entries = map.entries();
  const objectPair = entries.find(([key]) => key === 'a');
  assert.equal(objectPair[1], object);
  objectPair[0] = 'changed';
  objectPair[1] = 'changed';
  entries.pop();
  assert.equal(map.get('a'), object);
  assert.equal(map.get('q'), null);
  assert.equal(map.has('changed'), false);
  assert.equal(map.length(), 2);
  const firstPairs = map.entries();
  const secondPairs = map.entries();
  assert.notEqual(firstPairs, secondPairs);
  assert.notEqual(firstPairs[0], secondPairs[0]);
  map.get('a').count = 2;
  assert.equal(object.count, 2);
});

test('clear empties every chain, retains configuration, and allows reuse', () => {
  const map = new HashMap();
  map.set('a', 1);
  map.set('q', 2);
  map.set('A', 3);
  assert.equal(map.clear(), undefined);
  assert.equal(map.length(), 0);
  assert.equal(map.capacity, 16);
  assert.equal(map.loadFactor, 0.75);
  assert.deepEqual(map.keys(), []);
  assert.deepEqual(map.values(), []);
  assert.deepEqual(map.entries(), []);
  assert.equal(map.has('q'), false);
  assert.equal(map.remove('a'), false);
  map.clear();
  map.set('q', undefined);
  assert.equal(map.has('q'), true);
  assert.equal(map.length(), 1);
});

test('exact threshold stays at 16, updates do not grow, and key 13 rehashes', () => {
  const map = new HashMap();
  const pairs = [['a', 1], ['q', 2], ['A', 3], ['b', 4], ['c', 5], ['d', 6],
    ['e', 7], ['f', 8], ['g', 9], ['h', 10], ['i', 11], ['j', 12]];
  for (const [key, value] of pairs) map.set(key, value);
  assert.equal(map.length(), 12);
  assert.equal(map.capacity, 16);
  assert.equal(map.length() / map.capacity, 0.75);
  map.set('q', 'updated');
  map.set('a', undefined);
  assert.equal(map.length(), 12);
  assert.equal(map.capacity, 16);
  map.set('moon', 'silver');
  assert.equal(map.length(), 13);
  assert.equal(map.capacity, 32);
  assert.equal(map.length() / map.capacity, 0.40625);
  assert.equal(map.hash('a'), 1);
  assert.equal(map.hash('q'), 17);
  assert.equal(map.get('a'), undefined);
  assert.equal(map.has('a'), true);
  assert.equal(map.get('q'), 'updated');
  for (const [key, value] of pairs.slice(2)) assert.equal(map.get(key), value);
  assert.equal(map.get('moon'), 'silver');
  map.set('moon', 'bright silver');
  assert.equal(map.length(), 13);
  assert.equal(map.capacity, 32);
  assert.equal(map.get('moon'), 'bright silver');
});

test('multiple expansions preserve entries, references, and CRUD behavior', () => {
  const map = new HashMap();
  const object = { data: 'shared' };
  map.set('object', object);
  for (let index = 0; index < 100; index += 1) map.set(`key-${index}`, index);
  assert.equal(map.length(), 101);
  assert.equal(map.capacity, 256);
  for (let index = 0; index < 100; index += 1) {
    assert.equal(map.get(`key-${index}`), index);
    assert.equal(map.has(`key-${index}`), true);
  }
  assert.equal(map.get('object'), object);
  map.set('key-50', 'changed');
  assert.equal(map.get('key-50'), 'changed');
  assert.equal(map.remove('key-0'), true);
  assert.equal(map.remove('key-99'), true);
  assert.equal(map.remove('missing'), false);
  map.set('new-key', false);
  assert.equal(map.length(), 100);
  assert.equal(map.capacity, 256);
  const expected = [['object', object], ['new-key', false]];
  for (let index = 1; index < 99; index += 1) {
    expected.push([`key-${index}`, index === 50 ? 'changed' : index]);
  }
  const byKey = ([a], [b]) => a.localeCompare(b);
  assert.deepEqual(map.entries().sort(byKey), expected.sort(byKey));
  assert.deepEqual(map.keys().sort(), expected.map(([key]) => key).sort());
  assert.deepEqual(map.values().sort(), expected.map(([, value]) => value).sort());
});

test('clear retains expanded capacity and does not affect another map', () => {
  const map = new HashMap();
  const other = new HashMap();
  other.set('safe', 42);
  for (let index = 0; index < 25; index += 1) map.set(`key-${index}`, index);
  assert.equal(map.capacity, 64);
  assert.equal(map.clear(), undefined);
  assert.equal(map.length(), 0);
  assert.equal(map.capacity, 64);
  assert.equal(map.loadFactor, 0.75);
  assert.deepEqual(map.entries(), []);
  assert.equal(map.has('key-0'), false);
  assert.equal(map.get('key-24'), undefined);
  assert.equal(map.remove('key-10'), false);
  map.set('a', 1);
  map.set('q', 2);
  assert.equal(map.get('a'), 1);
  assert.equal(map.get('q'), 2);
  assert.equal(map.length(), 2);
  assert.equal(map.capacity, 64);
  assert.equal(other.capacity, 16);
  assert.equal(other.get('safe'), 42);
});
