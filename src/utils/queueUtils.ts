export interface QueueOptions<T> {
  maxSize?: number;
  onEnqueue?: (item: T) => void;
  onDequeue?: (item: T) => void;
  onOverflow?: (item: T) => void;
}

export class Queue<T> {
  private items: T[] = [];
  private maxSize: number;
  private onEnqueue?: (item: T) => void;
  private onDequeue?: (item: T) => void;
  private onOverflow?: (item: T) => void;

  constructor(options: QueueOptions<T> = {}) {
    this.maxSize = options.maxSize ?? Infinity;
    this.onEnqueue = options.onEnqueue;
    this.onDequeue = options.onDequeue;
    this.onOverflow = options.onOverflow;
  }

  enqueue(item: T): boolean {
    if (this.items.length >= this.maxSize) {
      this.onOverflow?.(item);
      return false;
    }
    this.items.push(item);
    this.onEnqueue?.(item);
    return true;
  }

  dequeue(): T | undefined {
    const item = this.items.shift();
    if (item !== undefined) {
      this.onDequeue?.(item);
    }
    return item;
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

  *[Symbol.iterator](): Iterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }
}

export class Deque<T> {
  private items: T[] = [];
  private maxSize: number;

  constructor(maxSize = Infinity) {
    this.maxSize = maxSize;
  }

  addFront(item: T): boolean {
    if (this.items.length >= this.maxSize) return false;
    this.items.unshift(item);
    return true;
  }

  addBack(item: T): boolean {
    if (this.items.length >= this.maxSize) return false;
    this.items.push(item);
    return true;
  }

  removeFront(): T | undefined {
    return this.items.shift();
  }

  removeBack(): T | undefined {
    return this.items.pop();
  }

  peekFront(): T | undefined {
    return this.items[0];
  }

  peekBack(): T | undefined {
    return this.items[this.items.length - 1];
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
}

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];
  private compareFn: (a: number, b: number) => number;

  constructor(compareFn?: (a: number, b: number) => number) {
    this.compareFn = compareFn ?? ((a, b) => a - b);
  }

  enqueue(item: T, priority: number): void {
    const newItem = { item, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (this.compareFn(priority, this.items[i].priority) < 0) {
        this.items.splice(i, 0, newItem);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(newItem);
    }
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

  toArray(): T[] {
    return this.items.map((i) => i.item);
  }
}

export class CircularQueue<T> {
  private items: (T | undefined)[] = [];
  private head = 0;
  private tail = 0;
  private count = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.items = new Array(capacity).fill(undefined);
  }

  enqueue(item: T): boolean {
    if (this.isFull()) return false;
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[this.head];
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
    this.items = new Array(this.capacity).fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      result.push(this.items[index] as T);
    }
    return result;
  }
}

export class BlockingQueue<T> {
  private queue: Queue<T>;
  private waiting: Array<{ resolve: (value: T) => void; reject: (error: Error) => void }> = [];

  constructor(options?: QueueOptions<T>) {
    this.queue = new Queue(options);
  }

  enqueue(item: T): boolean {
    const added = this.queue.enqueue(item);
    if (added && this.waiting.length > 0) {
      const waiter = this.waiting.shift();
      const item = this.queue.dequeue();
      if (item !== undefined) {
        waiter?.resolve(item);
      }
    }
    return added;
  }

  async dequeue(): Promise<T> {
    const item = this.queue.dequeue();
    if (item !== undefined) {
      return item;
    }

    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  peek(): T | undefined {
    return this.queue.peek();
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  size(): number {
    return this.queue.size();
  }

  clear(): void {
    this.queue.clear();
    this.waiting = [];
  }
}
