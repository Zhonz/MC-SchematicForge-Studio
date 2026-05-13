export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true, maxWait } = options;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let maxTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    if (timeout) clearTimeout(timeout);
    if (maxTimeout) clearTimeout(maxTimeout);

    const invoke = () => {
      timeout = null;
      maxTimeout = null;
      if (lastArgs) fn.apply(this, lastArgs);
    };

    if (leading && !timeout) {
      fn.apply(this, args);
    }

    if (trailing) {
      timeout = setTimeout(invoke, wait);
      if (maxWait !== undefined && !maxTimeout) {
        maxTimeout = setTimeout(() => {
          if (timeout) {
            clearTimeout(timeout);
            invoke();
          }
          maxTimeout = null;
        }, maxWait);
      }
    }
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      if (leading) {
        fn.apply(this, args);
        lastCall = now;
      }
    }

    if (trailing) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeout = null;
      }, limit - (now - lastCall));
    }
  };
}

export function debounceRAF<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  let args: Parameters<T>;

  return function (this: unknown, ...innerArgs: Parameters<T>) {
    args = innerArgs;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    }
  };
}

export function throttleRAF<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let rafId: number | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = performance.now();
    const remaining = 16 - (now - lastTime);

    if (remaining <= 0 || remaining > 16) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        lastTime = performance.now();
        rafId = null;
        fn.apply(this, args);
      });
    }
  };
}
