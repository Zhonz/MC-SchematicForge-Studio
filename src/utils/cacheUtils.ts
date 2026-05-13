export interface LRUCacheOptions<K, V> {
  maxSize: number;
  onEvict?: (key: K, value: V) => void;
}

export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: LRUCacheOptions<K, V>) {
    this.maxSize = options.maxSize;
    this.onEvict = options.onEvict;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
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
      this.cache.forEach((value, key) => this.onEvict!(key, value));
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values());
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries());
  }

  peek(key: K): V | undefined {
    return this.cache.get(key);
  }
}

export class LFUCache<K, V> {
  private cache: Map<K, { value: V; freq: number; lastAccess: number }>;
  private maxSize: number;
  private onEvict?: (key: K, value: V) => void;
  private accessCounter = 0;

  constructor(options: LRUCacheOptions<K, V>) {
    this.maxSize = options.maxSize;
    this.onEvict = options.onEvict;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    entry.freq++;
    entry.lastAccess = ++this.accessCounter;
    return entry.value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.freq++;
      entry.lastAccess = ++this.accessCounter;
    } else {
      if (this.cache.size >= this.maxSize) {
        let minFreq = Infinity;
        let lruKey: K | undefined;
        this.cache.forEach((entry, k) => {
          if (entry.freq < minFreq || (entry.freq === minFreq && (lruKey === undefined || entry.lastAccess < this.cache.get(lruKey)!.lastAccess))) {
            minFreq = entry.freq;
            lruKey = k;
          }
        });
        if (lruKey !== undefined) {
          const evicted = this.cache.get(lruKey)!.value;
          this.cache.delete(lruKey);
          if (this.onEvict) this.onEvict(lruKey, evicted);
        }
      }
      this.cache.set(key, { value, freq: 1, lastAccess: ++this.accessCounter });
    }
    return this;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    const deleted = this.cache.delete(key);
    if (deleted && entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    return deleted;
  }

  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => this.onEvict!(key, entry.value));
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }>;
  private defaultTTL: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(defaultTTL: number, maxSize?: number, onEvict?: (key: K, value: V) => void) {
    this.defaultTTL = defaultTTL;
    this.onEvict = onEvict;
    this.cache = new Map();
  }

  private isExpired(entry: { value: V; expiresAt: number }): boolean {
    return Date.now() > entry.expiresAt;
  }

  private cleanExpired(): void {
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        if (this.onEvict) this.onEvict(key, entry.value);
      }
    }
  }

  get(key: K): V | undefined {
    this.cleanExpired();
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.onEvict) this.onEvict(key, entry.value);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V, ttl?: number): this {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    return this;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.onEvict) this.onEvict(key, entry.value);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    const deleted = this.cache.delete(key);
    if (deleted && entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    return deleted;
  }

  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => this.onEvict!(key, entry.value));
    }
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }
}
