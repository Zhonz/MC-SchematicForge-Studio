export interface PoolOptions<T> {
  maxSize?: number;
  minSize?: number;
  factory: () => T;
  reset?: (obj: T) => void;
  destroy?: (obj: T) => void;
  validate?: (obj: T) => boolean;
}

export interface PoolStats {
  size: number;
  available: number;
  borrowed: number;
  totalCreated: number;
  totalDestroyed: number;
}

export class ObjectPool<T> {
  private available: T[] = [];
  private borrowed: Set<T> = new Set();
  private factory: () => T;
  private reset?: (obj: T) => void;
  private destroy?: (obj: T) => void;
  private validate?: (obj: T) => boolean;
  private maxSize: number;
  private minSize: number;
  private totalCreated = 0;
  private totalDestroyed = 0;

  constructor(options: PoolOptions<T>) {
    this.factory = options.factory;
    this.reset = options.reset;
    this.destroy = options.destroy;
    this.validate = options.validate;
    this.maxSize = options.maxSize ?? Infinity;
    this.minSize = options.minSize ?? 0;

    for (let i = 0; i < this.minSize; i++) {
      this.available.push(this.factory());
      this.totalCreated++;
    }
  }

  acquire(): T {
    let obj: T | undefined;

    while (this.available.length > 0) {
      const candidate = this.available.pop()!;
      
      if (this.validate && !this.validate(candidate)) {
        this.destroyObject(candidate);
        continue;
      }

      obj = candidate;
      break;
    }

    if (!obj) {
      obj = this.factory();
      this.totalCreated++;
    }

    this.borrowed.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.borrowed.has(obj)) {
      return;
    }

    this.borrowed.delete(obj);

    if (this.reset) {
      this.reset(obj);
    }

    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    } else {
      this.destroyObject(obj);
    }
  }

  private destroyObject(obj: T): void {
    this.totalDestroyed++;
    if (this.destroy) {
      this.destroy(obj);
    }
  }

  drain(): void {
    for (const obj of this.available) {
      this.destroyObject(obj);
    }
    this.available = [];
  }

  clear(): void {
    this.drain();
    this.borrowed.clear();
  }

  shrink(targetSize?: number): number {
    const target = targetSize ?? this.minSize;
    let removed = 0;

    while (this.available.length > target) {
      const obj = this.available.pop()!;
      this.destroyObject(obj);
      removed++;
    }

    return removed;
  }

  prewarm(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.available.length);
    
    for (let i = 0; i < toCreate; i++) {
      const obj = this.factory();
      this.available.push(obj);
      this.totalCreated++;
    }
  }

  getStats(): PoolStats {
    return {
      size: this.available.length + this.borrowed.size,
      available: this.available.length,
      borrowed: this.borrowed.size,
      totalCreated: this.totalCreated,
      totalDestroyed: this.totalDestroyed,
    };
  }

  getSize(): number {
    return this.available.length + this.borrowed.size;
  }

  getAvailable(): number {
    return this.available.length;
  }

  getBorrowed(): number {
    return this.borrowed.size;
  }
}

export interface AsyncPoolOptions<T> extends PoolOptions<T> {
  validateAsync?: (obj: T) => Promise<boolean>;
  resetAsync?: (obj: T) => Promise<void>;
}

export class AsyncPool<T> {
  private pool: ObjectPool<T>;
  private pending: Array<{
    resolve: (obj: T) => void;
    reject: (error: Error) => void;
  }> = [];
  private validateAsync?: (obj: T) => Promise<boolean>;
  private resetAsync?: (obj: T) => Promise<void>;

  constructor(options: AsyncPoolOptions<T>) {
    this.pool = new ObjectPool({
      ...options,
      validate: options.validate,
      reset: options.reset,
    });
    this.validateAsync = options.validateAsync;
    this.resetAsync = options.resetAsync;
  }

  async acquire(): Promise<T> {
    if (this.validateAsync) {
      while (this.pool.getAvailable() > 0) {
        const obj = this.pool.acquire();
        if (await this.validateAsync(obj)) {
          return obj;
        }
        this.pool.release(obj);
      }
    }

    return this.pool.acquire();
  }

  async release(obj: T): Promise<void> {
    if (this.resetAsync) {
      await this.resetAsync(obj);
    }
    this.pool.release(obj);
    this.processQueue();
  }

  private processQueue(): void {
    while (this.pending.length > 0 && this.pool.getAvailable() > 0) {
      const { resolve } = this.pending.shift()!;
      resolve(this.pool.acquire());
    }
  }

  drain(): void {
    this.pool.drain();
    this.pending = [];
  }

  clear(): void {
    this.pool.clear();
    this.pending = [];
  }

  getStats(): PoolStats {
    return this.pool.getStats();
  }
}

export function createPool<T>(options: PoolOptions<T>): ObjectPool<T> {
  return new ObjectPool(options);
}

export function createAsyncPool<T>(options: AsyncPoolOptions<T>): AsyncPool<T> {
  return new AsyncPool(options);
}

export class PoolManager {
  private pools: Map<string, ObjectPool<unknown>> = new Map();

  register<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool as ObjectPool<unknown>);
  }

  get<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  unregister(name: string): void {
    const pool = this.pools.get(name);
    if (pool) {
      pool.drain();
      this.pools.delete(name);
    }
  }

  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.drain();
    }
    this.pools.clear();
  }

  getAllStats(): Record<string, PoolStats> {
    const stats: Record<string, PoolStats> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }
}

const defaultPoolManager = new PoolManager();

export function getPoolManager(): PoolManager {
  return defaultPoolManager;
}
