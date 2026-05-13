export type Comparator<T> = (a: T, b: T) => number;

export function sort<T>(arr: T[], compare?: Comparator<T>): T[] {
  return [...arr].sort(compare);
}

export function reverse<T>(arr: T[]): T[] {
  return [...arr].reverse();
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function uniqueBy<T>(arr: T[], key: (item: T) => unknown): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const k = key(item);
    const keyStr = JSON.stringify(k);
    if (seen.has(keyStr)) return false;
    seen.add(keyStr);
    return true;
  });
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function flatten<T>(arr: unknown[][]): T[] {
  return arr.flat() as T[];
}

export function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce((result, item) => {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

export function partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  arr.forEach(item => (predicate(item) ? truthy : falsy).push(item));
  return [truthy, falsy];
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function average(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : 0;
}

export function min(arr: number[]): number | undefined {
  return arr.length ? Math.min(...arr) : undefined;
}

export function max(arr: number[]): number | undefined {
  return arr.length ? Math.max(...arr) : undefined;
}

export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

export function skip<T>(arr: T[], n: number): T[] {
  return arr.slice(n);
}

export function pluck<T, K extends keyof T>(arr: T[], key: K): T[K][] {
  return arr.map(item => item[key]);
}

export function sortBy<T>(arr: T[], key: (item: T) => number | string): T[] {
  return [...arr].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return 0;
  });
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter(item => set.has(item));
}

export function difference<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter(item => !set.has(item));
}

export function zip<T, U>(a: T[], b: U[]): Array<[T, U]> {
  const len = Math.min(a.length, b.length);
  return a.slice(0, len).map((item, i) => [item, b[i]] as [T, U]);
}
