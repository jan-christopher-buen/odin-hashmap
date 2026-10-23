import test from 'node:test';
import assert from 'node:assert/strict';
import { HashSet } from './hash-set.js';

test('set defaults and missing-key behavior', () => {
  const set = new HashSet();
  assert.equal(set.capacity, 16);
  assert.equal(set.loadFactor, 0.75);
  assert.equal(set.length(), 0);
  assert.equal(set.has('missing'), false);
  assert.equal(set.remove('missing'), false);
  assert.deepEqual(set.keys(), []);
  assert.throws(() => { set.capacity = 32; }, TypeError);
  assert.throws(() => { set.loadFactor = 1; }, TypeError);
});

test('set hashing follows known polynomial results', () => {
  const set = new HashSet();
  assert.equal(set.hash(''), 0);
  assert.equal(set.hash('a'), 1);
  assert.equal(set.hash('q'), 1);
  assert.equal(set.hash('A'), 1);
  assert.equal(set.hash('apple'), 10);
  assert.equal(set.hash('😀'), 3);
});

test('add keeps colliding keys distinct and ignores duplicates', () => {
  const set = new HashSet();
  assert.equal(set.add('a'), undefined);
  set.add('q');
  set.add('A');
  assert.equal(set.add('q'), undefined);
  assert.equal(set.length(), 3);
  assert.deepEqual(set.keys().sort(), ['A', 'a', 'q']);
  assert.equal(set.has('a'), true);
  assert.equal(set.has('q'), true);
  assert.equal(set.has('A'), true);
  assert.equal(set.remove('missing'), false);
  assert.deepEqual(set.keys().sort(), ['A', 'a', 'q']);
});

for (const key of ['a', 'q', 'A']) {
  test(`set removal of collision key ${key} preserves other keys`, () => {
    const set = new HashSet();
    for (const value of ['a', 'q', 'A']) set.add(value);
    assert.equal(set.remove(key), true);
    assert.equal(set.remove(key), false);
    assert.equal(set.has(key), false);
    assert.equal(set.length(), 2);
    assert.deepEqual(set.keys().sort(), ['A', 'a', 'q'].filter((value) => value !== key));
    set.add(key);
    assert.equal(set.length(), 3);
    assert.deepEqual(set.keys().sort(), ['A', 'a', 'q']);
  });
}

test('set accepts empty, Unicode, and long string keys', () => {
  const set = new HashSet();
  const longKey = 'long-😀'.repeat(10000);
  set.add('');
  set.add('日本語😀');
  set.add(longKey);
  assert.equal(set.has(''), true);
  assert.equal(set.has('日本語😀'), true);
  assert.equal(set.has(longKey), true);
  const index = set.hash(longKey);
  assert.equal(Number.isInteger(index), true);
  assert.ok(index >= 0 && index < set.capacity);
  assert.equal(set.remove(''), true);
  assert.equal(set.length(), 2);
});

test('set rejects invalid keys consistently without mutation', () => {
  const set = new HashSet();
  set.add('safe');
  for (const key of [undefined, null, false, 0, NaN, {}, [], new String('a'), Symbol('a'), 1n, () => {}]) {
    for (const method of ['hash', 'add', 'has', 'remove']) {
      assert.throws(() => set[method](key), TypeError);
    }
    assert.equal(set.length(), 1);
    assert.equal(set.capacity, 16);
    assert.deepEqual(set.keys(), ['safe']);
  }
});

test('set threshold and duplicates do not grow until key 13', () => {
  const set = new HashSet();
  for (const key of ['a', 'q', 'A', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) set.add(key);
  assert.equal(set.length(), 12);
  assert.equal(set.capacity, 16);
  assert.equal(set.add('q'), undefined);
  assert.equal(set.capacity, 16);
  assert.equal(set.length(), 12);
  set.add('moon');
  assert.equal(set.capacity, 32);
  assert.equal(set.length(), 13);
  assert.equal(set.hash('a'), 1);
  assert.equal(set.hash('q'), 17);
  assert.deepEqual(set.keys().sort(), ['A', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'moon', 'q']);
  set.add('moon');
  assert.equal(set.length(), 13);
  assert.equal(set.capacity, 32);
});

test('set survives repeated expansion, removal, clear, and reuse', () => {
  const set = new HashSet();
  for (let index = 0; index < 100; index += 1) set.add(`key-${index}`);
  assert.equal(set.length(), 100);
  assert.equal(set.capacity, 256);
  for (let index = 0; index < 100; index += 1) assert.equal(set.has(`key-${index}`), true);
  assert.equal(set.remove('key-50'), true);
  assert.equal(set.remove('key-0'), true);
  assert.equal(set.remove('key-99'), true);
  assert.equal(set.length(), 97);
  assert.equal(set.capacity, 256);
  assert.equal(set.has('key-50'), false);
  assert.equal(set.has('key-51'), true);
  assert.equal(set.clear(), undefined);
  assert.equal(set.length(), 0);
  assert.equal(set.capacity, 256);
  assert.equal(set.loadFactor, 0.75);
  assert.deepEqual(set.keys(), []);
  assert.equal(set.has('key-51'), false);
  assert.equal(set.remove('key-51'), false);
  set.clear();
  set.add('fresh');
  assert.deepEqual(set.keys(), ['fresh']);
  assert.equal(set.length(), 1);
});

test('set instances and returned key arrays are independent', () => {
  const first = new HashSet();
  const second = new HashSet();
  first.add('a');
  second.add('q');
  const keys = first.keys();
  keys[0] = 'changed';
  keys.push('extra');
  assert.deepEqual(first.keys(), ['a']);
  assert.notEqual(first.keys(), first.keys());
  first.clear();
  assert.equal(first.length(), 0);
  assert.equal(second.has('q'), true);
  assert.equal(second.has('a'), false);
  assert.equal(second.length(), 1);
});
