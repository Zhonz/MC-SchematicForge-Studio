export interface WebWorkerMessage<T = unknown> {
  type: string;
  payload?: T;
  id?: string;
}

export interface WorkerPoolOptions {
  size?: number;
  taskTimeout?: number;
}

export class WorkerPoolManager {
  private workers: Worker[] = [];
  private taskQueue: Array<{ task: () => unknown; resolve: (value: unknown) => void; reject: (error: Error) => void }> = [];
  private activeWorkers = 0;
  private options: Required<WorkerPoolOptions>;

  constructor(options: WorkerPoolOptions = {}) {
    this.options = {
      size: options.size ?? navigator.hardwareConcurrency ?? 4,
      taskTimeout: options.taskTimeout ?? 30000,
    };
  }

  async execute<T>(task: () => T | Promise<T>, workerUrl?: string): Promise<T> {
    if (this.activeWorkers >= this.options.size) {
      return new Promise((resolve, reject) => {
        this.taskQueue.push({
          task: task as () => unknown,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    }

    this.activeWorkers++;

    try {
      if (workerUrl) {
        return await this.executeInWorker<T>(task, workerUrl);
      } else {
        return await Promise.race([
          Promise.resolve(task()),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Task timeout')), this.options.taskTimeout)
          ),
        ]);
      }
    } finally {
      this.activeWorkers--;
      this.processNextTask();
    }
  }

  private async executeInWorker<T>(task: () => unknown, workerUrl: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerUrl);
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, this.options.taskTimeout);

      worker.onmessage = (event: MessageEvent<WebWorkerMessage<T>>) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(event.data.payload as T);
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      };

      worker.postMessage({ type: 'task', payload: task });
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length > 0 && this.activeWorkers < this.options.size) {
      const { task, resolve, reject } = this.taskQueue.shift()!;
      this.execute(task as () => Promise<unknown>).then(resolve).catch(reject);
    }
  }

  terminate(): void {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.taskQueue = [];
  }

  getStats(): { activeWorkers: number; queueLength: number; maxSize: number } {
    return {
      activeWorkers: this.activeWorkers,
      queueLength: this.taskQueue.length,
      maxSize: this.options.size,
    };
  }
}

export const workerPoolManager = new WorkerPoolManager();

export function createMessageChannel(): MessageChannel {
  return new MessageChannel();
}

export function postMessage(port: MessagePort, message: WebWorkerMessage): void {
  port.postMessage(message);
}

export function onMessage(port: MessagePort, handler: (message: WebWorkerMessage) => void): () => void {
  const listener = (event: MessageEvent<WebWorkerMessage>) => handler(event.data);
  port.addEventListener('message', listener);
  port.start();
  return () => port.removeEventListener('message', listener);
}
