export type BinaryPredicate<T, U = T> = (a: T, b: U) => boolean;
export type Comparator<T> = (a: T, b: T) => number;
export type Mapper<T, U = T> = (item: T, index: number) => U;
export type Predicate<T> = (item: T, index: number) => boolean;
export type Reducer<T, U = T> = (acc: U, item: T, index: number) => U;
export type Action<T> = (item: T, index: number) => void;

export class Collection<T> {
  private items: T[];

  constructor(items: T[] = []) {
    this.items = [...items];
  }

  static from<T>(items: T[]): Collection<T> {
    return new Collection(items);
  }

  static range(start: number, end: number, step = 1): Collection<number> {
    const items: number[] = [];
    for (let i = start; i < end; i += step) {
      items.push(i);
    }
    return new Collection(items);
  }

  static repeat<T>(value: T, count: number): Collection<T> {
    return new Collection(Array(count).fill(value));
  }

  static of<T>(...values: T[]): Collection<T> {
    return new Collection(values);
  }

  static empty<T>(): Collection<T> {
    return new Collection();
  }

  toArray(): T[] {
    return [...this.items];
  }

  forEach(action: Action<T>): this {
    this.items.forEach(action);
    return this;
  }

  map<U>(mapper: Mapper<T, U>): Collection<U> {
    return new Collection(this.items.map(mapper));
  }

  filter(predicate: Predicate<T>): Collection<T> {
    return new Collection(this.items.filter(predicate));
  }

  reduce<U>(reducer: Reducer<T, U>, initial: U): U {
    return this.items.reduce(reducer, initial);
  }

  find(predicate: Predicate<T>): T | undefined {
    return this.items.find(predicate);
  }

  findIndex(predicate: Predicate<T>): number {
    return this.items.findIndex(predicate);
  }

  some(predicate: Predicate<T>): boolean {
    return this.items.some(predicate);
  }

  every(predicate: Predicate<T>): boolean {
    return this.items.every(predicate);
  }

  none(predicate: Predicate<T>): boolean {
    return !this.some(predicate);
  }

  includes(item: T): boolean {
    return this.items.includes(item);
  }

  count(predicate?: Predicate<T>): number {
    if (!predicate) return this.items.length;
    return this.items.filter(predicate).length;
  }

  first(): T | undefined {
    return this.items[0];
  }

  last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  take(count: number): Collection<T> {
    return new Collection(this.items.slice(0, count));
  }

  takeWhile(predicate: Predicate<T>): Collection<T> {
    const result: T[] = [];
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) {
        result.push(this.items[i]);
      } else {
        break;
      }
    }
    return new Collection(result);
  }

  skip(count: number): Collection<T> {
    return new Collection(this.items.slice(count));
  }

  skipWhile(predicate: Predicate<T>): Collection<T> {
    let skip = true;
    const result: T[] = [];
    for (let i = 0; i < this.items.length; i++) {
      if (skip && predicate(this.items[i], i)) {
        continue;
      }
      skip = false;
      result.push(this.items[i]);
    }
    return new Collection(result);
  }

  distinct(): Collection<T> {
    return new Collection([...new Set(this.items)]);
  }

  distinctBy<U>(mapper: Mapper<T, U>): Collection<T> {
    const seen = new Set<U>();
    const result: T[] = [];
    for (let i = 0; i < this.items.length; i++) {
      const key = mapper(this.items[i], i);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(this.items[i]);
      }
    }
    return new Collection(result);
  }

  sort(comparator?: Comparator<T>): Collection<T> {
    return new Collection([...this.items].sort(comparator));
  }

  reverse(): Collection<T> {
    return new Collection([...this.items].reverse());
  }

  shuffle(): Collection<T> {
    const result = [...this.items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return new Collection(result);
  }

  sample(count = 1): Collection<T> {
    const shuffled = this.shuffle();
    return new Collection(shuffled.items.slice(0, Math.min(count, shuffled.items.length)));
  }

  chunk(size: number): Collection<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(this.items.slice(i, i + size));
    }
    return new Collection(chunks);
  }

  flatten<U>(depth = 1): Collection<U> {
    if (depth === 0) return this as unknown as Collection<U>;
    const result: U[] = [];
    const flattenRecursive = (arr: unknown[], currentDepth: number) => {
      for (const item of arr) {
        if (Array.isArray(item) && currentDepth < depth) {
          flattenRecursive(item, currentDepth + 1);
        } else {
          result.push(item as U);
        }
      }
    };
    flattenRecursive(this.items as unknown as unknown[], 0);
    return new Collection(result);
  }

  flatMap<U>(mapper: Mapper<T, U[]>): Collection<U> {
    return this.map(mapper).flatten<U>();
  }

  union<U>(other: U[]): Collection<T | U> {
    return new Collection([...this.items, ...other]);
  }

  intersection<U>(other: U[]): Collection<unknown> {
    const otherSet = new Set(other);
    return new Collection(this.items.filter(item => otherSet.has(item as unknown as U)));
  }

  difference<U>(other: U[]): Collection<T> {
    const otherSet = new Set(other);
    return new Collection(this.items.filter(item => !otherSet.has(item as unknown as U)));
  }

  isSubsetOf<U>(other: U[]): boolean {
    const otherSet = new Set(other);
    return this.items.every(item => otherSet.has(item as unknown as U));
  }

  isSupersetOf<U>(other: U[]): boolean {
    const thisSet = new Set(this.items);
    return other.every(item => thisSet.has(item as unknown as T));
  }

  join(separator = ','): string {
    return this.items.join(separator);
  }

  sum(): T extends number ? number : never {
    if (typeof this.items[0] === 'number') {
      return (this.items as number[]).reduce((a, b) => a + b, 0) as T extends number ? number : never;
    }
    throw new Error('Sum can only be applied to numeric collections');
  }

  average(): T extends number ? number : never {
    if (typeof this.items[0] === 'number' && this.items.length > 0) {
      return (this.items as number[]).reduce((a, b) => a + b, 0) / this.items.length as T extends number ? number : never;
    }
    throw new Error('Average can only be applied to numeric collections');
  }

  min(): T | undefined {
    if (this.items.length === 0) return undefined;
    return this.items.reduce((a, b) => (a < b ? a : b));
  }

  max(): T | undefined {
    if (this.items.length === 0) return undefined;
    return this.items.reduce((a, b) => (a > b ? a : b));
  }

  partition(predicate: Predicate<T>): [Collection<T>, Collection<T>] {
    const truthy: T[] = [];
    const falsy: T[] = [];
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i], i)) {
        truthy.push(this.items[i]);
      } else {
        falsy.push(this.items[i]);
      }
    }
    return [new Collection(truthy), new Collection(falsy)];
  }

  groupBy<U>(mapper: Mapper<T, U>): Map<U, T[]> {
    const map = new Map<U, T[]>();
    for (let i = 0; i < this.items.length; i++) {
      const key = mapper(this.items[i], i);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(this.items[i]);
    }
    return map;
  }

  zip<U>(other: U[]): Collection<[T, U]> {
    const length = Math.min(this.items.length, other.length);
    const result: [T, U][] = [];
    for (let i = 0; i < length; i++) {
      result.push([this.items[i], other[i]]);
    }
    return new Collection(result);
  }

  unzip<U, V>(): [Collection<U>, Collection<V>] {
    const first: U[] = [];
    const second: V[] = [];
    for (const [a, b] of this.items as unknown as [U, V][]) {
      first.push(a);
      second.push(b);
    }
    return [new Collection(first), new Collection(second)];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isNotEmpty(): boolean {
    return !this.isEmpty();
  }

  size(): number {
    return this.items.length;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}

export const collect = <T>(items: T[]): Collection<T> => Collection.from(items);
export const range = Collection.range;
export const repeat = Collection.repeat;
export const of = Collection.of;
