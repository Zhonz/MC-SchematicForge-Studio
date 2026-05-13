export type ComparisonResult = -1 | 0 | 1;

export interface CompareOptions {
  caseSensitive?: boolean;
  numeric?: boolean;
  locale?: string | false;
  nullsFirst?: boolean;
}

export function compare(a: unknown, b: unknown, options: CompareOptions = {}): ComparisonResult {
  const { caseSensitive = true, numeric = false, locale = 'en', nullsFirst = true } = options;

  if (a === b) return 0;
  if (a === null || a === undefined) return nullsFirst ? -1 : 1;
  if (b === null || b === undefined) return nullsFirst ? 1 : -1;

  if (typeof a === 'string' && typeof b === 'string') {
    if (numeric) {
      const aNum = parseFloat(a);
      const bNum = parseFloat(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
      }
    }
    if (!caseSensitive) {
      const cmp = a.localeCompare(b, locale as string);
      return cmp < 0 ? -1 : cmp > 0 ? 1 : 0;
    }
    return a < b ? -1 : a > b ? 1 : 0;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() < b.getTime() ? -1 : a.getTime() > b.getTime() ? 1 : 0;
  }

  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) {
    const order = ['undefined', 'null', 'boolean', 'number', 'string', 'object'];
    return (order.indexOf(typeA) - order.indexOf(typeB)) as ComparisonResult;
  }

  return 0;
}

export function min<T>(...values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  let minVal = values[0];
  for (let i = 1; i < values.length; i++) {
    if (compare(values[i], minVal) < 0) minVal = values[i];
  }
  return minVal;
}

export function max<T>(...values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  let maxVal = values[0];
  for (let i = 1; i < values.length; i++) {
    if (compare(values[i], maxVal) > 0) maxVal = values[i];
  }
  return maxVal;
}

export function eq(a: unknown, b: unknown): boolean {
  return compare(a, b) === 0;
}

export function ne(a: unknown, b: unknown): boolean {
  return compare(a, b) !== 0;
}

export function lt(a: unknown, b: unknown): boolean {
  return compare(a, b) < 0;
}

export function le(a: unknown, b: unknown): boolean {
  return compare(a, b) <= 0;
}

export function gt(a: unknown, b: unknown): boolean {
  return compare(a, b) > 0;
}

export function ge(a: unknown, b: unknown): boolean {
  return compare(a, b) >= 0;
}

export function between(value: unknown, min: unknown, max: unknown): boolean {
  return compare(value, min) >= 0 && compare(value, max) <= 0;
}

export function clamp(value: unknown, min: unknown, max: unknown): unknown {
  if (compare(value, min) < 0) return min;
  if (compare(value, max) > 0) return max;
  return value;
}

export function sortBy<T>(arr: T[], key: keyof T | ((item: T) => unknown), options?: CompareOptions): T[] {
  return [...arr].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    return compare(aVal, bVal, options);
  });
}

export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => unknown)): Map<unknown, T[]> {
  const result = new Map<unknown, T[]>();
  for (const item of arr) {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!result.has(k)) result.set(k, []);
    result.get(k)!.push(item);
  }
  return result;
}
