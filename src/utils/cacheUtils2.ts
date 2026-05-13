export type HashFunction<T = unknown> = (value: T) => string | number;

export interface BloomFilterOptions {
  size?: number;
  hashFunctions?: number;
  errorRate?: number;
}

export class BloomFilter<T = unknown> {
  private storage: boolean[] = [];
  private _size: number;
  private hashCount: number;
  private hashFn: HashFunction<T>;

  constructor(
    private expectedElements: number = 1000,
    options: BloomFilterOptions = {}
  ) {
    this._size = options.size ?? this.calculateSize(expectedElements, options.errorRate ?? 0.01);
    this.hashCount = options.hashFunctions ?? this.calculateHashCount(this._size, expectedElements);
    this.storage = new Array(this._size).fill(false);
    
    const baseHash = this.simpleHash.bind(this);
    this.hashFn = (value: T) => baseHash(value);
  }

  private calculateSize(n: number, p: number): number {
    const m = Math.ceil(-(n * Math.log(p)) / (Math.log(2) ** 2));
    return Math.max(m, 10);
  }

  private calculateHashCount(m: number, n: number): number {
    const k = Math.round((m / n) * Math.log(2));
    return Math.max(k, 1);
  }

  private simpleHash(value: T): number {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getHashes(value: T): number[] {
    const hashes: number[] = [];
    const baseHash = this.simpleHash(value);
    
    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(Math.abs((baseHash + i * baseHash) % this._size));
    }
    
    return hashes;
  }

  add(value: T): this {
    const hashes = this.getHashes(value);
    for (const hash of hashes) {
      this.storage[hash] = true;
    }
    return this;
  }

  has(value: T): boolean {
    const hashes = this.getHashes(value);
    for (const hash of hashes) {
      if (!this.storage[hash]) {
        return false;
      }
    }
    return true;
  }

  get bitSize(): number {
    return this._size;
  }

  get length(): number {
    return this.expectedElements;
  }

  getFalsePositiveRate(): number {
    const k = this.hashCount;
    const m = this._size;
    const n = this.expectedElements;
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }

  clear(): void {
    this.storage.fill(false);
  }

  toString(): string {
    return this.storage.map(v => v ? '1' : '0').join('');
  }

  static fromString(str: string, expectedElements: number = 1000): BloomFilter {
    const filter = new BloomFilter(expectedElements);
    filter.storage = str.split('').map(v => v === '1');
    return filter;
  }
}

export interface LRUOptions<K, V> {
  maxSize?: number;
  onEvict?: (key: K, value: V) => void;
}

export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: LRUOptions<K, V> = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.onEvict = options.onEvict;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        const evicted = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        if (evicted !== undefined && this.onEvict) {
          this.onEvict(firstKey, evicted);
        }
      }
    }
    
    this.cache.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const value = this.cache.get(key);
    const deleted = this.cache.delete(key);
    if (deleted && value !== undefined && this.onEvict) {
      this.onEvict(key, value);
    }
    return deleted;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, value] of this.cache) {
        this.onEvict(key, value);
      }
    }
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}

export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(
    private maxSizeOrTTL: number = 100,
    private ttl?: number
  ) {
    if (maxSizeOrTTL > 0 && !ttl) {
      this.maxSize = 100;
      this.defaultTTL = maxSizeOrTTL;
    } else {
      this.maxSize = maxSizeOrTTL;
      this.defaultTTL = ttl ?? 60000;
    }
  }

  set(key: K, value: V, ttl?: number): this {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictExpired();
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
    }
    
    this.cache.set(key, { value, expiry });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  startCleanup(interval: number = this.defaultTTL / 2): void {
    this.stopCleanup();
    this.cleanupInterval = setInterval(() => this.evictExpired(), interval);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  get size(): number {
    this.evictExpired();
    return this.cache.size;
  }

  get maxSizeLimit(): number {
    return this.maxSize;
  }
}

export class FIFOCache<K, V> {
  private cache: Map<K, V> = new Map();
  private order: K[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      const idx = this.order.indexOf(key);
      if (idx !== -1) {
        this.order.splice(idx, 1);
      }
    } else if (this.cache.size >= this.maxSize) {
      const oldest = this.order.shift();
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    
    this.cache.set(key, value);
    this.order.push(key);
    return this;
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const idx = this.order.indexOf(key);
      if (idx !== -1) {
        this.order.splice(idx, 1);
      }
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.order = [];
  }

  get size(): number {
    return this.cache.size;
  }
}

export class LFUCache<K, V> {
  private cache: Map<K, { value: V; freq: number; lastAccess: number }> = new Map();
  private frequencyMap: Map<number, Set<K>> = new Map();
  private minFreq = 0;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    this.incrementFrequency(key);
    entry.lastAccess = Date.now();
    return entry.value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.lastAccess = Date.now();
      this.incrementFrequency(key);
      return this;
    }
    
    if (this.cache.size >= this.maxSize) {
      this.evictLFU();
    }
    
    this.cache.set(key, { value, freq: 1, lastAccess: Date.now() });
    this.addToFrequencyMap(1, key);
    this.minFreq = 1;
    return this;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.removeFromFrequencyMap(entry.freq, key);
    this.cache.delete(key);
    
    if (this.minFreq === entry.freq && !this.frequencyMap.get(entry.freq)?.size) {
      this.minFreq++;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.frequencyMap.clear();
    this.minFreq = 0;
  }

  private incrementFrequency(key: K): void {
    const entry = this.cache.get(key)!;
    const oldFreq = entry.freq;
    const newFreq = oldFreq + 1;
    
    this.removeFromFrequencyMap(oldFreq, key);
    this.addToFrequencyMap(newFreq, key);
    entry.freq = newFreq;
    
    if (newFreq < this.minFreq) {
      this.minFreq = newFreq;
    }
  }

  private addToFrequencyMap(freq: number, key: K): void {
    if (!this.frequencyMap.has(freq)) {
      this.frequencyMap.set(freq, new Set());
    }
    this.frequencyMap.get(freq)!.add(key);
  }

  private removeFromFrequencyMap(freq: number, key: K): void {
    const set = this.frequencyMap.get(freq);
    if (set) {
      set.delete(key);
      if (!set.size) {
        this.frequencyMap.delete(freq);
      }
    }
  }

  private evictLFU(): void {
    const keys = this.frequencyMap.get(this.minFreq);
    if (!keys || keys.size === 0) return;
    
    const oldestKey = [...keys].reduce((a, b) => {
      const aTime = this.cache.get(a)?.lastAccess ?? 0;
      const bTime = this.cache.get(b)?.lastAccess ?? 0;
      return aTime <= bTime ? a : b;
    });
    
    this.delete(oldestKey);
  }

  get size(): number {
    return this.cache.size;
  }
}
