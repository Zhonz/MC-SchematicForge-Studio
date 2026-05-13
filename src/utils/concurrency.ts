export interface SemaphoreOptions {
  concurrency: number;
}

export class Semaphore {
  private permits: number;
  private maxPermits: number;
  private waitQueue: Array<{ resolve: () => void }> = [];

  constructor(options: SemaphoreOptions) {
    this.maxPermits = options.concurrency;
    this.permits = options.concurrency;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push({ resolve });
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const waiting = this.waitQueue.shift();
      if (waiting) {
        waiting.resolve();
      }
    } else {
      this.permits = Math.min(this.permits + 1, this.maxPermits);
    }
  }

  available(): number {
    return this.permits + this.waitQueue.length;
  }

  queued(): number {
    return this.waitQueue.length;
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

export class Mutex {
  private locked = false;
  private waitQueue: Array<{ resolve: () => void }> = [];

  async lock(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.unlock();
    }
    return new Promise<() => void>((resolve) => {
      this.waitQueue.push({ resolve: () => resolve(() => this.unlock()) });
    });
  }

  unlock(): void {
    if (this.waitQueue.length > 0) {
      const waiting = this.waitQueue.shift();
      if (waiting) waiting.resolve();
    } else {
      this.locked = false;
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.lock();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export class RWLock {
  private readers = 0;
  private writers = 0;
  private readQueue: Array<{ resolve: () => void }> = [];
  private writeQueue: Array<{ resolve: () => void }> = [];

  async read(): Promise<() => void> {
    if (this.writers === 0 && this.readQueue.length === 0) {
      this.readers++;
      return () => this.releaseRead();
    }
    return new Promise<() => void>((resolve) => {
      this.readQueue.push({ resolve: () => resolve(() => this.releaseRead()) });
    });
  }

  async write(): Promise<() => void> {
    if (this.readers === 0 && this.writers === 0) {
      this.writers++;
      return () => this.releaseWrite();
    }
    return new Promise<() => void>((resolve) => {
      this.writeQueue.push({ resolve: () => resolve(() => this.releaseWrite()) });
    });
  }

  private releaseRead(): void {
    this.readers--;
    if (this.readers === 0 && this.writeQueue.length > 0) {
      const waiting = this.writeQueue.shift();
      if (waiting) {
        this.writers++;
        waiting.resolve();
      }
    }
  }

  private releaseWrite(): void {
    this.writers--;
    if (this.writeQueue.length > 0) {
      const waiting = this.writeQueue.shift();
      if (waiting) {
        this.writers++;
        waiting.resolve();
      }
    } else if (this.readQueue.length > 0) {
      while (this.readQueue.length > 0) {
        const waiting = this.readQueue.shift();
        if (waiting) waiting.resolve();
        this.readers++;
      }
    }
  }

  async withReadLock<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.read();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.write();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export class AtomicCounter {
  private value: number;
  private pending: Array<() => void> = [];

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  get(): number {
    return this.value;
  }

  set(newValue: number): number {
    const oldValue = this.value;
    this.value = newValue;
    return oldValue;
  }

  increment(delta: number = 1): number {
    return (this.value += delta);
  }

  decrement(delta: number = 1): number {
    return (this.value -= delta);
  }

  compareAndSet(expected: number, update: number): boolean {
    if (this.value === expected) {
      this.value = update;
      return true;
    }
    return false;
  }

  async getAndIncrement(delta: number = 1): Promise<number> {
    const oldValue = this.value;
    this.value += delta;
    return oldValue;
  }
}
