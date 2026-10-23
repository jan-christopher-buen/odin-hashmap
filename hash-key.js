export function hashKey(key, capacity) {
  if (typeof key !== 'string') {
    throw new TypeError('Keys must be primitive strings');
  }

  let hashCode = 0;
  const primeNumber = 31;
  for (let index = 0; index < key.length; index += 1) {
    hashCode = (primeNumber * hashCode + key.charCodeAt(index)) % capacity;
  }
  return hashCode;
}
