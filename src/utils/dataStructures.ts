export interface HeapNode<T> {
  value: T;
  priority: number;
}

export class MinHeap<T> {
  private heap: HeapNode<T>[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(value: T, priority: number): void {
    this.heap.push({ value, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin(): T | undefined {
    if (this.isEmpty()) return undefined;

    const min = this.heap[0];
    const last = this.heap.pop();

    if (!this.isEmpty() && last !== undefined) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return min?.value;
  }

  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex]?.priority <= this.heap[index]?.priority) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length && this.heap[leftChild]?.priority < this.heap[smallest]?.priority) {
        smallest = leftChild;
      }

      if (rightChild < this.heap.length && this.heap[rightChild]?.priority < this.heap[smallest]?.priority) {
        smallest = rightChild;
      }

      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}

export class MaxHeap<T> {
  private heap: HeapNode<T>[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(value: T, priority: number): void {
    this.heap.push({ value, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  extractMax(): T | undefined {
    if (this.isEmpty()) return undefined;

    const max = this.heap[0];
    const last = this.heap.pop();

    if (!this.isEmpty() && last !== undefined) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return max?.value;
  }

  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  clear(): void {
    this.heap = [];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex]?.priority >= this.heap[index]?.priority) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let largest = index;

      if (leftChild < this.heap.length && this.heap[leftChild]?.priority > this.heap[largest]?.priority) {
        largest = leftChild;
      }

      if (rightChild < this.heap.length && this.heap[rightChild]?.priority > this.heap[largest]?.priority) {
        largest = rightChild;
      }

      if (largest === index) break;
      this.swap(index, largest);
      index = largest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}

export class DisjointSet<T> {
  private parent: Map<T, T>;
  private rank: Map<T, number>;

  constructor(items?: T[]) {
    this.parent = new Map();
    this.rank = new Map();
    if (items) {
      for (const item of items) {
        this.makeSet(item);
      }
    }
  }

  makeSet(item: T): void {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
    }
  }

  find(item: T): T {
    if (this.parent.get(item) !== item) {
      this.parent.set(item, this.find(this.parent.get(item)!));
    }
    return this.parent.get(item)!;
  }

  union(item1: T, item2: T): void {
    const root1 = this.find(item1);
    const root2 = this.find(item2);

    if (root1 === root2) return;

    const rank1 = this.rank.get(root1) || 0;
    const rank2 = this.rank.get(root2) || 0;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }
  }

  connected(item1: T, item2: T): boolean {
    return this.find(item1) === this.find(item2);
  }
}

export class BloomFilter<T> {
  private bits: boolean[];
  private size: number;
  private hashCount: number;

  constructor(size: number, hashCount: number) {
    this.size = size;
    this.hashCount = hashCount;
    this.bits = new Array(size).fill(false);
  }

  add(item: T): void {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(item, i);
      this.bits[index] = true;
    }
  }

  contains(item: T): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(item, i);
      if (!this.bits[index]) return false;
    }
    return true;
  }

  private hash(item: T, seed: number): number {
    const str = JSON.stringify(item);
    let hash = seed * 31;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % this.size);
  }

  clear(): void {
    this.bits.fill(false);
  }

  getFalsePositiveRate(): number {
    let setBits = 0;
    for (const bit of this.bits) {
      if (bit) setBits++;
    }
    const k = this.hashCount;
    const m = this.size;
    const p = Math.pow(1 - Math.exp(-k / m * setBits), k);
    return p;
  }
}

export class SkipList<T> {
  private head: SkipListNode<T>;
  private maxLevel: number;
  private probability = 0.5;

  constructor(maxLevel = 16) {
    this.maxLevel = maxLevel;
    this.head = new SkipListNode<T>(undefined as T, maxLevel);
  }

  insert(value: T): void {
    const level = this.randomLevel();
    const newNode = new SkipListNode<T>(value, level + 1);

    let current = this.head;
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < value) {
        current = current.forward[i]!;
      }
      if (i <= level) {
        newNode.forward[i] = current.forward[i];
        current.forward[i] = newNode;
      }
    }
  }

  search(value: T): boolean {
    let current = this.head;
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < value) {
        current = current.forward[i]!;
      }
    }
    return current.forward[0]?.value === value;
  }

  delete(value: T): boolean {
    const update: (SkipListNode<T> | undefined)[] = [];

    let current: SkipListNode<T> = this.head;
    for (let i = this.maxLevel - 1; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < value) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }
    const nodeToDelete = current.forward[0];

    if (nodeToDelete?.value === value) {
      for (let i = 0; i < this.maxLevel; i++) {
        if (update[i]?.forward[i] !== nodeToDelete) break;
        update[i]!.forward[i] = nodeToDelete.forward[i];
      }
      return true;
    }
    return false;
  }

  private randomLevel(): number {
    let level = 0;
    while (Math.random() < this.probability && level < this.maxLevel - 1) {
      level++;
    }
    return level;
  }
}

class SkipListNode<T> {
  value: T;
  forward: (SkipListNode<T> | undefined)[];

  constructor(value: T, level: number) {
    this.value = value;
    this.forward = new Array(level);
  }
}

export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): boolean {
    if (this.isFull()) return false;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek(): T | undefined {
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
      result.push(this.buffer[index] as T);
    }
    return result;
  }
}
