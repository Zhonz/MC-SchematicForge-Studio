export type MemoizedFn<T extends (...args: unknown[]) => unknown> = T & {
  cache: Map<string, unknown>;
  clear: () => void;
  size: () => number;
};

export interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: unknown[]) => string;
  onCacheHit?: (...args: unknown[]) => void;
  onCacheMiss?: (...args: unknown[]) => void;
}

export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
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

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): MemoizedFn<T> {
  const { maxSize = 100, ttl, keyGenerator, onCacheHit, onCacheMiss } = options;
  const cache = new Map<string, { value: unknown; timestamp: number }>();

  const memoized = (...args: Parameters<T>): unknown => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (ttl === undefined || Date.now() - entry.timestamp < ttl) {
        onCacheHit?.(...args);
        return entry.value;
      }
      cache.delete(key);
    }

    onCacheMiss?.(...args);
    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };

  memoized.cache = cache as Map<string, unknown>;
  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size;

  return memoized as MemoizedFn<T>;
}

export function memoizeWithTTL<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ttl: number
): MemoizedFn<T> {
  return memoize(fn, { ttl });
}

export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {}
): T & { cache: Map<string, unknown>; clear: () => void; invalidate: (key: string) => void } {
  const { maxSize = 100, keyGenerator } = options;
  const cache = new Map<string, { promise: Promise<unknown>; timestamp: number }>();
  const resolvedCache = new Map<string, unknown>();

  const memoized = (...args: Parameters<T>): Promise<unknown> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (options.ttl === undefined || Date.now() - entry.timestamp < options.ttl) {
        return entry.promise;
      }
      cache.delete(key);
    }

    const promise = fn(...args).then((result) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, { promise, timestamp: Date.now() });
      resolvedCache.set(key, result);
      return result;
    });

    cache.set(key, { promise, timestamp: Date.now() });
    return promise;
  };

  memoized.cache = cache as Map<string, unknown>;
  memoized.clear = () => {
    cache.clear();
    resolvedCache.clear();
  };
  memoized.invalidate = (key: string) => {
    cache.delete(key);
    resolvedCache.delete(key);
  };

  return memoized as T & { cache: Map<string, unknown>; clear: () => void; invalidate: (key: string) => void };
}

export function memoizeDeep<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): MemoizedFn<T> {
  const hashCache = new WeakMap<object, string>();

  const deepHash = (obj: unknown): string => {
    if (obj === null || typeof obj !== 'object') {
      return String(obj);
    }

    if (obj instanceof Date) {
      return `date:${obj.getTime()}`;
    }

    if (obj instanceof RegExp) {
      return `regex:${obj.toString()}`;
    }

    if (Array.isArray(obj)) {
      return `[${obj.map((item) => deepHash(item)).join(',')}]`;
    }

    if (hashCache.has(obj as object)) {
      return hashCache.get(obj as object)!;
    }

    const keys = Object.keys(obj as object).sort();
    const hash = `{${keys.map((key) => `${key}:${deepHash((obj as Record<string, unknown>)[key])}`).join(',')}}`;
    hashCache.set(obj as object, hash);
    return hash;
  };

  return memoize(fn, {
    ...options,
    keyGenerator: (...args) => args.map((arg) => deepHash(arg)).join('|'),
  });
}

export class MemoCache<T extends (...args: unknown[]) => unknown> {
  private memoized: MemoizedFn<T>;

  constructor(fn: T, options: MemoizeOptions = {}) {
    this.memoized = memoize(fn, options);
  }

  call(...args: Parameters<T>): unknown {
    return this.memoized(...args);
  }

  clear(): void {
    this.memoized.clear();
  }

  get size(): number {
    return this.memoized.size();
  }

  get cache(): Map<string, unknown> {
    return this.memoized.cache;
  }
}

export function createMemoized<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: MemoizeOptions
): MemoizedFn<T> {
  return memoize(fn, options);
}

export function memoizeByKey<T extends (...args: unknown[]) => unknown>(
  fn: T,
  getKey: (...args: Parameters<T>) => string
): T & { clear: () => void; delete: (key: string) => boolean } {
  const cache = new Map<string, unknown>();

  const memoized = (...args: Parameters<T>): unknown => {
    const key = getKey(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.clear = () => cache.clear();
  memoized.delete = (key: string) => cache.delete(key);

  return memoized as T & { clear: () => void; delete: (key: string) => boolean };
}

export function memoizePromises<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T & { invalidateAll: () => void } {
  const pending = new Map<string, Promise<unknown>>();
  const cache = new Map<string, unknown>();

  const memoized = (...args: Parameters<T>): Promise<unknown> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return Promise.resolve(cache.get(key)!);
    }

    if (pending.has(key)) {
      return pending.get(key)! as Promise<unknown>;
    }

    const promise = fn(...args).then((result) => {
      cache.set(key, result);
      pending.delete(key);
      return result;
    });

    pending.set(key, promise);
    return promise;
  };

  memoized.invalidateAll = () => {
    cache.clear();
    pending.clear();
  };

  return memoized as T & { invalidateAll: () => void };
}
