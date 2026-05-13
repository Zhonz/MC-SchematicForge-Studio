export interface Task<T = unknown> {
  id: string;
  execute(): Promise<T> | T;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  timeout?: number;
  onSuccess?: (result: T) => void;
  onError?: (error: unknown) => void;
}

export interface QueueOptions<T = unknown> {
  concurrency?: number;
  retryDelay?: number;
  timeout?: number;
  onTaskStart?: (task: Task<T>) => void;
  onTaskComplete?: (task: Task<T>, result: T) => void;
  onTaskError?: (task: Task<T>, error: unknown) => void;
  onQueueEmpty?: () => void;
}

export class TaskQueue<T = unknown> {
  private queue: Task<T>[] = [];
  private running = 0;
  private results: Map<string, T> = new Map();
  private errors: Map<string, unknown> = new Map();
  private aborted = false;

  constructor(private options: QueueOptions<T> = {}) {
    this.options.concurrency = options.concurrency ?? 1;
    this.options.retryDelay = options.retryDelay ?? 1000;
  }

  enqueue(task: Task<T>): this {
    this.queue.push(task);
    this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    this.process();
    return this;
  }

  enqueueMany(tasks: Task<T>[]): this {
    tasks.forEach(task => this.enqueue(task));
    return this;
  }

  private async process(): Promise<void> {
    if (this.aborted) return;
    
    while (this.running < (this.options.concurrency ?? 1) && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      this.running++;
      this.options.onTaskStart?.(task);

      try {
        const result = await this.executeWithTimeout(task);
        this.results.set(task.id, result);
        this.options.onTaskComplete?.(task, result);
        task.onSuccess?.(result);
      } catch (error) {
        this.handleError(task, error as Error);
      } finally {
        this.running--;
        this.process();
      }
    }

    if (this.running === 0 && this.queue.length === 0) {
      this.options.onQueueEmpty?.();
    }
  }

  private async executeWithTimeout(task: Task<T>): Promise<T> {
    const timeout = task.timeout ?? this.options.timeout;
    
    if (timeout) {
      return Promise.race([
        Promise.resolve(task.execute()),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Task ${task.id} timed out`)), timeout)
        ),
      ]);
    }
    
    return Promise.resolve(task.execute());
  }

  private handleError(task: Task<T>, error: Error): void {
    const retries = task.retries ?? 0;
    const maxRetries = task.maxRetries ?? 0;

    if (retries < maxRetries) {
      task.retries = retries + 1;
      
      setTimeout(() => {
        this.queue.unshift(task);
        this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        this.process();
      }, this.options.retryDelay ?? 1000);
    } else {
      this.errors.set(task.id, error);
      this.options.onTaskError?.(task, error);
      task.onError?.(error);
    }
  }

  abort(): void {
    this.aborted = true;
    this.queue = [];
  }

  getResult(taskId: string): T | undefined {
    return this.results.get(taskId);
  }

  getError(taskId: string): unknown | undefined {
    return this.errors.get(taskId);
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running;
  }

  clear(): void {
    this.queue = [];
    this.results.clear();
    this.errors.clear();
  }
}

export class PriorityQueue<T> {
  private heap: T[] = [];
  
  constructor(
    private compare: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)
  ) {}

  private parent(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private left(i: number): number {
    return 2 * i + 1;
  }

  private right(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private heapifyUp(i: number): void {
    while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) < 0) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private heapifyDown(i: number): void {
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);

    if (l < this.heap.length && this.compare(this.heap[l], this.heap[smallest]) < 0) {
      smallest = l;
    }
    if (r < this.heap.length && this.compare(this.heap[r], this.heap[smallest]) < 0) {
      smallest = r;
    }
    if (smallest !== i) {
      this.swap(i, smallest);
      this.heapifyDown(smallest);
    }
  }

  push(item: T): this {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
    return this;
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    
    const top = this.heap[0];
    const last = this.heap.pop();
    
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    
    return top;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  clear(): void {
    this.heap = [];
  }

  toArray(): T[] {
    return [...this.heap];
  }
}

export class Deque<T> {
  private items: T[] = [];
  private head = 0;
  private tail = 0;
  private _size = 0;

  constructor(private capacity?: number) {}

  pushFront(item: T): boolean {
    if (this.capacity !== undefined && this._size >= this.capacity) {
      return false;
    }
    
    if (this.head === 0) {
      this.head = this.capacity !== undefined ? this.capacity - 1 : 100;
      this.items.unshift(item as any);
    } else {
      this.items[--this.head] = item;
    }
    this._size++;
    return true;
  }

  pushBack(item: T): boolean {
    if (this.capacity !== undefined && this._size >= this.capacity) {
      return false;
    }
    
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % (this.capacity ?? this.items.length + 1);
    this._size++;
    return true;
  }

  popFront(): T | undefined {
    if (this._size === 0) return undefined;
    
    const item = this.items[this.head];
    delete this.items[this.head];
    this.head = (this.head + 1) % (this.capacity ?? this.items.length);
    this._size--;
    return item;
  }

  popBack(): T | undefined {
    if (this._size === 0) return undefined;
    
    this.tail = this.tail === 0 ? (this.capacity ?? this.items.length) - 1 : this.tail - 1;
    const item = this.items[this.tail];
    delete this.items[this.tail];
    this._size--;
    return item;
  }

  peekFront(): T | undefined {
    return this._size > 0 ? this.items[this.head] : undefined;
  }

  peekBack(): T | undefined {
    if (this._size === 0) return undefined;
    const idx = this.tail === 0 ? (this.capacity ?? this.items.length) - 1 : this.tail - 1;
    return this.items[idx];
  }

  get size(): number {
    return this._size;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  get isFull(): boolean {
    return this.capacity !== undefined && this._size >= this.capacity;
  }

  clear(): void {
    this.items = [];
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      result.push(this.items[(this.head + i) % (this.capacity ?? this.items.length)]);
    }
    return result;
  }
}

export interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
  parent?: TreeNode<T>;
}

export class Tree<T> {
  private root: TreeNode<T> | null = null;

  constructor(private rootValue?: T) {
    if (rootValue !== undefined) {
      this.root = { value: rootValue, children: [] };
    }
  }

  setRoot(value: T): TreeNode<T> {
    this.root = { value, children: [] };
    return this.root;
  }

  getRoot(): TreeNode<T> | null {
    return this.root;
  }

  addChild(parent: TreeNode<T>, value: T): TreeNode<T> {
    const node: TreeNode<T> = { value, children: [], parent };
    parent.children.push(node);
    return node;
  }

  removeChild(parent: TreeNode<T>, child: TreeNode<T>): boolean {
    const idx = parent.children.indexOf(child);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
      child.parent = undefined;
      return true;
    }
    return false;
  }

  traverseDFS(node: TreeNode<T> | null = this.root, callback: (node: TreeNode<T>) => void): void {
    if (!node) return;
    callback(node);
    node.children.forEach(child => this.traverseDFS(child, callback));
  }

  traverseBFS(callback: (node: TreeNode<T>) => void): void {
    if (!this.root) return;
    
    const queue: TreeNode<T>[] = [this.root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      callback(node);
      queue.push(...node.children);
    }
  }

  find(predicate: (node: TreeNode<T>) => boolean): TreeNode<T> | null {
    let result: TreeNode<T> | null = null;
    
    this.traverseBFS(node => {
      if (!result && predicate(node)) {
        result = node;
      }
    });
    
    return result;
  }

  map<U>(transform: (node: TreeNode<T>) => U): Tree<U> {
    const newTree = new Tree<U>();
    
    if (!this.root) return newTree;
    
    const mapNode = (node: TreeNode<T>): TreeNode<U> => ({
      value: transform(node),
      children: node.children.map(mapNode),
    });
    
    newTree.root = mapNode(this.root);
    return newTree;
  }

  toArray(): T[] {
    const result: T[] = [];
    this.traverseBFS(node => result.push(node.value));
    return result;
  }

  height(node: TreeNode<T> = this.root!): number {
    if (!node) return 0;
    if (node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(child => this.height(child)));
  }

  size(node: TreeNode<T> = this.root!): number {
    if (!node) return 0;
    return 1 + node.children.reduce((acc, child) => acc + this.size(child), 0);
  }
}
