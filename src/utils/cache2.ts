export interface LRUCacheOptions<K, V> {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: K, value: V) => void;
}

export class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: LRUCacheOptions<K, V> = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 0;
    this.onEvict = options.onEvict;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    while (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        const entry = this.cache.get(oldest);
        if (entry) {
          this.onEvict?.(oldest, entry.value);
        }
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
    return this;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.onEvict?.(key, entry.value);
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
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
    return Array.from(this.cache.values()).map(e => e.value);
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries()).map(([k, e]) => [k, e.value]);
  }

  peek(key: K): V | undefined {
    return this.cache.get(key)?.value;
  }

  getOrSet(key: K, factory: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) return existing;
    const value = factory();
    this.set(key, value);
    return value;
  }

  cleanExpired(): number {
    if (this.ttl <= 0) return 0;

    const now = Date.now();
    let count = 0;
    const expiredKeys: K[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
      count++;
    }

    return count;
  }

  toJSON(): Array<{ key: K; value: V; timestamp: number }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      timestamp: entry.timestamp,
    }));
  }
}

export class LFUCache<K, V> {
  private cache: Map<K, { value: V; frequency: number; timestamp: number }> = new Map();
  private maxSize: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(maxSize: number, onEvict?: (key: K, value: V) => void) {
    this.maxSize = maxSize;
    this.onEvict = onEvict;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    entry.frequency++;
    entry.timestamp = Date.now();
    return entry.value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.frequency++;
      entry.timestamp = Date.now();
      return this;
    }

    while (this.cache.size >= this.maxSize) {
      this.evictLFU();
    }

    this.cache.set(key, { value, frequency: 1, timestamp: Date.now() });
    return this;
  }

  private evictLFU(): void {
    let minFreq = Infinity;
    let lfuKey: K | undefined;

    for (const [key, entry] of this.cache) {
      if (entry.frequency < minFreq) {
        minFreq = entry.frequency;
        lfuKey = key;
      }
    }

    if (lfuKey !== undefined) {
      const entry = this.cache.get(lfuKey);
      if (entry) {
        this.onEvict?.(lfuKey, entry.value);
      }
      this.cache.delete(lfuKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getFrequency(key: K): number {
    return this.cache.get(key)?.frequency ?? 0;
  }
}

export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }> = new Map();
  private defaultTTL: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;
  private onEvict?: (key: K, value: V) => void;

  constructor(defaultTTL: number, cleanupIntervalMs = 60000, onEvict?: (key: K, value: V) => void) {
    this.defaultTTL = defaultTTL;
    this.onEvict = onEvict;

    if (cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  set(key: K, value: V, ttl?: number): this {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.onEvict?.(key, entry.value);
      return this.cache.delete(key);
    }
    return false;
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.onEvict?.(key, entry.value);
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  getTTL(key: K): number | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : undefined;
  }

  resetTTL(key: K, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    entry.expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    return true;
  }
}

export const lruCache = <K, V>(maxSize?: number) => new LRUCache<K, V>({ maxSize });
export const lfuCache = <K, V>(maxSize: number, onEvict?: (key: K, value: V) => void) => 
  new LFUCache<K, V>(maxSize, onEvict);
export const ttlCache = <K, V>(ttl: number, cleanupInterval?: number, onEvict?: (key: K, value: V) => void) =>
  new TTLCache<K, V>(ttl, cleanupInterval, onEvict);
