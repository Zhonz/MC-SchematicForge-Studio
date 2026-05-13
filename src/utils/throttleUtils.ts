export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
  options: ThrottleOptions = {}
): T {
  const { leading = true, trailing = true } = options;
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: unknown[] | null = null;

  return ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeout && trailing) {
      lastArgs = args;
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }

    if (leading && lastCall === 0) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  immediate = false
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return ((...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);

    if (immediate && !timeout) {
      fn(...args);
    }

    timeout = setTimeout(() => {
      if (!immediate) fn(...args);
      timeout = null;
    }, wait);
  }) as T;
}

export function debounceLeading<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastCall = 0;

  return ((...args: unknown[]) => {
    const now = Date.now();
    const isFirstCall = now - lastCall >= wait;
    
    if (isFirstCall) {
      lastCall = now;
      fn(...args);
    }

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      lastCall = 0;
    }, wait);
  }) as T;
}

export function rafThrottle<T extends (...args: unknown[]) => unknown>(fn: T): T {
  let ticking = false;
  let lastArgs: unknown[] | null = null;

  return ((...args: unknown[]) => {
    lastArgs = args;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (lastArgs) fn(...lastArgs);
      });
    }
  }) as T;
}

export function rafDebounce<T extends (...args: unknown[]) => unknown>(fn: T): T & { cancel: () => void } {
  let rafId: number | null = null;
  const debounced = debounce(fn, 16);

  const result = ((...args: unknown[]) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      debounced(...args);
      rafId = null;
    });
  }) as T & { cancel: () => void };

  result.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return result;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number,
    private windowMs: number
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  tryConsume(tokens = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.windowMs) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  get availableTokens(): number {
    this.refill();
    return this.tokens;
  }
}
