export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): this {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
    return this;
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

  values(): V[] {
    return Array.from(this.cache.values());
  }

  entries(): Array<[K, V]> {
    return Array.from(this.cache.entries());
  }
}

export class Cache<K, V> {
  private store: Map<K, { value: V; expiry?: number }> = new Map();

  set(key: K, value: V, ttl?: number): this {
    this.store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl : undefined,
    });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  clean(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiry && now > entry.expiry) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  size(): number {
    this.clean();
    return this.store.size;
  }
}

export class Memoize {
  static fn<T extends (...args: unknown[]) => unknown>(fn: T): T {
    const cache = new Map<string, unknown>();
    return ((...args: unknown[]): unknown => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
}
