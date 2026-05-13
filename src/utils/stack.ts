export interface StackOptions<T> {
  maxSize?: number;
  onOverflow?: (item: T) => void;
}

export class Stack<T> {
  private items: T[] = [];
  private maxSize: number;
  private onOverflow?: (item: T) => void;

  constructor(options: StackOptions<T> = {}) {
    this.maxSize = options.maxSize ?? Infinity;
    this.onOverflow = options.onOverflow;
  }

  push(item: T): boolean {
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

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
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

  forEach(callback: (item: T, index: number) => void): void {
    this.items.forEach(callback);
  }

  map<U>(fn: (item: T) => U): U[] {
    return this.items.map(fn);
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  reverse(): T[] {
    return [...this.items].reverse();
  }
}

export class MinStack<T> {
  private stack: T[] = [];
  private minStack: T[] = [];

  push(item: T): void {
    this.stack.push(item);
    if (this.minStack.length === 0 || item <= this.minStack[this.minStack.length - 1]!) {
      this.minStack.push(item);
    }
  }

  pop(): T | undefined {
    const item = this.stack.pop();
    if (item !== undefined && item === this.minStack[this.minStack.length - 1]) {
      this.minStack.pop();
    }
    return item;
  }

  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  min(): T | undefined {
    return this.minStack[this.minStack.length - 1];
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  size(): number {
    return this.stack.length;
  }
}

export class MaxStack<T> {
  private stack: T[] = [];
  private maxStack: T[] = [];

  push(item: T): void {
    this.stack.push(item);
    if (this.maxStack.length === 0 || item >= this.maxStack[this.maxStack.length - 1]!) {
      this.maxStack.push(item);
    }
  }

  pop(): T | undefined {
    const item = this.stack.pop();
    if (item !== undefined && item === this.maxStack[this.maxStack.length - 1]) {
      this.maxStack.pop();
    }
    return item;
  }

  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  max(): T | undefined {
    return this.maxStack[this.maxStack.length - 1];
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  size(): number {
    return this.stack.length;
  }
}

export class TwoStackQueue<T> {
  private inbox: Stack<T> = new Stack();
  private outbox: Stack<T> = new Stack();

  enqueue(item: T): void {
    this.inbox.push(item);
  }

  dequeue(): T | undefined {
    if (this.outbox.isEmpty()) {
      while (!this.inbox.isEmpty()) {
        const item = this.inbox.pop();
        if (item !== undefined) this.outbox.push(item);
      }
    }
    return this.outbox.pop();
  }

  peek(): T | undefined {
    if (this.outbox.isEmpty()) {
      while (!this.inbox.isEmpty()) {
        const item = this.inbox.pop();
        if (item !== undefined) this.outbox.push(item);
      }
    }
    return this.outbox.peek();
  }

  isEmpty(): boolean {
    return this.inbox.isEmpty() && this.outbox.isEmpty();
  }

  size(): number {
    return this.inbox.size() + this.outbox.size();
  }
}
