export interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  const maxSize = options.maxSize ?? 100;
  const ttl = options.ttl;
  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached) {
      if (!ttl || now - cached.timestamp < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }
    const result = fn.apply(this, args) as ReturnType<T>;
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, { value: result, timestamp: now });
    return result;
  } as T;
}

export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, { promise: Promise<ReturnType<T>>; timestamp: number }>();
  const maxSize = options.maxSize ?? 100;
  const ttl = options.ttl;
  return function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached) {
      if (!ttl || now - cached.timestamp < ttl) {
        return cached.promise;
      }
      cache.delete(key);
    }
    const promise = fn.apply(this, args) as Promise<ReturnType<T>>;
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, { promise, timestamp: now });
    return promise;
  } as T;
}

export function memoizeWeak<K extends object, V>(
  fn: (key: K) => V
): (key: K) => V {
  const cache = new WeakMap<K, V>();
  return (key: K): V => {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}

export function memoizeLRU<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const accessOrder: string[] = [];
  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const idx = accessOrder.indexOf(key);
      if (idx > -1) {
        accessOrder.splice(idx, 1);
      }
      accessOrder.push(key);
      return cache.get(key) as ReturnType<T>;
    }
    if (cache.size >= maxSize) {
      const lruKey = accessOrder.shift();
      if (lruKey) cache.delete(lruKey);
    }
    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    accessOrder.push(key);
    return result;
  } as T;
}
