export type Predicate<T> = (value: T) => boolean;
export type Selector<T, R> = (value: T) => R;
export type Transformer<T, R> = (value: T) => R;
export type Accumulator<T, R> = (acc: R, value: T) => R;

export function pipe<T>(...fns: Transformer<unknown, unknown>[]): Transformer<unknown, unknown> {
  return (value: unknown) => fns.reduce((acc, fn) => fn(acc), value);
}

export function compose<T>(...fns: Transformer<unknown, unknown>[]): Transformer<unknown, unknown> {
  return pipe(...fns.reverse());
}

export function curry<T extends (...args: unknown[]) => unknown>(
  fn: T,
  arity: number = fn.length
): T {
  return function curried(this: unknown, ...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    return (...moreArgs: unknown[]) => curried.apply(this, [...args, ...moreArgs]);
  } as T;
}

export function partial<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...initialArgs: unknown[]
): (...args: Parameters<T>) => ReturnType<T> {
  return (...laterArgs: unknown[]): ReturnType<T> =>
    fn(...initialArgs, ...laterArgs) as ReturnType<T>;
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  cache: Map<string, ReturnType<T>> = new Map()
): T {
  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args) as ReturnType<T>;
    }
    return result!;
  } as T;
}

export function noop(): void {}

export function identity<T>(value: T): T {
  return value;
}

export function constant<T>(value: T): () => T {
  return () => value;
}

export function tap<T>(fn: (value: T) => unknown): (value: T) => T {
  return (value: T): T => {
    fn(value);
    return value;
  };
}

export function always<T>(value: T): () => T {
  return () => value;
}

export function ifElse<T>(
  condition: (value: T) => boolean,
  onTrue: Transformer<T, T>,
  onFalse: Transformer<T, T>
): Transformer<T, T> {
  return (value: T) => condition(value) ? onTrue(value) : onFalse(value);
}

export function when<T>(
  condition: (value: T) => boolean,
  fn: Transformer<T, T>
): Transformer<T, T> {
  return ifElse(condition, fn, identity);
}

export function unless<T>(
  condition: (value: T) => boolean,
  fn: Transformer<T, T>
): Transformer<T, T> {
  return ifElse(condition, identity, fn);
}

export function negate<T extends (...args: unknown[]) => boolean>(fn: T): T {
  return function (this: unknown, ...args: Parameters<T>): boolean {
    return !fn.apply(this, args);
  } as T;
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) {
    return (value as string | unknown[]).length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isEqual(item, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  return false;
}

export function defaultTo<T>(defaultValue: T): (value: T | null | undefined) => T {
  return (value) => value ?? defaultValue;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, item) => 
    Array.isArray(item) ? acc.concat(flatten(item)) : acc.concat(item), []);
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T, K>(
  array: T[],
  keyFn: (item: T) => K,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function partition<T>(array: T[], predicate: Predicate<T>): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of array) {
    (predicate(item) ? pass : fail).push(item);
  }
  return [pass, fail];
}

export function zip<T>(...arrays: T[][]): T[][] {
  const length = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length }, (_, i) => arrays.map((a) => a[i]));
}

export function unzip<T>(zipped: T[][]): T[][] {
  if (zipped.length === 0) return [];
  const numArrays = zipped[0].length;
  return Array.from({ length: numArrays }, (_, i) => zipped.map((arr) => arr[i]));
}

export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map((item) => item[key]);
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
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
