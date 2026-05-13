export interface TransformOptions {
  deep?: boolean;
  omit?: string[];
  pick?: string[];
}

export function transformObject<T extends object, U extends object>(
  obj: T,
  transformer: (key: string, value: unknown) => [string, unknown],
  options: TransformOptions = {}
): U {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (options.omit?.includes(key)) continue;
      if (options.pick && !options.pick.includes(key)) continue;

      const [newKey, newValue] = transformer(key, obj[key]);
      result[newKey] = newValue;
    }
  }

  if (options.deep) {
    for (const key in result) {
      if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        result[key] = transformObject(result[key] as object, transformer, options);
      }
    }
  }

  return result as U;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function mapValues<T extends object, U>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => U
): { [K in keyof T]: U } {
  const result = {} as { [K in keyof T]: U };
  for (const key in obj) {
    result[key] = mapper(obj[key], key);
  }
  return result;
}

export function mapKeys<T extends object, U extends string>(
  obj: T,
  mapper: (key: keyof T, value: T[keyof T]) => U
): Record<U, T[keyof T]> {
  const result: Record<string, T[keyof T]> = {};
  for (const key in obj) {
    result[mapper(key, obj[key])] = obj[key];
  }
  return result as Record<U, T[keyof T]>;
}

export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return ([] as T[]).concat(...array);
}

export function flattenDeep<T>(array: unknown[]): T[] {
  return array.reduce<T[]>((acc, val) => 
    Array.isArray(val) ? acc.concat(flattenDeep<T>(val)) : acc.concat(val as T), []
  );
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqBy<T>(array: T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sortBy<T>(array: T[], keyFn: (item: T) => number | string): T[] {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of array) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}

export function keyBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T> {
  return array.reduce((acc, item) => {
    acc[keyFn(item)] = item;
    return acc;
  }, {} as Record<string, T>);
}

export function difference<T>(array: T[], ...others: T[][]): T[] {
  const otherSet = new Set(flatten(others));
  return array.filter((item) => !otherSet.has(item));
}

export function intersection<T>(array: T[], ...others: T[][]): T[] {
  const otherSets = others.map((arr) => new Set(arr));
  return array.filter((item) => otherSets.every((set) => set.has(item)));
}

export function union<T>(...arrays: T[][]): T[] {
  return uniq(flatten(arrays));
}

export function zip<T, U>(a: T[], b: U[]): Array<[T, U]> {
  const length = Math.min(a.length, b.length);
  const result: Array<[T, U]> = [];
  for (let i = 0; i < length; i++) {
    result.push([a[i], b[i]]);
  }
  return result;
}

export function unzip<T, U>(pairs: Array<[T, U]>): [T[], U[]] {
  const a: T[] = [];
  const b: U[] = [];
  for (const [x, y] of pairs) {
    a.push(x);
    b.push(y);
  }
  return [a, b];
}

export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result: number[] = [];
  for (let i = start; step > 0 ? i < end : i > end; i += step) {
    result.push(i);
  }
  return result;
}

export function sum(array: number[]): number {
  return array.reduce((acc, n) => acc + n, 0);
}

export function mean(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

export function median(array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function inRange(value: number, start: number, end: number): boolean {
  return value >= Math.min(start, end) && value <= Math.max(start, end);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { cache: Map<string, unknown>; clear: () => void } {
  const cache = new Map<string, unknown>();
  return Object.assign(
    (...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    },
    {
      cache,
      clear: () => cache.clear(),
    }
  ) as T & { cache: Map<string, unknown>; clear: () => void };
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
  let called = false;
  let result: unknown;
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

export function curry(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  return function curried(...args: unknown[]) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  };
}

export function partial<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...initialArgs: unknown[]
): (...args: unknown[]) => unknown {
  return (...moreArgs: unknown[]) => fn(...initialArgs, ...moreArgs);
}

export function negate<T extends (...args: unknown[]) => boolean>(fn: T): T {
  return ((...args: Parameters<T>) => !fn(...args)) as T;
}

export function noop(): void {}

export function always<T>(value: T): () => T {
  return () => value;
}

export function identity<T>(value: T): T {
  return value;
}

export function tap<T>(fn: (value: T) => void): (value: T) => T {
  return (value: T) => {
    fn(value);
    return value;
  };
}

export function juxt<T>(...fns: Array<(arg: unknown) => T>): (arg: unknown) => T[] {
  return (arg: unknown) => fns.map((fn) => fn(arg));
}

export function converge<T>(fn: (...args: unknown[]) => T, transformers: Array<(arg: unknown) => unknown>): (arg: unknown) => T {
  return (arg: unknown) => fn(...transformers.map((t) => t(arg)));
}

export function over<T extends object, K extends keyof T>(
  lens: (obj: T) => T[K],
  setter: (value: T[K]) => T[K],
  obj: T
): T {
  const currentValue = lens(obj);
  return setter(currentValue) as T[K] extends T ? T : T;
}

export function lensProp<T, K extends keyof T>(prop: K): {
  get: (obj: T) => T[K];
  set: (value: T[K], obj: T) => T;
} {
  return {
    get: (obj: T) => obj[prop],
    set: (value: T[K], obj: T) => ({ ...obj, [prop]: value }),
  };
}

export function lensPath(path: (string | number)[]): {
  get: <T>(obj: T) => unknown;
  set: <T>(value: unknown, obj: T) => T;
} {
  return {
    get: <T>(obj: T): unknown => {
      let result: unknown = obj;
      for (const key of path) {
        if (result == null) return undefined;
        result = (result as Record<string, unknown>)[key];
      }
      return result;
    },
    set: <T>(value: unknown, obj: T): T => {
      const clone = JSON.parse(JSON.stringify(obj));
      let current: unknown = clone;
      for (let i = 0; i < path.length - 1; i++) {
        current = (current as Record<string, unknown>)[path[i] as string];
      }
      (current as Record<string, unknown>)[path[path.length - 1] as string] = value;
      return clone;
    },
  };
}
