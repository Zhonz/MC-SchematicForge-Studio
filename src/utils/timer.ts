export interface TimerOptions {
  immediate?: boolean;
  interval?: boolean;
}

export class Timer {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private remaining = 0;
  private lastStart = 0;
  private duration = 0;
  private callback: (() => void) | null = null;
  private paused = false;

  static delay(ms: number, callback: () => void): Timer {
    return new Timer().start(ms, callback);
  }

  static interval(ms: number, callback: () => void): Timer {
    return new Timer().start(ms, callback, { interval: true });
  }

  static debounce(fn: () => void, ms: number): () => void {
    let timer: Timer | null = null;
    return () => {
      timer?.stop();
      timer = Timer.delay(ms, fn);
    };
  }

  static throttle(fn: () => void, ms: number): () => void {
    let lastCall = 0;
    return () => {
      const now = Date.now();
      if (now - lastCall >= ms) {
        lastCall = now;
        fn();
      }
    };
  }

  start(duration: number, callback: () => void, options: TimerOptions = {}): this {
    this.stop();
    this.duration = duration;
    this.callback = callback;
    this.remaining = duration;
    this.lastStart = Date.now();
    this.paused = false;
    if (options.immediate) {
      callback();
    }
    if (options.interval) {
      this.intervalId = setInterval(callback, duration);
    } else {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        callback();
      }, duration);
    }
    return this;
  }

  stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.callback = null;
  }

  pause(): void {
    if (this.timeoutId === null && this.intervalId === null) return;
    if (this.paused) return;
    this.paused = true;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    } else if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.remaining -= Date.now() - this.lastStart;
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastStart = Date.now();
    if (this.intervalId !== null || !this.callback) return;
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.callback?.();
    }, this.remaining);
  }

  reset(duration?: number): void {
    const dur = duration ?? this.duration;
    if (this.callback) {
      this.start(dur, this.callback, { interval: this.intervalId !== null });
    }
  }

  isRunning(): boolean {
    return this.timeoutId !== null || this.intervalId !== null;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getRemainingTime(): number {
    if (!this.isRunning()) return 0;
    if (this.paused) return this.remaining;
    return Math.max(0, this.remaining - (Date.now() - this.lastStart));
  }
}

export class AnimationFrame {
  private id: number | null = null;
  private callback: ((time: number) => void) | null = null;
  private running = false;

  static request(callback: (time: number) => void): AnimationFrame {
    const frame = new AnimationFrame();
    return frame.start(callback);
  }

  static cancel(id: number): void {
    cancelAnimationFrame(id);
  }

  start(callback: (time: number) => void): this {
    this.stop();
    this.callback = callback;
    this.running = true;
    const loop = (time: number) => {
      if (!this.running || !this.callback) return;
      this.callback(time);
      this.id = requestAnimationFrame(loop);
    };
    this.id = requestAnimationFrame(loop);
    return this;
  }

  stop(): void {
    this.running = false;
    if (this.id !== null) {
      cancelAnimationFrame(this.id);
      this.id = null;
    }
    this.callback = null;
  }

  isRunning(): boolean {
    return this.running;
  }
}

export class FPSCounter {
  private frames = 0;
  private lastTime = Date.now();
  private fps = 0;
  private frameId: number | null = null;
  private callbacks: Set<(fps: number) => void> = new Set();

  start(): this {
    if (this.frameId !== null) return this;
    const tick = () => {
      this.frames++;
      const now = Date.now();
      if (now - this.lastTime >= 1000) {
        this.fps = this.frames;
        this.frames = 0;
        this.lastTime = now;
        this.callbacks.forEach((cb) => cb(this.fps));
      }
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
    return this;
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  getFPS(): number {
    return this.fps;
  }

  onFPSChange(callback: (fps: number) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}
