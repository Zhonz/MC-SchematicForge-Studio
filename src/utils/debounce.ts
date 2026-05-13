export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && timeout === null;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function throttleRAF<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;
    if (!ticking) {
      requestAnimationFrame(() => {
        func.apply(context, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

export function debouncePromise<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<unknown> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>): Promise<unknown> {
    const context = this;
    return new Promise((resolve, reject) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          const result = await func.apply(context, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

export function debounceWithControl<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  } as DebouncedFunction<T>;
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      func.apply(debounced, arguments as unknown as Parameters<T>);
      timeout = null;
    }
  };
  return debounced;
}
