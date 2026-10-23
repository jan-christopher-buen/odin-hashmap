import { hashKey } from './hash-key.js';

class SetNode {
  constructor(key, next = null) {
    this.key = key;
    this.next = next;
  }
}

export class HashSet {
  #buckets = new Array(16).fill(null);
  #count = 0;

  get capacity() {
    return this.#buckets.length;
  }

  get loadFactor() {
    return 0.75;
  }

  hash(key) {
    return hashKey(key, this.capacity);
  }

  length() {
    return this.#count;
  }

  add(key) {
    const index = this.hash(key);
    let current = this.#readBucket(index);
    while (current !== null) {
      if (current.key === key) return;
      current = current.next;
    }
    const node = new SetNode(key, this.#readBucket(index));
    this.#writeBucket(index, node);
    this.#count += 1;
    if (this.#count / this.capacity > this.loadFactor) this.#grow();
  }

  has(key) {
    let current = this.#readBucket(this.hash(key));
    while (current !== null) {
      if (current.key === key) return true;
      current = current.next;
    }
    return false;
  }

  remove(key) {
    const index = this.hash(key);
    let current = this.#readBucket(index);
    let previous = null;
    while (current !== null) {
      if (current.key === key) {
        if (previous === null) this.#writeBucket(index, current.next);
        else previous.next = current.next;
        this.#count -= 1;
        return true;
      }
      previous = current;
      current = current.next;
    }
    return false;
  }

  clear() {
    this.#buckets = new Array(this.capacity).fill(null);
    this.#count = 0;
  }

  keys() {
    const result = [];
    for (let index = 0; index < this.capacity; index += 1) {
      let current = this.#readBucket(index);
      while (current !== null) {
        result.push(current.key);
        current = current.next;
      }
    }
    return result;
  }

  #grow() {
    const oldBuckets = this.#buckets;
    this.#buckets = new Array(oldBuckets.length * 2).fill(null);
    for (let index = 0; index < oldBuckets.length; index += 1) {
      let current = this.#readBucket(index, oldBuckets);
      while (current !== null) {
        // Preserve the old chain before changing the node's next reference.
        const next = current.next;
        const newIndex = this.hash(current.key);
        current.next = this.#readBucket(newIndex);
        this.#writeBucket(newIndex, current);
        current = next;
      }
    }
  }

  #readBucket(index, buckets = this.#buckets) {
    if (index < 0 || index >= buckets.length) {
      throw new Error('Trying to access index out of bounds');
    }
    return buckets[index];
  }

  #writeBucket(index, node, buckets = this.#buckets) {
    if (index < 0 || index >= buckets.length) {
      throw new Error('Trying to access index out of bounds');
    }
    buckets[index] = node;
  }
}
