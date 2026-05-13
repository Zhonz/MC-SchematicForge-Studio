export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function murmurhash3(key: string, seed = 0): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const length = key.length;
  let h1 = seed;
  const roundedEnd = Math.floor((length / 4) * 4);

  for (let i = 0; i < roundedEnd; i += 4) {
    let k1 = (key.charCodeAt(i) & 0xff) |
             ((key.charCodeAt(i + 1) & 0xff) << 8) |
             ((key.charCodeAt(i + 2) & 0xff) << 16) |
             ((key.charCodeAt(i + 3) & 0xff) << 24);
    
    k1 = Math.imul(k1, c1);
    k1 = Math.imul((k1 << 15) | (k1 >>> 17), c2);
    h1 = Math.imul(h1 ^ k1, 0x85ebca6b);
    h1 = Math.imul((h1 << 13) | (h1 >>> 19), 0xc2b2ae35);
    h1 ^= 4;
  }

  let k1 = 0;
  const rem = length % 4;
  if (rem >= 3) k1 ^= (key.charCodeAt(roundedEnd + 2) & 0xff) << 16;
  if (rem >= 2) k1 ^= (key.charCodeAt(roundedEnd + 1) & 0xff) << 8;
  if (rem >= 1) {
    k1 ^= key.charCodeAt(roundedEnd) & 0xff;
    k1 = Math.imul(k1, c1);
    k1 = Math.imul((k1 << 15) | (k1 >>> 17), c2);
    h1 ^= k1;
  }

  h1 ^= length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

export function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function sdbm(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 6) + (hash << 16) - hash);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function adler32(str: string): number {
  let a = 1, b = 0;
  for (let i = 0; i < str.length; i++) {
    a = (a + str.charCodeAt(i)) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

export class BloomFilter {
  private bits: boolean[];
  private size: number;
  private hashCount: number;

  constructor(size: number, hashCount: number) {
    this.size = size;
    this.hashCount = hashCount;
    this.bits = new Array(size).fill(false);
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.getIndex(item, i);
      this.bits[index] = true;
    }
  }

  contains(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.getIndex(item, i);
      if (!this.bits[index]) return false;
    }
    return true;
  }

  private getIndex(item: string, seed: number): number {
    const hash = murmurhash3(item + seed);
    return hash % this.size;
  }

  clear(): void {
    this.bits.fill(false);
  }
}

export class ConsistentHash<T> {
  private ring: Map<number, T> = new Map();
  private sortedKeys: number[] = [];
  private virtualNodes = 128;

  constructor(virtualNodes = 128) {
    this.virtualNodes = virtualNodes;
  }

  addNode(node: T): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = murmurhash3(String(node) + i);
      this.ring.set(key, node);
    }
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  removeNode(node: T): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = murmurhash3(String(node) + i);
      this.ring.delete(key);
    }
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  getNode(key: string): T | undefined {
    if (this.ring.size === 0) return undefined;
    
    const hash = murmurhash3(key);
    let low = 0, high = this.sortedKeys.length - 1;
    
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.sortedKeys[mid] <= hash) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const index = Math.max(0, this.sortedKeys.indexOf(this.sortedKeys[low]));
    return this.ring.get(this.sortedKeys[index]);
  }
}
