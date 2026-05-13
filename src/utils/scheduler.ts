export interface ScheduledTask {
  id: string;
  name: string;
  callback: () => void;
  interval: number;
  timeout?: ReturnType<typeof setTimeout>;
  running: boolean;
}

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private counter = 0;

  schedule(name: string, callback: () => void, intervalMs: number): string {
    const id = `task_${++this.counter}_${Date.now()}`;
    const task: ScheduledTask = {
      id,
      name,
      callback,
      interval: intervalMs,
      running: true
    };

    const run = () => {
      if (task.running) {
        task.callback();
        task.timeout = setTimeout(run, intervalMs);
      }
    };

    task.timeout = setTimeout(run, intervalMs);
    this.tasks.set(id, task);
    return id;
  }

  cancel(id: string): boolean {
    const task = this.tasks.get(id);
    if (task) {
      task.running = false;
      if (task.timeout) {
        clearTimeout(task.timeout);
      }
      this.tasks.delete(id);
      return true;
    }
    return false;
  }

  pause(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && task.running) {
      task.running = false;
      if (task.timeout) {
        clearTimeout(task.timeout);
        task.timeout = undefined;
      }
      return true;
    }
    return false;
  }

  resume(id: string): boolean {
    const task = this.tasks.get(id);
    if (task && !task.running) {
      task.running = true;
      const run = () => {
        if (task.running) {
          task.callback();
          task.timeout = setTimeout(run, task.interval);
        }
      };
      task.timeout = setTimeout(run, task.interval);
      return true;
    }
    return false;
  }

  getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  cancelAll(): void {
    for (const task of this.tasks.values()) {
      this.cancel(task.id);
    }
  }
}

export class PriorityScheduler {
  private queue: Array<{
    priority: number;
    task: () => void;
  }> = [];
  private running = false;
  private processing = false;

  add(priority: number, task: () => void): void {
    this.queue.push({ priority, task });
    this.queue.sort((a, b) => b.priority - a.priority);
    if (!this.processing) {
      this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.task();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    this.processing = false;
  }
}

export class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private concurrency: number;
  private running = 0;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  async add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task().finally(() => {
          this.running--;
          this.process();
        });
      }
    }
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

export class DebouncedScheduler {
  private timeout: ReturnType<typeof setTimeout> | null = null;

  schedule(delay: number, callback: () => void): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      callback();
      this.timeout = null;
    }, delay);
  }

  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export class ThrottledScheduler {
  private lastRun = 0;
  private pending = false;
  private callback: (() => void) | null = null;

  schedule(interval: number, callback: () => void): void {
    const now = Date.now();
    const remaining = interval - (now - this.lastRun);

    if (remaining <= 0) {
      if (this.pending) {
        this.pending = false;
      }
      this.lastRun = now;
      callback();
    } else if (!this.pending) {
      this.pending = true;
      this.callback = callback;
      setTimeout(() => {
        this.pending = false;
        if (this.callback) {
          this.lastRun = Date.now();
          this.callback();
          this.callback = null;
        }
      }, remaining);
    }
  }
}

export class AnimationFrameScheduler {
  private callbacks: Map<string, () => void> = new Map();
  private rafId: number | null = null;

  add(id: string, callback: () => void): void {
    this.callbacks.set(id, callback);
    if (!this.rafId) {
      this.start();
    }
  }

  remove(id: string): void {
    this.callbacks.delete(id);
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    const loop = () => {
      this.callbacks.forEach(cb => cb());
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export class IdleScheduler {
  private callbacks: Array<{
    callback: () => void;
    deadline: IdleDeadline;
  }> = [];
  private scheduled = false;

  schedule(callback: () => void): void {
    this.callbacks.push(callback as unknown as { callback: () => void; deadline: IdleDeadline });
    if (!this.scheduled) {
      this.scheduled = true;
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(this.run, { timeout: 1000 });
      } else {
        setTimeout(this.run, 1);
      }
    }
  }

  private run = (): void => {
    this.scheduled = false;
    while (this.callbacks.length > 0) {
      const item = this.callbacks.shift();
      if (item) {
        item.callback();
      }
    }
  };
}
