export type WorkerMessage<T = unknown> = {
  type: string;
  data: T;
  id?: string;
};

export type WorkerResponse<T = unknown> = {
  type: string;
  data: T;
  error?: string;
  id?: string;
};

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    task: () => void;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  private activeCount = 0;
  private poolSize: number;

  constructor(size: number = 4) {
    this.poolSize = size;
  }

  async addWorker(worker: Worker): Promise<void> {
    if (this.workers.length < this.poolSize) {
      this.workers.push(worker);
    }
  }

  async execute<T, R>(task: () => T, transfer?: Transferable[]): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: task as () => void,
        resolve: resolve as (value: unknown) => void,
        reject
      });
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.activeCount < this.poolSize) {
      const item = this.queue.shift();
      if (item) {
        this.activeCount++;
        try {
          const result = item.task();
          item.resolve(result);
        } catch (error) {
          item.reject(error as Error);
        }
        this.activeCount--;
        this.processQueue();
      }
    }
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
  }

  get size(): number {
    return this.poolSize;
  }

  get active(): number {
    return this.activeCount;
  }

  get pending(): number {
    return this.queue.length;
  }
}

export class MessageChannel {
  private handlers: Map<string, Array<(data: unknown) => void>> = new Map();
  private messageQueue: Array<WorkerMessage> = [];
  private connected = false;

  send(message: WorkerMessage): void {
    if (this.connected) {
      this.dispatch(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  on(type: string, handler: (data: unknown) => void): () => void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);

    return () => {
      const existing = this.handlers.get(type);
      if (existing) {
        const index = existing.indexOf(handler);
        if (index > -1) existing.splice(index, 1);
      }
    };
  }

  private dispatch(message: WorkerMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  connect(): void {
    this.connected = true;
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) this.dispatch(message);
    }
  }

  disconnect(): void {
    this.connected = false;
  }
}

export function createWorkerFromFunction(fn: (data: unknown) => unknown): Worker {
  const code = `
    self.onmessage = function(e) {
      const result = (${fn.toString()})(e.data);
      self.postMessage(result);
    };
  `;
  const blob = new Blob([code], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export async function runInWorker<T, R>(
  worker: Worker,
  task: T,
  timeout?: number
): Promise<R> {
  return new Promise((resolve, reject) => {
    const timer = timeout
      ? setTimeout(() => reject(new Error('Worker timeout')), timeout)
      : null;

    const handler = (e: MessageEvent<R>) => {
      clearTimeout(timer ?? undefined);
      worker.removeEventListener('message', handler);
      resolve(e.data);
    };

    const errorHandler = (e: ErrorEvent) => {
      clearTimeout(timer ?? undefined);
      worker.removeEventListener('error', errorHandler);
      reject(new Error(e.message));
    };

    worker.addEventListener('message', handler);
    worker.addEventListener('error', errorHandler);
    worker.postMessage(task);
  });
}

export class SharedWorkerPool {
  private port: MessagePort | null = null;
  private pending: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private counter = 0;

  connect(port: MessagePort): void {
    this.port = port;
    port.onmessage = (e: MessageEvent) => {
      const { id, data, error } = e.data;
      const pending = this.pending.get(id);
      if (pending) {
        this.pending.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(data);
        }
      }
    };
  }

  send<T>(type: string, data: T): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        reject(new Error('Not connected'));
        return;
      }
      const id = String(++this.counter);
      this.pending.set(id, { resolve, reject });
      this.port.postMessage({ type, data, id });
    });
  }

  disconnect(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
    this.pending.clear();
  }
}
