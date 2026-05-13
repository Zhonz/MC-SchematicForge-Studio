export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let inThrottle = false;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  }) as T;
}

export function once<T extends (...args: unknown[]) => void>(fn: T): T {
  let called = false;
  let result: unknown;
  return ((...args: unknown[]) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, unknown>();
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function curry(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  return function curried(...args: unknown[]) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...more: unknown[]) => curried(...args, ...more);
  };
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

export function partial<T extends (...args: unknown[]) => unknown>(fn: T, ...initialArgs: unknown[]): (...rest: unknown[]) => unknown {
  return (...rest: unknown[]) => fn(...initialArgs, ...rest);
}

export function negate<T extends (...args: unknown[]) => boolean>(fn: T): T {
  return ((...args: unknown[]) => !fn(...args)) as T;
}

export function noop(): void {}

export function identity<T>(x: T): T {
  return x;
}

export function constant<T>(x: T): () => T {
  return () => x;
}

export function tap<T>(fn: (value: T) => void): (value: T) => T {
  return (value: T) => {
    fn(value);
    return value;
  };
}
