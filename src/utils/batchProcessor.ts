export interface BatchOptions {
  maxSize?: number;
  maxWait?: number;
  onFlush?: (items: unknown[]) => void;
}

export class BatchProcessor<T> {
  private queue: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<BatchOptions>;

  constructor(options: BatchOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 100,
      maxWait: options.maxWait ?? 1000,
      onFlush: options.onFlush ?? (() => {}),
    };
  }

  add(item: T): this {
    this.queue.push(item);
    if (this.queue.length >= this.options.maxSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.options.maxWait);
    }
    return this;
  }

  addMany(items: T[]): this {
    items.forEach((item) => this.add(item));
    return this;
  }

  flush(): T[] {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const items = [...this.queue];
    this.queue = [];
    if (items.length > 0) {
      this.options.onFlush(items);
    }
    return items;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
  }

  destroy(): void {
    this.clear();
  }
}

export class DebouncedBatch<T> {
  private queue: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private processor: (items: T[]) => void;
  private wait: number;
  private trailing: boolean;
  private leading: boolean;
  private maxSize: number;

  constructor(
    processor: (items: T[]) => void,
    wait: number = 300,
    options: { leading?: boolean; trailing?: boolean; maxSize?: number } = {}
  ) {
    this.processor = processor;
    this.wait = wait;
    this.leading = options.leading ?? false;
    this.trailing = options.trailing ?? true;
    this.maxSize = options.maxSize ?? Infinity;
  }

  add(item: T): this {
    this.queue.push(item);
    if (this.queue.length >= this.maxSize) {
      this.flush();
    } else {
      if (this.leading && !this.timer) {
        this.flush();
      }
      if (this.trailing) {
        this.schedule();
      }
    }
    return this;
  }

  private schedule(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, this.wait);
  }

  flush(): T[] {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const items = [...this.queue];
    this.queue = [];
    if (items.length > 0) {
      this.processor(items);
    }
    return items;
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue = [];
  }
}

export class ThrottledBatch<T> {
  private queue: T[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private processor: (items: T[]) => void;
  private interval: number;

  constructor(processor: (items: T[]) => void, interval: number = 100) {
    this.processor = processor;
    this.interval = interval;
  }

  add(item: T): this {
    this.queue.push(item);
    if (!this.timer) {
      this.start();
    }
    return this;
  }

  private start(): void {
    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        const items = [...this.queue];
        this.queue = [];
        this.processor(items);
      }
    }, this.interval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  flush(): T[] {
    const items = [...this.queue];
    this.queue = [];
    if (items.length > 0) {
      this.processor(items);
    }
    return items;
  }
}
