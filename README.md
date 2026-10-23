# HashMap and HashSet

A JavaScript implementation of [The Odin Project's HashMap assignment](https://www.theodinproject.com/lessons/javascript-hashmap), including the HashSet extra credit. Both classes use fixed-capacity bucket arrays, linked collision chains, and dynamic resizing. This is a Node.js console project with no external dependencies.

## Run

Install Node.js and npm. Verified in WSL2 with Node **v24.22.0** and npm **11.19.1**. No package installation or build step is needed.

```sh
npm start
npm test
```

The demo inserts the assignment's twelve key-value pairs, updates existing values, and adds `moon` to trigger growth:

| Stage | Stored keys | Capacity | Configured load factor | Current load |
| --- | --- | --- | --- | --- |
| Initial | 0 | 16 | 0.75 | 0 |
| Twelve entries | 12 | 16 | 0.75 | 0.75 |
| Update existing keys | 12 | 16 | 0.75 | 0.75 |
| Add `moon` | 13 | 32 | 0.75 | 0.40625 |
| Update after expansion | 13 | 32 | 0.75 | 0.40625 |

It verifies all thirteen entries after rehashing, demonstrates retrieval, membership, removal, enumeration, and clear, then shows HashSet uniqueness and removal.

## Usage

```js
import { HashMap } from './hash-map.js';
import { HashSet } from './hash-set.js';

const map = new HashMap();
map.set('a', 'first');
map.set('q', undefined); // A collision with 'a' at capacity 16.
map.set('a', 'updated');
console.log(map.get('a')); // 'updated'
console.log(map.has('q')); // true, even though its value is undefined.
console.log(map.length()); // 2
console.log(map.remove('a')); // true

const set = new HashSet();
set.add('cat');
set.add('cat');
console.log(set.length()); // 1
console.log(set.remove('cat')); // true
```

## HashMap API

| Method | Behavior and return value |
| --- | --- |
| `hash(key)` | Return the key's bucket index for the current capacity |
| `set(key, value)` | Insert or overwrite the exact key; return `undefined` |
| `get(key)` | Return the stored value, or `undefined` when absent |
| `has(key)` | Return whether the key exists, including a stored `undefined` |
| `remove(key)` | Remove a key; return `true` if removed, otherwise `false` |
| `length()` | Return stored-key count; `0` when empty |
| `clear()` | Remove all entries, retain capacity and load factor; return `undefined` |
| `keys()` | Return a fresh array of keys, or `[]` when empty |
| `values()` | Return a fresh array of values, including duplicates, or `[]` when empty |
| `entries()` | Return a fresh array of fresh `[key, value]` pairs, or `[]` when empty |

## HashSet API

| Method | Behavior and return value |
| --- | --- |
| `hash(key)` | Return the key's bucket index for the current capacity |
| `add(key)` | Insert a key; an existing key is a no-op; return `undefined` |
| `has(key)` | Return whether the key exists |
| `remove(key)` | Return `true` if removed, otherwise `false` |
| `length()` | Return unique-key count; `0` when empty |
| `clear()` | Remove all keys, retain capacity and load factor; return `undefined` |
| `keys()` | Return a fresh array of keys, or `[]` when empty |

Both classes expose read-only `capacity` and `loadFactor` getters. Buckets and nodes are private. HashSet stores only a key and a next reference per node; it does not wrap HashMap or store dummy values.

## Policies

- Every key-taking method, including `hash`, requires a primitive string and throws `TypeError` otherwise. Empty strings and Unicode strings are valid. Keys use exact, case-sensitive equality without coercion or Unicode normalization.
- HashMap values may be any JavaScript value, including `undefined`, `null`, `false`, `0`, objects, and functions. Object and function references are preserved.
- Enumeration has no insertion-order guarantee. Returned arrays and entry pairs can be modified without changing the table. Object values remain shared references; they are not deep-cloned.
- Removal never shrinks capacity. `clear()` retains the current capacity, even after growth.

The assignment specifies map operations, collision handling, growth, bounds checking, and a key-only set. This project's additional choices are strict string-key validation, read-only configuration getters, the capacity-retaining clear policy, and `undefined` returns for `set` and `clear`. The HashSet method names and return contracts listed above are also explicit project choices where the extra-credit assignment leaves them unspecified.

## Buckets, collisions, and growth

Hashing multiplies the running hash by 31, adds each UTF-16 code unit, and applies modulo capacity on **every iteration**. This keeps the running value bounded for long keys. The result is a current bucket index, not a stable key identifier.

Each bucket holds the head of a linked chain, ending at `null`. For example, `a`, `q`, and `A` all hash to bucket 1 at capacity 16. Distinct keys remain separate nodes. New nodes are prepended; updates traverse the chain and replace only the matching node's value. Removal reconnects the previous node to the removed node's successor, or replaces the bucket head.

Configured `loadFactor` is the growth threshold, **0.75**. Current load is `length() / capacity`. Exactly twelve keys fit at capacity 16 without growth. A new thirteenth key exceeds the threshold and doubles capacity to 32. Updating an existing key or adding a duplicate set key does not change the count or trigger growth.

Growth allocates a new bucket array and rehashes every existing node using the new capacity. For example, `a` stays at bucket 1 while `q` moves to bucket 17. The old next reference is saved before relinking a node. Rehashing reuses nodes, leaves the stored count unchanged, and bypasses normal insertion so it cannot trigger recursive growth.

All indexed bucket reads and writes go through private helpers containing the assignment's bounds guard. Those helpers also cover enumeration and old/new bucket access during rehashing.

## Complexity

Let `n` be the number of entries, `m` the current capacity, `k` the queried key's UTF-16 length, `c` its collision-chain length, and `S` the total length of stored keys being rehashed.

| Operation | Time | Additional space |
| --- | --- | --- |
| `hash(key)` | O(k) | O(1) |
| `get`, `has`, `remove`, update or insertion without growth | O(k + c) treating key comparison as constant time | O(1), including at most one new node |
| `length`, `capacity`, `loadFactor` | O(1) | O(1) |
| Growth | O(m + n + S) | O(m) for the new bucket array; nodes are reused |
| `keys`, `values`, `entries` | O(m + n) | O(n) returned output, including pairs for `entries` |
| `clear` | O(m) to allocate and fill replacement buckets | O(m) for replacement buckets |

String equality can itself scan characters. Including that cost gives an upper bound of O(k + c(k + 1)) for bucket operations, or O((k + 1)(n + 1)) when all keys collide. Under well-distributed keys and the bounded load factor, expected chain length stays bounded and lookups take expected O(k + 1), commonly called expected O(1) for bounded-length keys.

Capacity doubling spreads bucket allocation and rehashing across insertions. With well-distributed, bounded-length keys, insertion is expected amortized O(1), but an insertion that grows the table also pays O(m + n + S). For variable-length keys, rehashing includes rereading previously stored keys; the amortized bound depends on their lengths. Heavy collisions can still make individual operations linear in entry count.

The table occupies O(m + n) structural space, excluding key/value payloads. Array outputs copy references rather than payloads. Clearing drops references to old nodes; garbage collection reclaims unreachable storage separately. Keeping expanded capacity means enumeration and clear still scan or allocate `m` slots even when few entries remain.

## Files and testing

- `hash-map.js`: map nodes, guarded buckets, operations, enumeration, and growth.
- `hash-set.js`: key-only set nodes and table operations.
- `hash-key.js`: small shared polynomial-hashing and string-validation helper.
- `main.js`: labeled assignment demo with assertions for the growth milestones.
- `hash-map.test.js` and `hash-set.test.js`: public-behavior tests using `node:test` and `node:assert/strict`.
- `package.json` and `.gitignore`: ES module scripts and dependency/coverage/log exclusions.

Local verification with Node v24.22.0: **31 tests passed, 0 failed** using `npm test`. Coverage includes known collisions, removal across chains, invalid keys, unrestricted values, independent instances, enumeration isolation, threshold updates, repeated growth, and clear/reuse. `npm start` passes its demo assertions and shows the capacity/load milestones above. Bucket bounds were also reviewed in the implementation; public-behavior tests alone do not prove internal guards.
