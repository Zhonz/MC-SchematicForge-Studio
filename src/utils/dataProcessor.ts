export type SortOrder = 'asc' | 'desc' | 'ascending' | 'descending';
export type CompareFn<T = unknown> = (a: T, b: T) => number;
export type KeyExtractor<T = unknown, K = unknown> = (item: T) => K;

export interface SortOptions<T = unknown> {
  key?: KeyExtractor<T, unknown>;
  order?: SortOrder;
  caseSensitive?: boolean;
  nullsFirst?: boolean;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GroupOptions<T = unknown, K = unknown> {
  key: KeyExtractor<T, K>;
  sort?: boolean;
  order?: SortOrder;
}

export class DataProcessor<T = unknown> {
  private data: T[];

  constructor(data: T[] = []) {
    this.data = [...data];
  }

  static from<T>(data: T[]): DataProcessor<T> {
    return new DataProcessor(data);
  }

  filter(predicate: (item: T, index: number) => boolean): DataProcessor<T> {
    return new DataProcessor(this.data.filter(predicate));
  }

  map<U>(mapper: (item: T, index: number) => U): DataProcessor<U> {
    return new DataProcessor(this.data.map(mapper));
  }

  flatMap<U>(mapper: (item: T, index: number) => U[]): DataProcessor<U> {
    return new DataProcessor(this.data.flatMap(mapper));
  }

  sort(comparer?: CompareFn<T>, order: SortOrder = 'asc'): DataProcessor<T> {
    const sorted = [...this.data].sort((a, b) => {
      const result = comparer ? comparer(a, b) : this.defaultCompare(a, b);
      return order === 'desc' || order === 'descending' ? -result : result;
    });
    return new DataProcessor(sorted);
  }

  sortBy(key: KeyExtractor<T, unknown>, order: SortOrder = 'asc'): DataProcessor<T> {
    return this.sort((a, b) => {
      const keyA = key(a);
      const keyB = key(b);
      return this.defaultCompare(keyA, keyB);
    }, order);
  }

  reverse(): DataProcessor<T> {
    return new DataProcessor([...this.data].reverse());
  }

  unique(): DataProcessor<T> {
    return new DataProcessor([...new Set(this.data)]);
  }

  uniqueBy(key: KeyExtractor<T, unknown>): DataProcessor<T> {
    const seen = new Set();
    const result: T[] = [];
    for (const item of this.data) {
      const k = key(item);
      if (!seen.has(k)) {
        seen.add(k);
        result.push(item);
      }
    }
    return new DataProcessor(result);
  }

  chunk(size: number): DataProcessor<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.data.length; i += size) {
      chunks.push(this.data.slice(i, i + size));
    }
    return new DataProcessor(chunks);
  }

  flatten<U>(): DataProcessor<U> {
    return new DataProcessor(this.data.flat() as unknown as U[]);
  }

  groupBy<K>(key: KeyExtractor<T, K>): Map<K, T[]> {
    const map = new Map<K, T[]>();
    for (const item of this.data) {
      const k = key(item);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(item);
    }
    return map;
  }

  partition(predicate: (item: T) => boolean): [T[], T[]] {
    const truthy: T[] = [];
    const falsy: T[] = [];
    for (const item of this.data) {
      if (predicate(item)) truthy.push(item);
      else falsy.push(item);
    }
    return [truthy, falsy];
  }

  reduce<U>(reducer: (acc: U, item: T, index: number) => U, initial: U): U {
    return this.data.reduce(reducer, initial);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.data.find(predicate);
  }

  findIndex(predicate: (item: T) => boolean): number {
    return this.data.findIndex(predicate);
  }

  some(predicate: (item: T) => boolean): boolean {
    return this.data.some(predicate);
  }

  every(predicate: (item: T) => boolean): boolean {
    return this.data.every(predicate);
  }

  none(predicate: (item: T) => boolean): boolean {
    return !this.some(predicate);
  }

  take(count: number): DataProcessor<T> {
    return new DataProcessor(this.data.slice(0, count));
  }

  skip(count: number): DataProcessor<T> {
    return new DataProcessor(this.data.slice(count));
  }

  first(): T | undefined {
    return this.data[0];
  }

  last(): T | undefined {
    return this.data[this.data.length - 1];
  }

  min(): T | undefined {
    if (this.data.length === 0) return undefined;
    return this.reduce((min, item) => {
      if (min === undefined) return item;
      return this.defaultCompare(item, min) < 0 ? item : min;
    }, undefined as unknown as T);
  }

  max(): T | undefined {
    if (this.data.length === 0) return undefined;
    return this.reduce((max, item) => {
      if (max === undefined) return item;
      return this.defaultCompare(item, max) > 0 ? item : max;
    }, undefined as unknown as T);
  }

  sum(): T extends number ? number : never {
    if (typeof this.data[0] === 'number') {
      return (this.data as number[]).reduce((a, b) => a + b, 0) as T extends number ? number : never;
    }
    throw new Error('Sum only works with numeric data');
  }

  average(): T extends number ? number : never {
    if (typeof this.data[0] === 'number' && this.data.length > 0) {
      return this.sum() as number / this.data.length as T extends number ? number : never;
    }
    throw new Error('Average only works with numeric data');
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.data.length;
    return this.data.filter(predicate).length;
  }

  pluck<K extends keyof T>(key: K): DataProcessor<T[K]> {
    return new DataProcessor(this.data.map(item => item[key]));
  }

  pick(predicate: (item: T) => boolean): DataProcessor<T> {
    return this.filter(predicate);
  }

  omit(predicate: (item: T) => boolean): DataProcessor<T> {
    return this.filter(item => !predicate(item));
  }

  shuffle(): DataProcessor<T> {
    const result = [...this.data];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return new DataProcessor(result);
  }

  sample(count = 1): DataProcessor<T> {
    return this.shuffle().take(count);
  }

  zip<U>(other: U[]): DataProcessor<[T, U]> {
    const length = Math.min(this.data.length, other.length);
    const result: [T, U][] = [];
    for (let i = 0; i < length; i++) {
      result.push([this.data[i], other[i]]);
    }
    return new DataProcessor(result);
  }

  union(other: T[]): DataProcessor<T> {
    return new DataProcessor([...this.data, ...other]);
  }

  intersection(other: T[]): DataProcessor<T> {
    const otherSet = new Set(other);
    return new DataProcessor(this.data.filter(item => otherSet.has(item)));
  }

  difference(other: T[]): DataProcessor<T> {
    const otherSet = new Set(other);
    return new DataProcessor(this.data.filter(item => !otherSet.has(item)));
  }

  paginate(options: PaginationOptions): PaginatedResult<T> {
    const { page = 1, pageSize = 10 } = options;
    const total = options.total ?? this.data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: this.data.slice(start, end),
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  toArray(): T[] {
    return [...this.data];
  }

  get length(): number {
    return this.data.length;
  }

  get isEmpty(): boolean {
    return this.data.length === 0;
  }

  get isNotEmpty(): boolean {
    return this.data.length > 0;
  }

  private defaultCompare(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
}

export const process = <T>(data: T[]) => DataProcessor.from(data);
