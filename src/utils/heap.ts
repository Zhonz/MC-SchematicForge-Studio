export interface HeapOptions<T> {
  compare?: (a: T, b: T) => number;
}

export class Heap<T = number> {
  private data: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(options: HeapOptions<T> = {}) {
    this.compare = options.compare ?? ((a: T, b: T) => {
      if (a === b) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return String(a) < String(b) ? -1 : 1;
    });
  }

  private parent(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private leftChild(index: number): number {
    return 2 * index + 1;
  }

  private rightChild(index: number): number {
    return 2 * index + 2;
  }

  private swap(i: number, j: number): void {
    const temp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = temp;
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const p = this.parent(index);
      if (this.compare(this.data[index], this.data[p]) >= 0) break;
      this.swap(index, p);
      index = p;
    }
  }

  private siftDown(index: number): void {
    const length = this.data.length;
    while (true) {
      const l = this.leftChild(index);
      const r = this.rightChild(index);
      let smallest = index;
      if (l < length && this.compare(this.data[l], this.data[smallest]) < 0) {
        smallest = l;
      }
      if (r < length && this.compare(this.data[r], this.data[smallest]) < 0) {
        smallest = r;
      }
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  insert(item: T): this {
    this.data.push(item);
    this.siftUp(this.data.length - 1);
    return this;
  }

  extract(): T | undefined {
    if (this.isEmpty()) return undefined;
    const result = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last !== undefined) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return result;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  size(): number {
    return this.data.length;
  }

  clear(): void {
    this.data = [];
  }

  toArray(): T[] {
    return [...this.data];
  }

  static minHeap<T>(elements: T[], compare?: (a: T, b: T) => number): Heap<T> {
    const heap = new Heap<T>({ compare });
    elements.forEach((el) => heap.insert(el));
    return heap;
  }

  static maxHeap<T>(elements: T[], compare?: (a: T, b: T) => number): Heap<T> {
    const reversedCompare: (a: T, b: T) => number = compare
      ? (a, b) => compare(b, a)
      : (a, b) => {
          if (a == null) return -1;
          if (b == null) return 1;
          if (typeof a === 'number' && typeof b === 'number') return b - a;
          return String(b) < String(a) ? -1 : 1;
        };
    const heap = new Heap<T>({ compare: reversedCompare });
    elements.forEach((el) => heap.insert(el));
    return heap;
  }
}

export function heapSort<T>(array: T[], compare?: (a: T, b: T) => number): T[] {
  const heap = new Heap<T>({ compare });
  array.forEach((item) => heap.insert(item));
  const result: T[] = [];
  while (!heap.isEmpty()) {
    const item = heap.extract();
    if (item !== undefined) result.push(item);
  }
  return result;
}

export class PriorityQueue<T = number> extends Heap<T> {
  enqueue(item: T): this {
    return this.insert(item);
  }

  dequeue(): T | undefined {
    return this.extract();
  }

  front(): T | undefined {
    return this.peek();
  }
}
