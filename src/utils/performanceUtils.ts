export interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  frameCount: number;
}

export interface TimedOperation {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class PerformanceMonitor {
  private fps = 0;
  private frameCount = 0;
  private lastTime = performance.now();
  private frameTimes: number[] = [];
  private maxFrameTimes = 60;
  private operations: Map<string, number> = new Map();
  private marks: Map<string, number> = new Map();

  startFrame(): void {
    this.frameCount++;
  }

  endFrame(): void {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frameTimes.push(delta);
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }

    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = Math.round(1000 / avgDelta);
  }

  getFPS(): number {
    return this.fps;
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      memory: this.getMemory(),
      renderTime: this.getAverageFrameTime(),
      frameCount: this.frameCount
    };
  }

  private getMemory(): number {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
    return memory?.usedJSHeapSize ?? 0;
  }

  private getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  startOperation(name: string): void {
    this.operations.set(name, performance.now());
  }

  endOperation(name: string): number | undefined {
    const start = this.operations.get(name);
    if (start !== undefined) {
      const duration = performance.now() - start;
      this.operations.delete(name);
      return duration;
    }
    return undefined;
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number | undefined {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (start !== undefined && end !== undefined) {
      return end - start;
    }
    return undefined;
  }

  getMemoryUsage(): { used: number; total: number; limit: number } {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number; totalJSHeapSize?: number } }).memory;
    return {
      used: memory?.usedJSHeapSize ?? 0,
      total: memory?.totalJSHeapSize ?? 0,
      limit: memory?.jsHeapSizeLimit ?? 0
    };
  }
}

export function measure<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  return result;
}

export async function measureAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  return result;
}

export function createFrameCallback(callback: (deltaTime: number) => void): () => void {
  let lastTime = performance.now();
  let rafId: number | null = null;

  const loop = () => {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    callback(delta);
    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

export class FrameRateController {
  private targetFPS: number;
  private frameInterval: number;
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private running = false;

  constructor(targetFPS: number) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  start(callback: () => void): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();

    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;

      if (elapsed >= this.frameInterval) {
        this.lastFrameTime = now - (elapsed % this.frameInterval);
        callback();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

export function throttleRAF<T extends (...args: unknown[]) => void>(fn: T): T {
  let scheduled = false;
  let lastArgs: unknown[];

  const throttled = ((...args: unknown[]) => {
    lastArgs = args;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        fn(...lastArgs);
        scheduled = false;
      });
    }
  }) as T;

  return throttled;
}

export class PerformanceObserver {
  private entries: PerformanceEntry[] = [];

  observe(type: string): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const ctor = PerformanceObserver as unknown as {
          new(callback: (entries: { getEntries: () => PerformanceEntry[] }) => void): unknown;
        };
        const observer = new ctor((list: { getEntries: () => PerformanceEntry[] }) => {
          for (const entry of list.getEntries()) {
            this.entries.push(entry);
          }
        });
        (observer as { observe: (options: { type: string }) => void }).observe({ type });
      } catch {
        // PerformanceObserver not supported
      }
    }
  }

  getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}
