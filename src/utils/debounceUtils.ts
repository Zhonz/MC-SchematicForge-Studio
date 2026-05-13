export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = {
  (): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} & ((...args: Parameters<T>) => void);

export type ThrottledFunction<T extends (...args: unknown[]) => unknown> = {
  (): void;
  cancel: () => void;
} & ((...args: Parameters<T>) => void);

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export class DebounceUtils {
  private static instance: DebounceUtils;

  static getInstance(): DebounceUtils {
    if (!DebounceUtils.instance) {
      DebounceUtils.instance = new DebounceUtils();
    }
    return DebounceUtils.instance;
  }

  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    options?: DebounceOptions
  ): DebouncedFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime: number | null = null;
    let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const leading = options?.leading ?? false;
    const trailing = options?.trailing ?? true;
    const maxWait = options?.maxWait;
    
    const invokeFunc = () => {
      if (lastArgs !== null) {
        func(...lastArgs);
        lastArgs = null;
        lastCallTime = null;
      }
    };
    
    const debounced = (...args: Parameters<T>) => {
      lastArgs = args;
      const now = Date.now();
      
      if (timeoutId === null && leading && !lastCallTime) {
        lastCallTime = now;
        func(...args);
      }
      
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing && lastArgs !== null) {
          invokeFunc();
        }
        lastCallTime = null;
      }, wait);
      
      if (maxWait !== undefined && maxWait > 0) {
        if (maxTimeoutId !== null) {
          clearTimeout(maxTimeoutId);
        }
        
        const timeSinceLastCall = lastCallTime ? now - lastCallTime : 0;
        
        if (timeSinceLastCall >= maxWait) {
          invokeFunc();
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        } else {
          maxTimeoutId = setTimeout(() => {
            maxTimeoutId = null;
            invokeFunc();
          }, maxWait - timeSinceLastCall);
        }
      }
      
      lastCallTime = now;
    };
    
    debounced.cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (maxTimeoutId !== null) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }
      lastArgs = null;
      lastCallTime = null;
    };
    
    debounced.flush = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
        invokeFunc();
      }
    };
    
    debounced.pending = () => {
      return timeoutId !== null;
    };
    
    return debounced as DebouncedFunction<T>;
  }

  static debounceLeading<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): DebouncedFunction<T> {
    return DebounceUtils.debounce(func, wait, { leading: true, trailing: false });
  }

  static debounceTrailing<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): DebouncedFunction<T> {
    return DebounceUtils.debounce(func, wait, { leading: false, trailing: true });
  }

  static debounceLeadingTrailing<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): DebouncedFunction<T> {
    return DebounceUtils.debounce(func, wait, { leading: true, trailing: true });
  }
}

export class ThrottleUtils {
  private static instance: ThrottleUtils;

  static getInstance(): ThrottleUtils {
    if (!ThrottleUtils.instance) {
      ThrottleUtils.instance = new ThrottleUtils();
    }
    return ThrottleUtils.instance;
  }

  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
    options?: ThrottleOptions
  ): ThrottledFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime: number = 0;
    let lastInvokeTime: number = 0;
    
    const leading = options?.leading ?? true;
    const trailing = options?.trailing ?? true;
    
    const invokeFunc = () => {
      if (lastArgs !== null) {
        func(...lastArgs);
        lastInvokeTime = Date.now();
        lastArgs = null;
      }
    };
    
    const throttled = (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastInvoke = now - lastInvokeTime;
      
      lastArgs = args;
      
      if (timeSinceLastInvoke >= wait) {
        if (leading) {
          func(...args);
          lastInvokeTime = now;
        } else if (trailing) {
          if (timeoutId === null) {
            timeoutId = setTimeout(() => {
              timeoutId = null;
              if (lastArgs !== null && Date.now() - lastInvokeTime >= wait) {
                invokeFunc();
              }
            }, wait);
          }
        }
      } else {
        if (timeoutId === null && trailing) {
          timeoutId = setTimeout(() => {
            timeoutId = null;
            if (lastArgs !== null) {
              invokeFunc();
            }
          }, wait - timeSinceLastInvoke);
        }
      }
      
      lastCallTime = now;
    };
    
    throttled.cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastArgs = null;
      lastCallTime = 0;
      lastInvokeTime = 0;
    };
    
    return throttled as ThrottledFunction<T>;
  }

  static throttleLeading<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ThrottledFunction<T> {
    return ThrottleUtils.throttle(func, wait, { leading: true, trailing: false });
  }

  static throttleTrailing<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ThrottledFunction<T> {
    return ThrottleUtils.throttle(func, wait, { leading: false, trailing: true });
  }

  static throttleLeadingTrailing<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ThrottledFunction<T> {
    return ThrottleUtils.throttle(func, wait, { leading: true, trailing: true });
  }
}

export class RAFThrottle {
  private static instance: RAFThrottle;

  static getInstance(): RAFThrottle {
    if (!RAFThrottle.instance) {
      RAFThrottle.instance = new RAFThrottle();
    }
    return RAFThrottle.instance;
  }

  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T
  ): T & { cancel: () => void } {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;
    
    const throttled = (...args: Parameters<T>) => {
      lastArgs = args;
      
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (lastArgs !== null) {
            func(...lastArgs);
            lastArgs = null;
          }
        });
      }
    };
    
    throttled.cancel = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastArgs = null;
    };
    
    return throttled as T & { cancel: () => void };
  }

  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait = 16
  ): T & { cancel: () => void } {
    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    
    const throttled = (...args: Parameters<T>) => {
      lastArgs = args;
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = setTimeout(() => {
        rafId = null;
        if (lastArgs !== null) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, wait) as unknown as number;
    };
    
    throttled.cancel = () => {
      if (rafId !== null) {
        clearTimeout(rafId as unknown as ReturnType<typeof setTimeout>);
        rafId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastArgs = null;
    };
    
    return throttled as T & { cancel: () => void };
  }
}

export class IntervalThrottle {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastCallTime: number = 0;
  private callback: () => void;
  private interval: number;
  private isRunning: boolean = false;

  constructor(callback: () => void, interval: number) {
    this.callback = callback;
    this.interval = interval;
  }

  call(): void {
    const now = Date.now();
    
    if (now - this.lastCallTime >= this.interval) {
      this.lastCallTime = now;
      this.callback();
      return;
    }
    
    if (this.timeoutId === null && !this.isRunning) {
      this.isRunning = true;
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.isRunning = false;
        this.lastCallTime = Date.now();
        this.callback();
      }, this.interval - (now - this.lastCallTime));
    }
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isRunning = false;
  }

  reset(): void {
    this.cancel();
    this.lastCallTime = 0;
  }
}

export class DelayedCall {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private callback: () => void;
  private delay: number;
  private cancelled: boolean = false;

  constructor(callback: () => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
  }

  execute(): void {
    if (this.cancelled) return;
    
    this.timeoutId = setTimeout(() => {
      if (!this.cancelled) {
        this.callback();
      }
    }, this.delay);
  }

  cancel(): void {
    this.cancelled = true;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isPending(): boolean {
    return this.timeoutId !== null && !this.cancelled;
  }

  reschedule(newDelay: number): void {
    this.cancel();
    this.cancelled = false;
    this.delay = newDelay;
    this.execute();
  }
}

export class Once {
  private called: boolean = false;
  private result: unknown;

  run<T>(fn: () => T): T | undefined {
    if (this.called) {
      return this.result as T;
    }
    
    this.called = true;
    this.result = fn();
    return this.result as T;
  }

  reset(): void {
    this.called = false;
    this.result = undefined;
  }

  isCalled(): boolean {
    return this.called;
  }
}

export class Memoize<T extends (...args: unknown[]) => unknown> {
  private cache: Map<string, ReturnType<T>> = new Map();
  private func: T;
  private resolver?: (...args: Parameters<T>) => string;

  constructor(func: T, resolver?: (...args: Parameters<T>) => string) {
    this.func = func;
    this.resolver = resolver;
  }

  execute(...args: Parameters<T>): ReturnType<T> {
    const key = this.resolver ? this.resolver(...args) : JSON.stringify(args);
    
    if (this.cache.has(key)) {
      return this.cache.get(key) as ReturnType<T>;
    }
    
    const result = this.func(...args) as ReturnType<T>;
    this.cache.set(key, result);
    return result;
  }

  has(...args: Parameters<T>): boolean {
    const key = this.resolver ? this.resolver(...args) : JSON.stringify(args);
    return this.cache.has(key);
  }

  delete(...args: Parameters<T>): boolean {
    const key = this.resolver ? this.resolver(...args) : JSON.stringify(args);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getCache(): Map<string, ReturnType<T>> {
    return new Map(this.cache);
  }
}

export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export class TimedCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number) {
    this.defaultTTL = defaultTTL;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

export class EventThrottle {
  private handlers: Map<string, {
    handler: (...args: unknown[]) => void;
    lastCall: number;
    interval: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
  }> = new Map();

  register(event: string, handler: (...args: unknown[]) => void, interval: number): void {
    this.handlers.set(event, {
      handler,
      lastCall: 0,
      interval,
      timeoutId: null,
    });
  }

  trigger(event: string, ...args: unknown[]): void {
    const entry = this.handlers.get(event);
    
    if (!entry) {
      return;
    }
    
    const now = Date.now();
    
    if (now - entry.lastCall >= entry.interval) {
      entry.lastCall = now;
      entry.handler(...args);
    } else if (entry.timeoutId === null) {
      entry.timeoutId = setTimeout(() => {
        entry.timeoutId = null;
        entry.lastCall = Date.now();
        entry.handler(...args);
      }, entry.interval - (now - entry.lastCall));
    }
  }

  unregister(event: string): void {
    const entry = this.handlers.get(event);
    
    if (entry && entry.timeoutId !== null) {
      clearTimeout(entry.timeoutId);
    }
    
    this.handlers.delete(event);
  }

  clear(): void {
    for (const entry of this.handlers.values()) {
      if (entry.timeoutId !== null) {
        clearTimeout(entry.timeoutId);
      }
    }
    
    this.handlers.clear();
  }
}

export class BatchDebounce {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private batch: unknown[] = [];
  private callback: (batch: unknown[]) => void;
  private wait: number;

  constructor(callback: (batch: unknown[]) => void, wait: number) {
    this.callback = callback;
    this.wait = wait;
  }

  add(item: unknown): void {
    this.batch.push(item);
    
    if (this.timeoutId === null) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        const batch = [...this.batch];
        this.batch = [];
        this.callback(batch);
      }, this.wait);
    }
  }

  flush(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.batch.length > 0) {
      const batch = [...this.batch];
      this.batch = [];
      this.callback(batch);
    }
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    this.batch = [];
  }

  get pending(): number {
    return this.batch.length;
  }
}

export function compose<T extends (...args: unknown[]) => unknown>(
  ...fns: T[]
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    return fns.reduceRight((acc: unknown[], fn) => [fn(...acc)], args)[0];
  };
}

export function pipe<T extends (...args: unknown[]) => unknown>(
  ...fns: T[]
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    return fns.reduce((acc: unknown[], fn) => [fn(...acc)], args)[0];
  };
}

export function partial<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...initialArgs: unknown[]
): (...rest: unknown[]) => unknown {
  return (...rest: unknown[]) => fn(...initialArgs, ...rest);
}

export function curry<T extends (...args: unknown[]) => unknown>(
  fn: T,
  arity = fn.length
): T {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs: unknown[]) => curried(...args, ...nextArgs);
  } as T;
}

export default { DebounceUtils, ThrottleUtils, RAFThrottle };
