import { hashKey } from './hash-key.js';

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
}
