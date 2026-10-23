import { HashMap } from './hash-map.js';

const map = new HashMap();
console.log('Initial capacity:', map.capacity);
console.log('Configured load factor:', map.loadFactor);
console.log('Bucket for apple:', map.hash('apple'));
