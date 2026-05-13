export interface TimedCacheOptions<V> {
  ttl?: number;
  maxSize?: number;
  cleanupInterval?: number;
}

export class TimedCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private ttl: number;
  private maxSize: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(options: TimedCacheOptions<V> = {}) {
    this.cache = new Map();
    this.ttl = options.ttl ?? 60000;
    this.maxSize = options.maxSize ?? Infinity;
    if (options.cleanupInterval) {
      this.cleanupInterval = setInterval(() => this.cleanup(), options.cleanupInterval);
    }
  }

  set(key: K, value: V): this {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }
}

export class WriteBuffer<K, V> {
  private buffer: Map<K, V>;
  private maxSize: number;
  private onFlush?: (data: Map<K, V>) => void;
  private flushInterval?: ReturnType<typeof setInterval>;
  private flushThreshold?: number;

  constructor(maxSize: number, options: { onFlush?: (data: Map<K, V>) => void; interval?: number; flushThreshold?: number } = {}) {
    this.buffer = new Map();
    this.maxSize = maxSize;
    this.onFlush = options.onFlush;
    this.flushThreshold = options.flushThreshold;
    if (options.interval) {
      this.flushInterval = setInterval(() => this.flush(), options.interval);
    }
  }

  set(key: K, value: V): this {
    this.buffer.set(key, value);
    if (this.buffer.size >= this.maxSize || (this.flushThreshold && this.buffer.size >= this.flushThreshold)) {
      this.flush();
    }
    return this;
  }

  flush(): Map<K, V> {
    const data = new Map(this.buffer);
    if (data.size > 0) {
      this.buffer.clear();
      if (this.onFlush) this.onFlush(data);
    }
    return data;
  }

  size(): number {
    return this.buffer.size;
  }

  isEmpty(): boolean {
    return this.buffer.size === 0;
  }

  clear(): void {
    this.buffer.clear();
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }
    this.flush();
  }
}

export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): boolean {
    if (this.count === this.capacity) return false;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  pop(): T | undefined {
    if (this.count === 0) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[this.head];
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
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) result.push(item);
    }
    return result;
  }
}
