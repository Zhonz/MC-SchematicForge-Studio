export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: string, value: unknown) => void;
}

export class Cache<K = string, V = unknown> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 0;
    this.onEvict = options.onEvict as (key: K, value: V) => void | undefined;
  }

  private isExpired(entry: { timestamp: number }): boolean {
    if (this.ttl <= 0) return false;
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictIfNeeded(): void {
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        const evicted = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        if (evicted && this.onEvict) {
          this.onEvict(firstKey, evicted.value);
        }
      }
    }
  }

  set(key: K, value: V): this {
    this.evictIfNeeded();
    this.cache.set(key, { value, timestamp: Date.now() });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.onEvict) {
        this.onEvict(key, entry.value);
      }
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
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
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map((e) => e.value);
  }

  clean(): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ttl: number = 60000
): T {
  const cache = new Cache<string, ReturnType<T>>({ ttl });

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}
