export interface PoolOptions<T> {
  initialSize?: number;
  maxSize?: number;
  factory: () => T;
  reset?: (obj: T) => void;
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly maxSize: number;
  private readonly factory: () => T;
  private readonly reset?: (obj: T) => void;
  private readonly initialSize: number;

  constructor(options: PoolOptions<T>) {
    this.factory = options.factory;
    this.maxSize = options.maxSize ?? Infinity;
    this.initialSize = options.initialSize ?? 0;
    this.reset = options.reset;
    this.prewarm();
  }

  private prewarm(): void {
    for (let i = 0; i < this.initialSize && this.pool.length < this.maxSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }

  get size(): number {
    return this.pool.length;
  }

  get stats(): { available: number; maxSize: number } {
    return {
      available: this.pool.length,
      maxSize: this.maxSize,
    };
  }
}

export class PoolManager {
  private static instance: PoolManager;
  private pools: Map<string, ObjectPool<unknown>> = new Map();

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  register<T>(name: string, options: PoolOptions<T>): ObjectPool<T> {
    if (this.pools.has(name)) {
      return this.pools.get(name) as ObjectPool<T>;
    }
    const pool = new ObjectPool<T>(options);
    this.pools.set(name, pool as ObjectPool<unknown>);
    return pool;
  }

  get<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  release(name: string, obj: unknown): void {
    const pool = this.pools.get(name);
    if (pool) {
      pool.release(obj);
    }
  }

  clear(name?: string): void {
    if (name) {
      const pool = this.pools.get(name);
      if (pool) pool.clear();
    } else {
      this.pools.forEach((pool) => pool.clear());
    }
  }

  getAllStats(): Record<string, { available: number; maxSize: number }> {
    const stats: Record<string, { available: number; maxSize: number }> = {};
    this.pools.forEach((pool, name) => {
      stats[name] = pool.stats;
    });
    return stats;
  }
}
