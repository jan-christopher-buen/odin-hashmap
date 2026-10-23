import { hashKey } from './hash-key.js';

class MapNode {
  constructor(key, value, next = null) {
    this.key = key;
    this.value = value;
    this.next = next;
  }
}

export class HashMap {
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

  set(key, value) {
    const index = this.hash(key);
    let current = this.#readBucket(index);
    while (current !== null) {
      if (current.key === key) {
        current.value = value;
        return;
      }
      current = current.next;
    }
    const node = new MapNode(key, value, this.#readBucket(index));
    this.#writeBucket(index, node);
    this.#count += 1;
  }

  get(key) {
    const node = this.#findNode(key);
    return node === null ? undefined : node.value;
  }

  has(key) {
    return this.#findNode(key) !== null;
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
    return this.#collect((node) => node.key);
  }

  values() {
    return this.#collect((node) => node.value);
  }

  entries() {
    return this.#collect((node) => [node.key, node.value]);
  }

  #collect(select) {
    const result = [];
    for (let index = 0; index < this.capacity; index += 1) {
      let current = this.#readBucket(index);
      while (current !== null) {
        result.push(select(current));
        current = current.next;
      }
    }
    return result;
  }

  #findNode(key) {
    let current = this.#readBucket(this.hash(key));
    while (current !== null) {
      if (current.key === key) return current;
      current = current.next;
    }
    return null;
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
