import assert from 'node:assert/strict';
import { HashMap } from './hash-map.js';
import { HashSet } from './hash-set.js';

const map = new HashMap();

function showStats(label) {
  console.log(label, {
    length: map.length(),
    capacity: map.capacity,
    loadFactor: map.loadFactor,
    currentLoad: map.length() / map.capacity,
  });
}

showStats('Initial map:');
const initialEntries = [
  ['apple', 'red'],
  ['banana', 'yellow'],
  ['carrot', 'orange'],
  ['dog', 'brown'],
  ['elephant', 'gray'],
  ['frog', 'green'],
  ['grape', 'purple'],
  ['hat', 'black'],
  ['ice cream', 'white'],
  ['jacket', 'blue'],
  ['kite', 'pink'],
  ['lion', 'golden'],
];
for (const [key, value] of initialEntries) map.set(key, value);
assert.equal(map.length(), 12);
assert.equal(map.capacity, 16);
showStats('After 12 entries:');

map.set('apple', 'green');
map.set('banana', 'gold');
assert.equal(map.length(), 12);
assert.equal(map.capacity, 16);
showStats('After updating apple and banana:');

map.set('moon', 'silver');
assert.equal(map.length(), 13);
assert.equal(map.capacity, 32);
showStats('After adding moon:');

const expectedEntries = [
  ['apple', 'green'],
  ['banana', 'gold'],
  ...initialEntries.slice(2),
  ['moon', 'silver'],
];
for (const [key, value] of expectedEntries) {
  assert.equal(map.has(key), true);
  assert.equal(map.get(key), value);
}
console.log('All 13 entries verified after rehashing.');

map.set('dog', 'chestnut');
map.set('apple', 'crimson');
assert.equal(map.get('dog'), 'chestnut');
assert.equal(map.get('apple'), 'crimson');
assert.equal(map.length(), 13);
assert.equal(map.capacity, 32);
showStats('After updates following expansion:');

console.log('get moon:', map.get('moon'));
console.log('has moon:', map.has('moon'));
console.log('has missing:', map.has('missing'));
console.log('remove lion:', map.remove('lion'));
console.log('remove lion again:', map.remove('lion'));
console.log('Length after removal:', map.length());
console.log('Keys:', JSON.stringify(map.keys()));
console.log('Values:', JSON.stringify(map.values()));
console.log('Entries:', JSON.stringify(map.entries()));
map.clear();
assert.equal(map.length(), 0);
assert.equal(map.capacity, 32);
showStats('After clear (capacity retained):');
console.log('Empty entries:', JSON.stringify(map.entries()));

const set = new HashSet();
set.add('dog');
set.add('cat');
set.add('dog');
assert.equal(set.length(), 2);
console.log('HashSet unique keys:', JSON.stringify(set.keys()));
console.log('HashSet length after duplicate:', set.length());
console.log('HashSet has dog:', set.has('dog'));
console.log('HashSet remove dog:', set.remove('dog'));
console.log('HashSet remaining keys:', JSON.stringify(set.keys()));
assert.deepEqual(set.keys(), ['cat']);
