export type TimerCallback = (...args: unknown[]) => void;

export interface TimerOptions {
  immediate?: boolean;
  recurring?: boolean;
  interval?: number;
  onError?: (error: Error) => void;
}

export interface StopwatchData {
  elapsed: number;
  isRunning: boolean;
  startTime: number;
  lapTimes: number[];
}

export interface CountdownData {
  remaining: number;
  isRunning: boolean;
  isComplete: boolean;
}

export interface ScheduleTask {
  id: string;
  callback: TimerCallback;
  scheduledTime: number;
  interval?: number;
  recurring?: boolean;
}

export class TimingUtils {
  private static instance: TimingUtils;
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private rafIds: Map<string, number> = new Map();
  private callbacks: Map<string, TimerCallback[]> = new Map();

  static getInstance(): TimingUtils {
    if (!TimingUtils.instance) {
      TimingUtils.instance = new TimingUtils();
    }
    return TimingUtils.instance;
  }

  static delay(callback: TimerCallback, ms: number): () => void {
    const id = setTimeout(callback, ms);
    
    TimingUtils.instance.timers.set(`delay_${id}`, id);
    
    return () => {
      clearTimeout(id);
      TimingUtils.instance.timers.delete(`delay_${id}`);
    };
  }

  static defer(callback: TimerCallback): () => void {
    return TimingUtils.delay(callback, 0);
  }

  static immediate(callback: TimerCallback): () => void {
    if (typeof requestAnimationFrame !== 'undefined') {
      let cancelled = false;
      const rafId = requestAnimationFrame(() => {
        if (!cancelled) {
          callback();
        }
      });
      
      TimingUtils.instance.rafIds.set(`immediate_${rafId}`, rafId);
      
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        TimingUtils.instance.rafIds.delete(`immediate_${rafId}`);
      };
    }
    
    return TimingUtils.delay(callback, 0);
  }

  static interval(callback: TimerCallback, ms: number, immediate = false): () => void {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (immediate) {
      callback();
      intervalId = setInterval(callback, ms);
    } else {
      intervalId = setInterval(callback, ms);
    }
    
    TimingUtils.instance.intervals.set(`interval_${intervalId}`, intervalId);
    
    return () => {
      clearInterval(intervalId);
      TimingUtils.instance.intervals.delete(`interval_${intervalId}`);
    };
  }

  static throttle<T extends TimerCallback>(
    callback: T,
    ms: number
  ): T & { cancel: () => void } {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: unknown[] = [];
    
    const throttled = (...args: unknown[]) => {
      const now = performance.now();
      lastArgs = args;
      
      if (now - lastCall >= ms) {
        lastCall = now;
        callback(...args);
      } else {
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            lastCall = performance.now();
            callback(...lastArgs);
            timeoutId = null;
          }, ms - (now - lastCall));
        }
      }
    };
    
    throttled.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastArgs = [];
    };
    
    return throttled as T & { cancel: () => void };
  }

  static debounce<T extends TimerCallback>(
    callback: T,
    ms: number,
    immediate = false
  ): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const debounced = (...args: unknown[]) => {
      const callNow = immediate && !timeoutId;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!immediate) {
          callback(...args);
        }
      }, ms);
      
      if (callNow) {
        callback(...args);
      }
    };
    
    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return debounced as T & { cancel: () => void };
  }

  static rafThrottle<T extends TimerCallback>(callback: T): T {
    let rafId: number | null = null;
    let lastArgs: unknown[] = [];
    
    const throttled = (...args: unknown[]) => {
      lastArgs = args;
      
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          callback(...lastArgs);
          rafId = null;
        });
      }
    };
    
    return throttled as T;
  }

  static rafDebounce<T extends TimerCallback>(callback: T, ms = 16): T {
    let rafId: number | null = null;
    let lastArgs: unknown[] = [];
    
    const debounced = (...args: unknown[]) => {
      lastArgs = args;
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = setTimeout(() => {
        callback(...lastArgs);
        rafId = null;
      }, ms) as unknown as number;
    };
    
    return debounced as T;
  }

  static schedule(
    callback: TimerCallback,
    delay: number,
    interval?: number
  ): () => void {
    const taskId = `schedule_${Date.now()}`;
    let currentTimeoutId: ReturnType<typeof setTimeout>;
    
    const run = () => {
      callback();
      
      if (interval !== undefined) {
        currentTimeoutId = setTimeout(run, interval);
        TimingUtils.instance.timers.set(taskId, currentTimeoutId);
      }
    };
    
    currentTimeoutId = setTimeout(run, delay);
    TimingUtils.instance.timers.set(taskId, currentTimeoutId);
    
    return () => {
      clearTimeout(currentTimeoutId);
      TimingUtils.instance.timers.delete(taskId);
    };
  }

  static cancelAll(): void {
    TimingUtils.instance.timers.forEach((timer) => clearTimeout(timer));
    TimingUtils.instance.timers.clear();
    
    TimingUtils.instance.intervals.forEach((interval) => clearInterval(interval));
    TimingUtils.instance.intervals.clear();
    
    TimingUtils.instance.rafIds.forEach((rafId) => cancelAnimationFrame(rafId));
    TimingUtils.instance.rafIds.clear();
  }

  static getCallbacks(event: string): TimerCallback[] {
    return TimingUtils.instance.callbacks.get(event) || [];
  }

  static addCallback(event: string, callback: TimerCallback): void {
    const callbacks = TimingUtils.instance.callbacks.get(event) || [];
    callbacks.push(callback);
    TimingUtils.instance.callbacks.set(event, callbacks);
  }

  static removeCallback(event: string, callback: TimerCallback): void {
    const callbacks = TimingUtils.instance.callbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      TimingUtils.instance.callbacks.set(event, callbacks);
    }
  }
}

export class Stopwatch {
  private startTime: number = 0;
  private elapsed: number = 0;
  private isRunning: boolean = false;
  private lapTimes: number[] = [];
  private rafId: number | null = null;
  private onUpdate?: (elapsed: number) => void;

  constructor(onUpdate?: (elapsed: number) => void) {
    this.onUpdate = onUpdate;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsed;
    
    if (this.onUpdate) {
      const tick = () => {
        if (!this.isRunning) return;
        this.elapsed = performance.now() - this.startTime;
        this.onUpdate!(this.elapsed);
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.elapsed = performance.now() - this.startTime;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset(): void {
    this.stop();
    this.elapsed = 0;
    this.lapTimes = [];
  }

  lap(): number {
    if (!this.isRunning) {
      return this.elapsed;
    }
    
    const currentTime = performance.now();
    const lapTime = currentTime - this.startTime - this.lapTimes.reduce((a, b) => a + b, 0);
    this.lapTimes.push(lapTime);
    return lapTime;
  }

  getElapsed(): number {
    if (this.isRunning) {
      return performance.now() - this.startTime;
    }
    return this.elapsed;
  }

  getLapTimes(): number[] {
    return [...this.lapTimes];
  }

  getData(): StopwatchData {
    return {
      elapsed: this.getElapsed(),
      isRunning: this.isRunning,
      startTime: this.startTime,
      lapTimes: this.getLapTimes(),
    };
  }

  format(format?: string): string {
    const ms = Math.floor(this.getElapsed());
    return Stopwatch.formatTime(ms, format);
  }

  static formatTime(ms: number, format = 'HH:MM:SS.mm'): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor(ms % 1000);
    
    let result = format;
    result = result.replace('HH', String(hours).padStart(2, '0'));
    result = result.replace('MM', String(minutes).padStart(2, '0'));
    result = result.replace('SS', String(seconds).padStart(2, '0'));
    result = result.replace('mm', String(milliseconds).padStart(3, '0'));
    result = result.replace('ss', String(seconds).padStart(2, '0'));
    result = result.replace('ms', String(milliseconds).padStart(3, '0'));
    
    return result;
  }
}

export class Countdown {
  private duration: number;
  private remaining: number = 0;
  private isRunning: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick?: (remaining: number) => void;
  private onComplete?: () => void;
  private onProgress?: (progress: number) => void;

  constructor(
    duration: number,
    onTick?: (remaining: number) => void,
    onComplete?: () => void
  ) {
    this.duration = duration;
    this.remaining = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.remaining = this.duration;
    
    this.intervalId = setInterval(() => {
      this.remaining -= 100;
      
      if (this.onProgress) {
        this.onProgress(this.getProgress());
      }
      
      if (this.onTick) {
        this.onTick(this.remaining);
      }
      
      if (this.remaining <= 0) {
        this.complete();
      }
    }, 100);
  }

  pause(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(): void {
    if (this.isRunning) return;
    
    this.start();
  }

  stop(): void {
    this.pause();
    this.remaining = this.duration;
  }

  reset(): void {
    this.stop();
  }

  private complete(): void {
    this.pause();
    this.remaining = 0;
    this.onComplete?.();
  }

  getRemaining(): number {
    return Math.max(0, this.remaining);
  }

  getProgress(): number {
    if (this.duration === 0) return 100;
    return ((this.duration - this.remaining) / this.duration) * 100;
  }

  isComplete(): boolean {
    return this.remaining <= 0;
  }

  setOnProgress(callback: (progress: number) => void): void {
    this.onProgress = callback;
  }

  getData(): CountdownData {
    return {
      remaining: this.getRemaining(),
      isRunning: this.isRunning,
      isComplete: this.isComplete(),
    };
  }

  format(format?: string): string {
    return Stopwatch.formatTime(this.getRemaining(), format || 'MM:SS');
  }
}

export class Timer {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private callback: TimerCallback;
  private duration: number;
  private recurring: boolean;

  constructor(callback: TimerCallback, duration: number, recurring = false) {
    this.callback = callback;
    this.duration = duration;
    this.recurring = recurring;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.recurring) {
      this.intervalId = setInterval(() => {
        this.callback();
      }, this.duration);
    } else {
      this.timeoutId = setTimeout(() => {
        this.callback();
        this.isRunning = false;
      }, this.duration);
    }
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    if (!this.isRunning) {
      this.start();
    }
  }

  reset(): void {
    this.stop();
  }

  restart(): void {
    this.stop();
    this.start();
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getState(): { isRunning: boolean; duration: number; recurring: boolean } {
    return {
      isRunning: this.isRunning,
      duration: this.duration,
      recurring: this.recurring,
    };
  }
}

export class Scheduler {
  private tasks: Map<string, ScheduleTask> = new Map();
  private rafId: number | null = null;
  private isRunning: boolean = false;

  add(
    id: string,
    callback: TimerCallback,
    scheduledTime: number,
    interval?: number
  ): void {
    this.tasks.set(id, {
      id,
      callback,
      scheduledTime,
      interval,
    });
    
    if (!this.isRunning) {
      this.start();
    }
  }

  remove(id: string): void {
    this.tasks.delete(id);
    
    if (this.tasks.size === 0) {
      this.stop();
    }
  }

  clear(): void {
    this.tasks.clear();
    this.stop();
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    
    this.tasks.forEach((task, id) => {
      if (now >= task.scheduledTime) {
        task.callback();
        
        if (task.interval !== undefined && task.recurring) {
          task.scheduledTime = now + task.interval;
        } else {
          this.tasks.delete(id);
        }
      }
    });
    
    if (this.tasks.size === 0) {
      this.stop();
      return;
    }
    
    this.rafId = requestAnimationFrame(this.tick);
  };

  getTasks(): ScheduleTask[] {
    return Array.from(this.tasks.values());
  }

  getTask(id: string): ScheduleTask | undefined {
    return this.tasks.get(id);
  }

  hasTask(id: string): boolean {
    return this.tasks.has(id);
  }
}

export class AnimationFrame {
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private callback: (deltaTime: number) => void;
  private lastTime: number = 0;

  constructor(callback: (deltaTime: number) => void) {
    this.callback = callback;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.callback(deltaTime);
    
    this.rafId = requestAnimationFrame(this.tick);
  };

  isActive(): boolean {
    return this.isRunning;
  }
}

export class TimeBoundedLoop {
  private maxDuration: number;
  private callback: (elapsed: number) => void;
  private onComplete?: () => void;
  private rafId: number | null = null;
  private startTime: number = 0;
  private isRunning: boolean = false;

  constructor(
    maxDuration: number,
    callback: (elapsed: number) => void,
    onComplete?: () => void
  ) {
    this.maxDuration = maxDuration;
    this.callback = callback;
    this.onComplete = onComplete;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;
    
    const elapsed = performance.now() - this.startTime;
    
    if (elapsed >= this.maxDuration) {
      this.callback(this.maxDuration);
      this.stop();
      this.onComplete?.();
      return;
    }
    
    this.callback(elapsed);
    this.rafId = requestAnimationFrame(this.tick);
  };

  isActive(): boolean {
    return this.isRunning;
  }

  getElapsed(): number {
    if (!this.isRunning) return 0;
    return performance.now() - this.startTime;
  }

  getProgress(): number {
    return Math.min(1, this.getElapsed() / this.maxDuration);
  }
}

export default TimingUtils;
