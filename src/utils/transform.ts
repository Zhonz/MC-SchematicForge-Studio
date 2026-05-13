export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T | ((item: T) => unknown), order: 'asc' | 'desc' = 'asc'): T[] {
  const sorted = [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return order === 'asc' ? 1 : -1;
    if (bVal == null) return order === 'asc' ? -1 : 1;

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function uniqBy<T>(array: T[], key: keyof T | ((item: T) => unknown)): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((result, item) => {
    if (Array.isArray(item)) {
      result.push(...item);
    } else {
      result.push(item);
    }
    return result;
  }, []);
}

export function deepFlatten<T>(array: unknown[]): T[] {
  return array.reduce<T[]>((result, item) => {
    if (Array.isArray(item)) {
      result.push(...deepFlatten<T>(item));
    } else {
      result.push(item as T);
    }
    return result;
  }, []);
}

export function difference<T>(array: T[], ...others: T[][]): T[] {
  const otherSets = others.map(arr => new Set(arr));
  return array.filter(item => !otherSets.some(set => set.has(item)));
}

export function intersection<T>(array: T[], ...others: T[][]): T[] {
  const result: T[] = [];
  const sets = others.map(arr => new Set(arr));
  for (const item of array) {
    if (sets.every(set => set.has(item))) {
      result.push(item);
    }
  }
  return result;
}

export function union<T>(...arrays: T[][]): T[] {
  const seen = new Set<T>();
  for (const array of arrays) {
    for (const item of array) {
      seen.add(item);
    }
  }
  return Array.from(seen);
}

export function zip<T>(...arrays: T[][]): T[][] {
  const length = Math.min(...arrays.map(arr => arr.length));
  const result: T[][] = [];
  for (let i = 0; i < length; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  return result;
}

export function unzip<T>(zipped: T[][]): T[][] {
  if (zipped.length === 0) return [];
  const numArrays = zipped[0].length;
  const result: T[][] = Array.from({ length: numArrays }, () => []);
  for (const tuple of zipped) {
    for (let i = 0; i < numArrays; i++) {
      result[i].push(tuple[i]);
    }
  }
  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = fn(obj[key], key);
    }
  }
  return result;
}

export function mapKeys<T extends object>(
  obj: T,
  fn: (key: keyof T, value: T[keyof T]) => string
): Record<string, T[keyof T]> {
  const result: Record<string, T[keyof T]> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[fn(key, obj[key])] = obj[key];
    }
  }
  return result;
}

export function invert<T extends Record<string, string | number>>(obj: T): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[String(obj[key])] = key;
    }
  }
  return result;
}

export function deburr(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function words(str: string, pattern?: RegExp): string[] {
  if (pattern) {
    return str.match(pattern) || [];
  }
  return str.match(/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g) || [];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function camelCase(str: string): string {
  const words = deburr(str).match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g) || [];
  return words.map((w, i) => i === 0 ? w.toLowerCase() : capitalize(w)).join('');
}

export function snakeCase(str: string): string {
  const words = deburr(str).match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g) || [];
  return words.map(w => w.toLowerCase()).join('_');
}

export function kebabCase(str: string): string {
  const words = deburr(str).match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g) || [];
  return words.map(w => w.toLowerCase()).join('-');
}

export function padStart(str: string, length: number, chars = ' '): string {
  const padLength = Math.max(0, length - str.length);
  return chars.repeat(padLength) + str;
}

export function padEnd(str: string, length: number, chars = ' '): string {
  const padLength = Math.max(0, length - str.length);
  return str + chars.repeat(padLength);
}

export function truncate(str: string, length: number, ending = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - ending.length) + ending;
}

export function template(str: string, data?: Record<string, unknown>): string {
  return str.replace(/\${(\w+)}/g, (_, key) => {
    return data && data[key] !== undefined ? String(data[key]) : '';
  });
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value);
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return pipe(...fns.reverse());
}

export function curry(fn: (...args: unknown[]) => unknown, arity = fn.length): (...args: unknown[]) => unknown {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  };
}

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, unknown>();
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
