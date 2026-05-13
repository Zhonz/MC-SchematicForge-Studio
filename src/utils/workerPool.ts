export interface WorkerMessage<T = unknown> {
  type: string;
  data: T;
  id?: string;
  timestamp: number;
  error?: string;
}

export interface WorkerOptions {
  name?: string;
  onMessage?: (message: WorkerMessage) => void;
  onError?: (error: Error) => void;
  onTerminate?: () => void;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface TaskResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  private activeWorkers = 0;
  private poolSize: number;
  private options: Required<WorkerOptions>;

  constructor(poolSize: number, options: WorkerOptions = {}) {
    this.poolSize = poolSize;
    this.options = {
      name: options.name || 'pool',
      onMessage: options.onMessage || (() => {}),
      onError: options.onError || (() => {}),
      onTerminate: options.onTerminate || (() => {}),
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 0,
      retryDelay: options.retryDelay || 1000,
    };
  }

  async execute<T>(task: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error as Error);
        }
      };

      this.taskQueue.push({ task: wrappedTask, resolve: resolve as (value: unknown) => void, reject });
      this.taskQueue.sort((a, b) => priority);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeWorkers >= this.poolSize || this.taskQueue.length === 0) {
      return;
    }

    this.activeWorkers++;
    const { task } = this.taskQueue.shift()!;

    task().finally(() => {
      this.activeWorkers--;
      this.processQueue();
    });
  }

  getQueueSize(): number {
    return this.taskQueue.length;
  }

  getActiveWorkers(): number {
    return this.activeWorkers;
  }

  clear(): void {
    this.taskQueue = [];
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.clear();
    this.options.onTerminate();
  }
}

export class TaskScheduler {
  private tasks: Map<string, {
    fn: () => Promise<unknown>;
    schedule: string;
    interval?: number;
    timeout?: ReturnType<typeof setTimeout>;
    running: boolean;
    lastRun?: number;
    nextRun?: number;
  }> = new Map();
  private executing = new Set<string>();

  schedule(id: string, fn: () => Promise<unknown>, interval: number): void {
    const schedule = `every ${interval}ms`;
    
    const runTask = async () => {
      if (this.executing.has(id)) return;
      
      const task = this.tasks.get(id);
      if (!task || !task.running) return;

      this.executing.add(id);
      task.lastRun = Date.now();
      
      try {
        await fn();
      } catch (error) {
        console.error(`Task ${id} failed:`, error);
      } finally {
        this.executing.delete(id);
      }

      if (task.running) {
        task.timeout = setTimeout(runTask, interval);
        task.nextRun = Date.now() + interval;
      }
    };

    this.tasks.set(id, {
      fn,
      schedule,
      interval,
      running: true,
      timeout: setTimeout(runTask, interval),
      nextRun: Date.now() + interval,
    });
  }

  scheduleOnce(id: string, fn: () => Promise<unknown>, delay: number): void {
    this.tasks.set(id, {
      fn,
      schedule: `once after ${delay}ms`,
      running: true,
      timeout: setTimeout(async () => {
        try {
          await fn();
        } catch (error) {
          console.error(`One-time task ${id} failed:`, error);
        } finally {
          this.tasks.delete(id);
        }
      }, delay),
    });
  }

  cancel(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    if (task.timeout) clearTimeout(task.timeout);
    task.running = false;
    this.tasks.delete(id);
    return true;
  }

  pause(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    if (task.timeout) clearTimeout(task.timeout);
    return true;
  }

  resume(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || !task.interval) return false;
    
    task.timeout = setTimeout(async () => {
      try {
        await task.fn();
      } catch (error) {
        console.error(`Task ${id} failed:`, error);
      }
      
      if (task.running && task.interval) {
        task.timeout = setTimeout(() => this.resume(id), task.interval!);
      }
    }, task.interval);
    
    return true;
  }

  isRunning(id: string): boolean {
    const task = this.tasks.get(id);
    return task?.running ?? false;
  }

  getStatus(id: string): { running: boolean; lastRun?: number; nextRun?: number } | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    return {
      running: task.running,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
    };
  }

  getAllTasks(): string[] {
    return Array.from(this.tasks.keys());
  }

  clear(): void {
    for (const task of this.tasks.values()) {
      if (task.timeout) clearTimeout(task.timeout);
    }
    this.tasks.clear();
    this.executing.clear();
  }
}

export class Deferred<T = unknown> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: Error) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: Error) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onfinally);
  }

  isPending(): boolean {
    return this.promise.then(() => false, () => false) as unknown as boolean;
  }
}

export class Semaphore {
  private permits: number;
  private maxPermits: number;
  private queue: Array<() => void> = [];

  constructor(maxPermits: number) {
    this.permits = maxPermits;
    this.maxPermits = maxPermits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.permits--;
        resolve();
      });
    });
  }

  release(): void {
    if (this.permits >= this.maxPermits) return;
    
    this.permits++;
    const next = this.queue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }

  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  getAvailablePermits(): number {
    return this.permits;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async withPermit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

export class Lock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.locked = true;
        resolve();
      });
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next!();
    } else {
      this.locked = false;
    }
  }

  tryAcquire(): boolean {
    if (!this.locked) {
      this.locked = true;
      return true;
    }
    return false;
  }

  isLocked(): boolean {
    return this.locked;
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
