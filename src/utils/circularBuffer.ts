export interface CircularBufferOptions<T> {
  capacity: number;
  overflow?: 'overwrite' | 'reject' | 'drop';
  onOverflow?: (item: T) => void;
}

export interface RingBufferOptions {
  capacity: number;
}

export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;
  private capacity: number;
  private overflow: 'overwrite' | 'reject' | 'drop';
  private onOverflow?: (item: T) => void;

  constructor(options: CircularBufferOptions<T>) {
    this.capacity = options.capacity;
    this.overflow = options.overflow || 'overwrite';
    this.onOverflow = options.onOverflow;
    this.buffer = new Array(this.capacity);
  }

  push(item: T): boolean {
    if (this.count === this.capacity) {
      switch (this.overflow) {
        case 'reject':
          return false;
        case 'drop':
          this.onOverflow?.(item);
          return false;
        case 'overwrite':
          const dropped = this.buffer[this.head];
          this.onOverflow?.(dropped as T);
          break;
      }
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
    
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

  peekLast(): T | undefined {
    if (this.count === 0) return undefined;
    const lastIndex = (this.tail - 1 + this.capacity) % this.capacity;
    return this.buffer[lastIndex];
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) return undefined;
    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  set(index: number, item: T): boolean {
    if (index < 0 || index >= this.count) return false;
    const actualIndex = (this.head + index) % this.capacity;
    this.buffer[actualIndex] = item;
    return true;
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
      const item = this.get(i);
      if (item !== undefined) result.push(item);
    }
    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    return {
      next: () => {
        if (index >= this.count) {
          return { done: true, value: undefined as unknown as T };
        }
        const value = this.get(index++)!;
        return { done: false, value };
      },
    };
  }

  get size(): number {
    return this.count;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  get remaining(): number {
    return this.capacity - this.count;
  }

  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) callback(item, i);
    }
  }

  map<U>(callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) result.push(callback(item, i));
    }
    return result;
  }

  filter(predicate: (item: T, index: number) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined && predicate(item, i)) result.push(item);
    }
    return result;
  }

  some(predicate: (item: T) => boolean): boolean {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined && predicate(item)) return true;
    }
    return false;
  }

  every(predicate: (item: T) => boolean): boolean {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined && !predicate(item)) return false;
    }
    return this.count > 0;
  }

  find(predicate: (item: T) => boolean): T | undefined {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined && predicate(item)) return item;
    }
    return undefined;
  }

  indexOf(item: T, fromIndex = 0): number {
    for (let i = fromIndex; i < this.count; i++) {
      const current = this.get(i);
      if (current === item) return i;
    }
    return -1;
  }

  includes(item: T): boolean {
    return this.indexOf(item) !== -1;
  }

  reduce<U>(callback: (acc: U, item: T, index: number) => U, initial: U): U {
    let acc = initial;
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) acc = callback(acc, item, i);
    }
    return acc;
  }
}

export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private writeIndex = 0;
  private readIndex = 0;
  private capacity: number;

  constructor(options: RingBufferOptions) {
    this.capacity = options.capacity;
    this.buffer = new Array(this.capacity);
  }

  write(item: T): boolean {
    if (this.isFull) {
      this.readIndex = (this.readIndex + 1) % this.capacity;
    }
    
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    
    if (this.count < this.capacity) {
      return true;
    }
    
    this.readIndex = this.writeIndex;
    return false;
  }

  read(): T | undefined {
    if (this.isEmpty) return undefined;
    
    const item = this.buffer[this.readIndex];
    this.buffer[this.readIndex] = undefined;
    this.readIndex = (this.readIndex + 1) % this.capacity;
    
    return item;
  }

  peek(): T | undefined {
    if (this.isEmpty) return undefined;
    return this.buffer[this.readIndex];
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.writeIndex = 0;
    this.readIndex = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    let idx = this.readIndex;
    let remaining = this.count;
    
    while (remaining > 0) {
      const item = this.buffer[idx];
      if (item !== undefined) {
        result.push(item);
        remaining--;
      }
      idx = (idx + 1) % this.capacity;
    }
    
    return result;
  }

  get count(): number {
    if (this.writeIndex >= this.readIndex) {
      return this.writeIndex - this.readIndex;
    }
    return this.capacity - this.readIndex + this.writeIndex;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }
}

export const circularBuffer = <T>(capacity: number, options?: Omit<CircularBufferOptions<T>, 'capacity'>) => 
  new CircularBuffer<T>({ capacity, ...options });

export const ringBuffer = <T>(capacity: number) => new RingBuffer<T>({ capacity });
