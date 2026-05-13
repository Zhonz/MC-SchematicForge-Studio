export interface QueueOptions<T> {
  maxSize?: number;
  onOverflow?: (item: T) => void;
}

export class Queue<T> {
  private items: T[] = [];
  private maxSize: number;
  private onOverflow?: (item: T) => void;

  constructor(options: QueueOptions<T> = {}) {
    this.maxSize = options.maxSize ?? Infinity;
    this.onOverflow = options.onOverflow;
  }

  enqueue(item: T): boolean {
    if (this.items.length >= this.maxSize) {
      if (this.onOverflow) {
        this.onOverflow(item);
        return false;
      }
      return false;
    }
    this.items.push(item);
    return true;
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isFull(): boolean {
    return this.items.length >= this.maxSize;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }

  forEach(callback: (item: T) => void): void {
    this.items.forEach(callback);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  map<U>(fn: (item: T) => U): U[] {
    return this.items.map(fn);
  }
}

export class Deque<T> {
  private items: T[] = [];
  private front = 0;
  private rear = 0;
  private count = 0;
  private capacity: number;

  constructor(capacity: number = Infinity) {
    this.capacity = capacity;
    this.items = new Array(capacity);
  }

  addFront(item: T): boolean {
    if (this.count >= this.capacity) return false;
    this.front = (this.front - 1 + this.capacity) % this.capacity;
    this.items[this.front] = item;
    this.count++;
    return true;
  }

  addRear(item: T): boolean {
    if (this.count >= this.capacity) return false;
    this.items[this.rear] = item;
    this.rear = (this.rear + 1) % this.capacity;
    this.count++;
    return true;
  }

  removeFront(): T | undefined {
    if (this.count === 0) return undefined;
    const item = this.items[this.front];
    this.front = (this.front + 1) % this.capacity;
    this.count--;
    return item;
  }

  removeRear(): T | undefined {
    if (this.count === 0) return undefined;
    this.rear = (this.rear - 1 + this.capacity) % this.capacity;
    const item = this.items[this.rear];
    this.count--;
    return item;
  }

  peekFront(): T | undefined {
    return this.count > 0 ? this.items[this.front] : undefined;
  }

  peekRear(): T | undefined {
    return this.count > 0 ? this.items[(this.rear - 1 + this.capacity) % this.capacity] : undefined;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  size(): number {
    return this.count;
  }

  clear(): void {
    this.front = 0;
    this.rear = 0;
    this.count = 0;
    this.items = new Array(this.capacity);
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.front + i) % this.capacity;
      const item = this.items[index];
      if (item !== undefined) result.push(item);
    }
    return result;
  }
}

export class PriorityDeque<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number = 0): void {
    const newItem = { item, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i]!.priority > priority) {
        this.items.splice(i, 0, newItem);
        added = true;
        break;
      }
    }
    if (!added) this.items.push(newItem);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  peekPriority(): number | undefined {
    return this.items[0]?.priority;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  updatePriority(item: T, newPriority: number): boolean {
    const index = this.items.findIndex((i) => i.item === item);
    if (index === -1) return false;
    this.items.splice(index, 1);
    this.enqueue(item, newPriority);
    return true;
  }

  contains(item: T): boolean {
    return this.items.some((i) => i.item === item);
  }

  getPriority(item: T): number | undefined {
    const found = this.items.find((i) => i.item === item);
    return found?.priority;
  }
}
