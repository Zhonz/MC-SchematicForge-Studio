export interface BatchOptions<T> {
  maxSize?: number;
  maxWait?: number;
  onBatch?: (items: T[]) => void;
}

export interface BatchStats {
  totalItems: number;
  totalBatches: number;
  avgBatchSize: number;
  lastBatchSize: number;
}

export class BatchProcessor<T> {
  private items: T[] = [];
  private maxSize: number;
  private maxWait: number;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private onBatch?: (items: T[]) => void;
  private stats: BatchStats = { totalItems: 0, totalBatches: 0, avgBatchSize: 0, lastBatchSize: 0 };

  constructor(options: BatchOptions<T> = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.maxWait = options.maxWait ?? 1000;
    this.onBatch = options.onBatch;
  }

  add(item: T): void {
    this.items.push(item);
    this.stats.totalItems++;

    if (this.items.length >= this.maxSize) {
      this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.maxWait);
    }
  }

  addMany(items: T[]): void {
    for (const item of items) {
      this.add(item);
    }
  }

  flush(): T[] {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const batch = [...this.items];
    this.items = [];
    this.stats.totalBatches++;
    this.stats.lastBatchSize = batch.length;
    this.stats.avgBatchSize = this.stats.totalItems / this.stats.totalBatches;

    if (batch.length > 0) {
      this.onBatch?.(batch);
    }

    return batch;
  }

  getStats(): BatchStats {
    return { ...this.stats };
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.items = [];
  }
}

export class AsyncBatchProcessor<T> {
  private items: T[] = [];
  private maxSize: number;
  private maxWait: number;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private processor: (items: T[]) => Promise<void>;
  private processing = false;
  private flushPromise: Promise<T[]> | null = null;

  constructor(processor: (items: T[]) => Promise<void>, options: BatchOptions<T> = {}) {
    this.processor = processor;
    this.maxSize = options.maxSize ?? 100;
    this.maxWait = options.maxWait ?? 1000;
  }

  async add(item: T): Promise<void> {
    this.items.push(item);

    if (this.items.length >= this.maxSize) {
      await this.flush();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.maxWait);
    }
  }

  async flush(): Promise<T[]> {
    if (this.processing) {
      return this.flushPromise!;
    }

    this.processing = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const batch = [...this.items];
    this.items = [];

    if (batch.length > 0) {
      this.flushPromise = this.processor(batch).then(() => {
        this.processing = false;
        this.flushPromise = null;
        return batch;
      });
      return this.flushPromise;
    }

    this.processing = false;
    return batch;
  }

  size(): number {
    return this.items.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

export async function batchAsync<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { concurrency?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<R[]> {
  const { concurrency = 5, onProgress } = options;
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const promise = processor(item).then((result) => {
      results[i] = result;
      onProgress?.(results.filter(Boolean).length, items.length);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

export function createBatcher<T>(options: BatchOptions<T> = {}): {
  add: (item: T) => void;
  flush: () => T[];
  size: () => number;
} {
  const processor = new BatchProcessor<T>(options);

  return {
    add: (item: T) => processor.add(item),
    flush: () => processor.flush(),
    size: () => processor.size(),
  };
}

export class RequestBatcher<K, V> {
  private cache: Map<K, Promise<V>> = new Map();
  private fetcher: (keys: K[]) => Promise<Map<K, V>>;
  private maxBatchSize: number;
  private batchDelay: number;
  private pendingKeys: Set<K> = new Set();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(fetcher: (keys: K[]) => Promise<Map<K, V>>, maxBatchSize = 100, batchDelay = 50) {
    this.fetcher = fetcher;
    this.maxBatchSize = maxBatchSize;
    this.batchDelay = batchDelay;
  }

  async get(key: K): Promise<V> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.pendingKeys.has(key)) {
      return this.cache.get(key)!;
    }

    this.pendingKeys.add(key);

    const result = new Promise<V>((resolve, reject) => {
      this.cache.set(key, new Promise<V>((res, rej) => {
        this.cache.get(key)!.then(res).catch(rej);
      }) as Promise<V>);

      const executeBatch = async () => {
        const keys = Array.from(this.pendingKeys);
        this.pendingKeys.clear();

        try {
          const results = await this.fetcher(keys);
          for (const [k, v] of results) {
            const pending = this.cache.get(k);
            if (pending) {
              (pending as Promise<V>).then((val) => val);
              this.cache.set(k, Promise.resolve(v));
            }
          }
        } catch (error) {
          for (const k of keys) {
            const pending = this.cache.get(k);
            if (pending) {
              this.cache.delete(k);
            }
          }
        }
      };

      if (this.pendingKeys.size >= this.maxBatchSize) {
        executeBatch();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(executeBatch, this.batchDelay);
      }

      this.cache.get(key)!.then(resolve).catch(reject);
    });

    this.cache.set(key, result);
    return result;
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingKeys.clear();
    this.cache.clear();
  }
}
