export class Map<K, V> {
  private keys: K[] = [];
  private values: V[] = [];

  set(key: K, value: V): this {
    const index = this.keys.findIndex(k => this.equals(k, key));
    if (index >= 0) {
      this.values[index] = value;
    } else {
      this.keys.push(key);
      this.values.push(value);
    }
    return this;
  }

  get(key: K): V | undefined {
    const index = this.keys.findIndex(k => this.equals(k, key));
    return index >= 0 ? this.values[index] : undefined;
  }

  has(key: K): boolean {
    return this.keys.some(k => this.equals(k, key));
  }

  delete(key: K): boolean {
    const index = this.keys.findIndex(k => this.equals(k, key));
    if (index >= 0) {
      this.keys.splice(index, 1);
      this.values.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.keys = [];
    this.values = [];
  }

  get size(): number {
    return this.keys.length;
  }

  keysArray(): K[] {
    return [...this.keys];
  }

  valuesArray(): V[] {
    return [...this.values];
  }

  entries(): Array<[K, V]> {
    return this.keys.map((k, i) => [k, this.values[i]]);
  }

  forEach(fn: (value: V, key: K) => void): void {
    this.keys.forEach((k, i) => fn(this.values[i], k));
  }

  map<R>(fn: (value: V, key: K) => R): R[] {
    return this.keys.map((k, i) => fn(this.values[i], k));
  }

  filter(fn: (value: V, key: K) => boolean): Array<[K, V]> {
    return this.entries().filter(([k, v]) => fn(v, k));
  }

  private equals(a: K, b: K): boolean {
    return a === b || JSON.stringify(a) === JSON.stringify(b);
  }
}

export class Set<T> {
  private items: T[] = [];

  add(item: T): this {
    if (!this.has(item)) {
      this.items.push(item);
    }
    return this;
  }

  has(item: T): boolean {
    return this.items.some(i => this.equals(i, item));
  }

  delete(item: T): boolean {
    const index = this.items.findIndex(i => this.equals(i, item));
    if (index >= 0) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.items = [];
  }

  get size(): number {
    return this.items.length;
  }

  toArray(): T[] {
    return [...this.items];
  }

  forEach(fn: (item: T) => void): void {
    this.items.forEach(fn);
  }

  map<R>(fn: (item: T) => R): R[] {
    return this.items.map(fn);
  }

  filter(fn: (item: T) => boolean): T[] {
    return this.items.filter(fn);
  }

  union(other: Set<T>): Set<T> {
    const result = new Set<T>();
    this.items.forEach(item => result.add(item));
    other.items.forEach(item => result.add(item));
    return result;
  }

  intersection(other: Set<T>): Set<T> {
    const result = new Set<T>();
    this.items.forEach(item => {
      if (other.has(item)) result.add(item);
    });
    return result;
  }

  difference(other: Set<T>): Set<T> {
    const result = new Set<T>();
    this.items.forEach(item => {
      if (!other.has(item)) result.add(item);
    });
    return result;
  }

  private equals(a: T, b: T): boolean {
    return a === b || JSON.stringify(a) === JSON.stringify(b);
  }
}

export class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): this {
    this.items.push(item);
    return this;
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

export class Stack<T> {
  private items: T[] = [];

  push(item: T): this {
    this.items.push(item);
    return this;
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority = 0): this {
    const entry = { item, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (priority < this.items[i].priority) {
        this.items.splice(i, 0, entry);
        added = true;
        break;
      }
    }
    if (!added) this.items.push(entry);
    return this;
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

export class Heap<T> {
  private items: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) {
    this.compare = compareFn;
  }

  insert(item: T): this {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
    return this;
  }

  extract(): T | undefined {
    if (this.items.length === 0) return undefined;
    const result = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parent]) >= 0) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }
      if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}
