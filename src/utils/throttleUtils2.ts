export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void; flush: () => void } {
  const { leading = false, trailing = true } = options || {};
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: unknown[] | undefined;
  let lastThis: unknown;

  const debounced = function(this: unknown, ...args: unknown[]): unknown | undefined {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (leading && !timeoutId) {
      return fn.apply(lastThis, lastArgs);
    }

    timeoutId = setTimeout(() => {
      if (trailing && lastArgs) {
        fn.apply(lastThis, lastArgs);
      }
      timeoutId = undefined;
      lastArgs = undefined;
      lastThis = undefined;
    }, wait);
  } as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      lastArgs = undefined;
      lastThis = undefined;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn.apply(lastThis, lastArgs);
      timeoutId = undefined;
      lastArgs = undefined;
      lastThis = undefined;
    }
  };

  return debounced;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options || {};
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: unknown[] | undefined;
  let lastThis: unknown;

  const throttled = function(this: unknown, ...args: unknown[]): unknown | undefined {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    if (!lastTime && !leading) {
      lastTime = now;
    }

    const remaining = wait - (now - lastTime);

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      lastTime = now;
      if (lastArgs) {
        return fn.apply(lastThis, lastArgs);
      }
      lastArgs = undefined;
      lastThis = undefined;
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timeoutId = undefined;
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
          lastArgs = undefined;
          lastThis = undefined;
        }
      }, remaining);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
  };

  return throttled;
}

export function debounceRAF<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { cancel: () => void } {
  let rafId: number | undefined;
  let lastArgs: unknown[] | undefined;

  const debounced = ((...args: unknown[]) => {
    lastArgs = args;

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      if (lastArgs) {
        fn(...lastArgs);
      }
      rafId = undefined;
      lastArgs = undefined;
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
      lastArgs = undefined;
    }
  };

  return debounced;
}

export function throttleRAF<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { cancel: () => void } {
  let rafId: number | undefined;
  let lastArgs: unknown[] | undefined;
  let lastTime = 0;
  const wait = 1000 / 60;

  const throttled = ((...args: unknown[]) => {
    const now = Date.now();
    lastArgs = args;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs && now - lastTime >= wait) {
          fn(...lastArgs);
          lastTime = now;
          lastArgs = undefined;
        }
        rafId = undefined;
      });
    }
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
      lastArgs = undefined;
    }
  };

  return throttled;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number,
    private refillInterval: number = 1000
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  waitForTokens(tokens: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.tryConsume(tokens)) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  get availableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

export function batch<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T & { flush: () => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: unknown[] | undefined;
  let lastThis: unknown;

  const batched = function(this: unknown, ...args: unknown[]): void {
    lastArgs = args;
    lastThis = this;

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
        }
        timeoutId = undefined;
        lastArgs = undefined;
        lastThis = undefined;
      }, wait);
    }
  } as T & { flush: () => void; cancel: () => void };

  batched.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = undefined;
      lastThis = undefined;
    }
  };

  batched.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      lastArgs = undefined;
      lastThis = undefined;
    }
  };

  return batched;
}
