export class LinkedListNode<T> {
  value: T;
  next: LinkedListNode<T> | null = null;
  prev: LinkedListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class LinkedList<T> {
  head: LinkedListNode<T> | null = null;
  tail: LinkedListNode<T> | null = null;
  private _size = 0;

  get size(): number {
    return this._size;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  push(value: T): void {
    const node = new LinkedListNode(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this._size++;
  }

  pop(): T | undefined {
    if (!this.tail) return undefined;
    const value = this.tail.value;
    this.tail = this.tail.prev;
    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }
    this._size--;
    return value;
  }

  unshift(value: T): void {
    const node = new LinkedListNode(value);
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this._size++;
  }

  shift(): T | undefined {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }
    this._size--;
    return value;
  }

  at(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    let node = this.head;
    for (let i = 0; i < index; i++) {
      node = node!.next;
    }
    return node?.value;
  }

  find(predicate: (value: T) => boolean): T | undefined {
    let node = this.head;
    while (node) {
      if (predicate(node.value)) return node.value;
      node = node.next;
    }
    return undefined;
  }

  has(predicate: (value: T) => boolean): boolean {
    return this.find(predicate) !== undefined;
  }

  toArray(): T[] {
    const result: T[] = [];
    let node = this.head;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  *[Symbol.iterator](): Iterator<T> {
    let node = this.head;
    while (node) {
      yield node.value;
      node = node.next;
    }
  }
}

export class Deque<T> {
  private list = new LinkedList<T>();

  get size(): number {
    return this.list.size;
  }

  get isEmpty(): boolean {
    return this.list.isEmpty;
  }

  pushFront(value: T): void {
    this.list.unshift(value);
  }

  pushBack(value: T): void {
    this.list.push(value);
  }

  popFront(): T | undefined {
    return this.list.shift();
  }

  popBack(): T | undefined {
    return this.list.pop();
  }

  front(): T | undefined {
    return this.list.at(0);
  }

  back(): T | undefined {
    return this.list.at(this.list.size - 1);
  }

  clear(): void {
    this.list.clear();
  }

  toArray(): T[] {
    return this.list.toArray();
  }
}
