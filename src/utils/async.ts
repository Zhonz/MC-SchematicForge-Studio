export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export interface AsyncOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

export class Async<T> {
  private state: AsyncState<T> = { status: 'idle' };
  private callbacks: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  };

  constructor(callbacks: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  } = {}) {
    this.callbacks = callbacks;
  }

  static create<T>(
    fn: () => Promise<T>,
    callbacks?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      onFinally?: () => void;
    }
  ): Async<T> {
    const async = new Async<T>(callbacks);
    async.execute(fn);
    return async;
  }

  getState(): AsyncState<T> {
    return this.state;
  }

  isIdle(): boolean {
    return this.state.status === 'idle';
  }

  isLoading(): boolean {
    return this.state.status === 'loading';
  }

  isSuccess(): boolean {
    return this.state.status === 'success';
  }

  isError(): boolean {
    return this.state.status === 'error';
  }

  getData(): T | undefined {
    return this.state.status === 'success' ? this.state.data : undefined;
  }

  getError(): Error | undefined {
    return this.state.status === 'error' ? this.state.error : undefined;
  }

  async execute(fn: () => Promise<T>): Promise<T> {
    this.state = { status: 'loading' };
    try {
      const data = await fn();
      this.state = { status: 'success', data };
      if (this.callbacks.onSuccess) this.callbacks.onSuccess(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.state = { status: 'error', error: err };
      if (this.callbacks.onError) this.callbacks.onError(err);
      throw err;
    } finally {
      if (this.callbacks.onFinally) this.callbacks.onFinally();
    }
  }

  reset(): void {
    this.state = { status: 'idle' };
  }
}

export class AsyncBatch {
  private promises: Promise<unknown>[] = [];
  private results: unknown[] = [];
  private errors: Error[] = [];
  private settled = false;

  add<T>(promise: Promise<T>): Promise<T> {
    const wrapped = promise
      .then((data) => {
        this.results.push(data);
        return data;
      })
      .catch((error) => {
        this.errors.push(error instanceof Error ? error : new Error(String(error)));
        throw error;
      });
    this.promises.push(wrapped);
    return wrapped as Promise<T>;
  }

  async wait(): Promise<unknown[]> {
    await Promise.all(this.promises);
    this.settled = true;
    return this.results;
  }

  getResults<T>(): T[] {
    return this.results as T[];
  }

  getErrors(): Error[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  isSettled(): boolean {
    return this.settled;
  }
}

export class AsyncQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = false;
  private concurrency: number;
  private active = 0;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
  }

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.active >= this.concurrency) return;
    if (this.queue.length === 0) return;
    const fn = this.queue.shift();
    if (!fn) return;
    this.active++;
    try {
      await fn();
    } finally {
      this.active--;
      this.process();
    }
  }

  clear(): void {
    this.queue = [];
  }

  get size(): number {
    return this.queue.length;
  }
}
