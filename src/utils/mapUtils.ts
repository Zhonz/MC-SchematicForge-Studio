export interface MapOptions {
  defaultValue?: unknown;
}

export class MapUtils {
  static invert<K extends string | number, V extends string | number>(map: Map<K, V>): Map<V, K> {
    const result = new Map<V, K>();
    map.forEach((value, key) => result.set(value, key));
    return result;
  }

  static getOrDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
    const value = map.get(key);
    return value !== undefined ? value : defaultValue;
  }

  static setIfAbsent<K, V>(map: Map<K, V>, key: K, value: V): V {
    const existing = map.get(key);
    if (existing !== undefined) return existing;
    map.set(key, value);
    return value;
  }

  static mapValues<K, V, U>(map: Map<K, V>, fn: (value: V, key: K) => U): Map<K, U> {
    const result = new Map<K, U>();
    map.forEach((value, key) => result.set(key, fn(value, key)));
    return result;
  }

  static mapKeys<K, V, U>(map: Map<K, V>, fn: (key: K, value: V) => U): Map<U, V> {
    const result = new Map<U, V>();
    map.forEach((value, key) => result.set(fn(key, value), value));
    return result;
  }

  static filter<K, V>(map: Map<K, V>, predicate: (value: V, key: K) => boolean): Map<K, V> {
    const result = new Map<K, V>();
    map.forEach((value, key) => {
      if (predicate(value, key)) result.set(key, value);
    });
    return result;
  }

  static flatten<K, V>(map: Map<K, V[]>): Map<K, V> {
    const result = new Map<K, V>();
    map.forEach((values, key) => {
      values.forEach((value) => result.set(key, value));
    });
    return result;
  }

  static groupBy<K, V, G>(array: V[], keyFn: (item: V) => K): Map<K, V[]> {
    const result = new Map<K, V[]>();
    array.forEach((item) => {
      const key = keyFn(item);
      const group = result.get(key) ?? [];
      group.push(item);
      result.set(key, group);
    });
    return result;
  }

  static toObject<K extends string, V>(map: Map<K, V>): Record<K, V> {
    const result: Partial<Record<K, V>> = {};
    map.forEach((value, key) => {
      result[key] = value;
    });
    return result as Record<K, V>;
  }

  static fromObject<T>(obj: Record<string, T>): Map<string, T> {
    return new Map(Object.entries(obj));
  }

  static merge<K, V>(...maps: Map<K, V>[]): Map<K, V> {
    const result = new Map<K, V>();
    maps.forEach((map) => map.forEach((value, key) => result.set(key, value)));
    return result;
  }

  static isEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (b.get(key) !== value) return false;
    }
    return true;
  }
}

export class HashMap<K = string, V = unknown> {
  private items: Map<string, V> = new Map();
  private hasher: (key: K) => string;

  constructor(hasher: (key: K) => string = String) {
    this.hasher = hasher;
  }

  set(key: K, value: V): this {
    this.items.set(this.hasher(key), value);
    return this;
  }

  get(key: K): V | undefined {
    return this.items.get(this.hasher(key));
  }

  has(key: K): boolean {
    return this.items.has(this.hasher(key));
  }

  delete(key: K): boolean {
    return this.items.delete(this.hasher(key));
  }

  clear(): void {
    this.items.clear();
  }

  size(): number {
    return this.items.size;
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  keys(): K[] {
    return [] as K[];
  }

  values(): V[] {
    return Array.from(this.items.values());
  }

  entries(): [K, V][] {
    return [] as [K, V][];
  }

  forEach(callback: (value: V, key: K) => void): void {
    this.items.forEach((value) => callback(value, {} as K));
  }

  map<U>(fn: (value: V, key: K) => U): HashMap<K, U> {
    const result = new HashMap<K, U>(this.hasher);
    this.items.forEach((value, key) => result.items.set(key, fn(value, {} as K)));
    return result;
  }

  filter(predicate: (value: V, key: K) => boolean): HashMap<K, V> {
    const result = new HashMap<K, V>(this.hasher);
    this.items.forEach((value, key) => {
      if (predicate(value, {} as K)) result.items.set(key, value);
    });
    return result;
  }

  merge(other: HashMap<K, V>): this {
    other.items.forEach((value, key) => this.items.set(key, value));
    return this;
  }

  clone(): HashMap<K, V> {
    const result = new HashMap<K, V>(this.hasher);
    result.items = new Map(this.items);
    return result;
  }
}
