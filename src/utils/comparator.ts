export function compare<T>(a: T, b: T, key?: (item: T) => unknown): number {
  if (key) {
    const aVal = key(a);
    const bVal = key(b);
    if (aVal === bVal) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  }
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function compareStrings(a: string, b: string, caseSensitive: boolean = false): number {
  if (!caseSensitive) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  return a.localeCompare(b);
}

export function compareNumbers(a: number, b: number): number {
  return a - b;
}

export function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function descending<T>(compareFn: (a: T, b: T) => number): (a: T, b: T) => number {
  return (a: T, b: T): number => -compareFn(a, b);
}

export function thenBy<T>(compareFn: (a: T, b: T) => number, nextCompareFn: (a: T, b: T) => number): (a: T, b: T) => number {
  return (a: T, b: T): number => {
    const result = compareFn(a, b);
    if (result !== 0) return result;
    return nextCompareFn(a, b);
  };
}

export class Comparator<T> {
  private comparisons: Array<(a: T, b: T) => number> = [];

  compare(a: T, b: T): number {
    for (const comparison of this.comparisons) {
      const result = comparison(a, b);
      if (result !== 0) return result;
    }
    return 0;
  }

  add(comparison: (a: T, b: T) => number): this {
    this.comparisons.push(comparison);
    return this;
  }

  compareBy<K>(key: (item: T) => K, order: 'asc' | 'desc' = 'asc'): this {
    const fn = (a: T, b: T): number => {
      const aVal = key(a);
      const bVal = key(b);
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    };
    if (order === 'desc') {
      this.comparisons.push((a, b) => -fn(a, b));
    } else {
      this.comparisons.push(fn);
    }
    return this;
  }

  compareByString(key: (item: T) => string, order: 'asc' | 'desc' = 'asc', caseSensitive: boolean = false): this {
    const fn = (a: T, b: T): number => compareStrings(key(a), key(b), caseSensitive);
    if (order === 'desc') {
      this.comparisons.push((a, b) => -fn(a, b));
    } else {
      this.comparisons.push(fn);
    }
    return this;
  }

  compareByNumber(key: (item: T) => number, order: 'asc' | 'desc' = 'asc'): this {
    const fn = (a: T, b: T): number => compareNumbers(key(a), key(b));
    if (order === 'desc') {
      this.comparisons.push((a, b) => -fn(a, b));
    } else {
      this.comparisons.push(fn);
    }
    return this;
  }

  compareByDate(key: (item: T) => Date, order: 'asc' | 'desc' = 'asc'): this {
    const fn = (a: T, b: T): number => compareDates(key(a), key(b));
    if (order === 'desc') {
      this.comparisons.push((a, b) => -fn(a, b));
    } else {
      this.comparisons.push(fn);
    }
    return this;
  }

  reverse(): this {
    this.comparisons = this.comparisons.map((fn) => (a: T, b: T) => -fn(a, b));
    return this;
  }

  static naturalOrder<T>(): (a: T, b: T) => number {
    return (a, b) => compare(a, b);
  }

  static reverseOrder<T>(): (a: T, b: T) => number {
    return (a, b) => compare(b, a);
  }
}

export function sort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
  return [...array].sort(compareFn);
}

export function sortBy<T, K>(array: T[], key: (item: T) => K, order: 'asc' | 'desc' = 'asc'): T[] {
  const comparator = new Comparator<T>().compareBy(key, order);
  return sort(array, comparator.compare.bind(comparator));
}

export function stableSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
  const indexed = array.map((item, index) => ({ item, index }));
  const sorted = [...indexed].sort((a, b) => {
    const result = compareFn(a.item, b.item);
    return result !== 0 ? result : a.index - b.index;
  });
  return sorted.map(({ item }) => item);
}
