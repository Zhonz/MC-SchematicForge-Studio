export interface WebWorkerMessage<T = unknown> {
  type: string;
  payload?: T;
  id?: string;
  error?: string;
}

export type WorkerFunction<T = unknown, R = unknown> = (payload: T) => R | Promise<R>;

export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private pending: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private messageHandlers: Map<string, Set<(data: unknown) => void>> = new Map();
  private errorHandlers: Set<(error: Error) => void> = new Set();

  register(name: string, worker: Worker): void {
    this.workers.set(name, worker);

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as WebWorkerMessage;

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)!;
        this.pending.delete(message.id);

        if (message.error) {
          reject(new Error(message.error));
        } else {
          resolve(message.payload);
        }
      }

      if (message.type) {
        const handlers = this.messageHandlers.get(message.type);
        handlers?.forEach(handler => handler(message.payload));
      }
    };

    worker.onerror = (error) => {
      const err = error instanceof Error ? error : new Error('Worker error');
      this.errorHandlers.forEach(handler => handler(err));
    };
  }

  unregister(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  async postMessage<T = unknown, R = unknown>(
    workerName: string,
    type: string,
    payload?: T,
    transfer?: Transferable[]
  ): Promise<R> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker "${workerName}" not found`);
    }

    const id = this.generateId();

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });

      const message: WebWorkerMessage<T> = { type, payload, id };

      if (transfer) {
        worker.postMessage(message, transfer);
      } else {
        worker.postMessage(message);
      }

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Worker message timeout'));
        }
      }, 30000);
    });
  }

  onMessage(type: string, handler: (data: unknown) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  terminateAll(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.pending.clear();
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }

  get workerCount(): number {
    return this.workers.size;
  }

  get pendingCount(): number {
    return this.pending.size;
  }
}

export class FunctionWorker<T = unknown, R = unknown> {
  private worker: Worker;
  private manager: WorkerManager;
  private name: string;

  constructor(fn: WorkerFunction<T, R>, manager?: WorkerManager) {
    this.manager = manager || new WorkerManager();
    this.name = `function-${Date.now()}`;

    const code = `
      self.onmessage = async function(event) {
        const { type, payload, id } = event.data;
        
        if (type === 'execute') {
          try {
            const fn = ${fn.toString()};
            const result = await fn(payload);
            self.postMessage({ type: 'result', payload: result, id });
          } catch (error) {
            self.postMessage({ type: 'error', error: error.message, id });
          }
        }
      };
    `;

    const blob = new Blob([code], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.manager.register(this.name, this.worker);
  }

  async execute(payload: T): Promise<R> {
    return this.manager.postMessage<T, R>(this.name, 'execute', payload);
  }

  terminate(): void {
    this.manager.unregister(this.name);
  }
}

export class WorkerPoolManager {
  private pools: Map<string, WorkerPool> = new Map();

  createPool(name: string, size: number, factory: () => Worker): WorkerPool {
    const pool = new WorkerPool(size, factory);
    this.pools.set(name, pool);
    return pool;
  }

  getPool(name: string): WorkerPool | undefined {
    return this.pools.get(name);
  }

  destroyPool(name: string): void {
    const pool = this.pools.get(name);
    if (pool) {
      pool.terminate();
      this.pools.delete(name);
    }
  }

  destroyAll(): void {
    this.pools.forEach(pool => pool.terminate());
    this.pools.clear();
  }

  get poolCount(): number {
    return this.pools.size;
  }
}

export class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private busy: Set<Worker> = new Set();
  private queue: Array<{
    task: (worker: Worker) => void;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(size: number, factory: () => Worker) {
    for (let i = 0; i < size; i++) {
      const worker = factory();
      this.workers.push(worker);
      this.available.push(worker);
    }
  }

  async execute<T>(task: (worker: Worker) => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const work = () => {
        if (this.available.length === 0) {
          this.queue.push({ task, resolve: resolve as () => void, reject });
          return;
        }

        const worker = this.available.pop()!;
        this.busy.add(worker);

        try {
          const result = task(worker);
          if (result instanceof Promise) {
            result
              .then((res: T) => {
                this.releaseWorker(worker);
                resolve(res);
              })
              .catch((err: Error) => {
                this.releaseWorker(worker);
                reject(err);
              });
          } else {
            this.releaseWorker(worker);
            resolve(result);
          }
        } catch (error) {
          this.releaseWorker(worker);
          reject(error as Error);
        }
      };

      work();
    });
  }

  private releaseWorker(worker: Worker): void {
    this.busy.delete(worker);
    this.available.push(worker);

    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next.task(worker);
    }
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.available = [];
    this.busy.clear();
    this.queue = [];
  }

  get size(): number {
    return this.workers.length;
  }

  get availableCount(): number {
    return this.available.length;
  }

  get busyCount(): number {
    return this.busy.size;
  }

  get queueLength(): number {
    return this.queue.length;
  }
}

export interface SharedWorkerMessage {
  type: string;
  port: MessagePort;
  data?: unknown;
}

export class SharedWorkerBridge {
  private port: MessagePort | null = null;
  private handlers: Map<string, Set<(data: unknown) => void>> = new Map();

  connect(sharedWorkerScope: { port: MessagePort }): void {
    this.port = sharedWorkerScope.port;
    if (this.port) {
      this.port.onmessage = (event: MessageEvent) => {
        const message = event.data as SharedWorkerMessage;
        const handlers = this.handlers.get(message.type);
        handlers?.forEach(handler => handler(message.data));
      };
      this.port.start();
    }
  }

  send(type: string, data?: unknown): void {
    if (this.port) {
      this.port.postMessage({ type, data });
    }
  }

  on(type: string, handler: (data: unknown) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  disconnect(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
}

export function createWorkerFromFunction<T, R>(fn: WorkerFunction<T, R>): Worker {
  const code = `
    self.onmessage = async function(event) {
      const { type, payload, id } = event.data;
      
      if (type === 'execute') {
        try {
          const fn = ${fn.toString()};
          const result = await fn(payload);
          self.postMessage({ type: 'result', payload: result, id });
        } catch (error) {
          self.postMessage({ type: 'error', error: error.message, id });
        }
      }
    };
  `;

  const blob = new Blob([code], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export function terminateWorker(worker: Worker | undefined): void {
  if (worker) {
    worker.terminate();
  }
}
