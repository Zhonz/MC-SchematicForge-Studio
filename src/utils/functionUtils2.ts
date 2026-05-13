type Fn = (...args: unknown[]) => unknown;
type PipeFn<T extends Fn> = T;

function reduceFns<T>(fns: T[], value: unknown): unknown {
  return fns.reduce<unknown>((acc, fn) => (fn as Fn)(acc), value);
}

export function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
export function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export function pipe<A, B, C, D>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (a: A) => D;
export function pipe<A, B, C, D, E>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): (a: A) => E;
export function pipe<A, B, C, D, E, F>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): (a: A) => F;
export function pipe(...fns: Fn[]): (value: unknown) => unknown {
  return (value: unknown) => reduceFns(fns, value);
}

export function compose<A, B>(fn2: (b: B) => A, fn1: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(fn3: (c: C) => A, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(fn4: (d: D) => A, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => D;
export function compose(...fns: Fn[]): (value: unknown) => unknown {
  return (value: unknown) => reduceFns([...fns].reverse(), value);
}

export function curry(fn: Fn): Fn {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= fn.length) {
      return fn.apply(null, args);
    }
    return (...moreArgs: unknown[]) => curried.apply(null, [...args, ...moreArgs]);
  };
}

export function partial(fn: Fn, ...presetArgs: unknown[]): Fn {
  return (...laterArgs: unknown[]) => fn.apply(null, [...presetArgs, ...laterArgs]);
}

export function flip<A, B, C>(fn: (a: A, b: B) => C): (b: B, a: A) => C {
  return (b, a) => fn(a, b);
}

export function memoize<T extends Fn>(fn: T): T {
  const cache = new Map<string, unknown>();
  return ((...args: unknown[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(null, args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function once<T extends Fn>(fn: T): T {
  let called = false;
  let result: unknown;
  return ((...args: unknown[]) => {
    if (!called) {
      result = fn.apply(null, args);
      called = true;
    }
    return result;
  }) as T;
}

export function before<T extends Fn>(n: number, fn: T): T {
  let count = 0;
  return ((...args: unknown[]) => {
    if (++count < n) {
      return fn.apply(null, args);
    }
    return undefined;
  }) as T;
}

export function after<T extends Fn>(n: number, fn: T): T {
  let count = 0;
  return ((...args: unknown[]) => {
    if (++count >= n) {
      return fn.apply(null, args);
    }
    return undefined;
  }) as T;
}

export function debounce<T extends Fn>(fn: T, wait: number): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const debounced = ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(null, args);
      timeoutId = undefined;
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}

export function throttle<T extends Fn>(fn: T, wait: number): T {
  let lastTime = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(null, args);
    }
  }) as T;
}

export function noop(): undefined {
  return undefined;
}

export function identity<T>(value: T): T {
  return value;
}

export function constant<T>(value: T): () => T {
  return () => value;
}

export function tap<T>(fn: (value: T) => unknown): (value: T) => T {
  return (value: T) => {
    fn(value);
    return value;
  };
}

export function negate<T extends Fn>(fn: T): T {
  return ((...args: unknown[]) => !fn.apply(null, args)) as T;
}

export function spread<T, R>(fn: (args: T[]) => R): (args: T[]) => R {
  return fn;
}

export function unary<T, R>(fn: (arg1: T, arg2?: unknown) => R): (arg: T) => R {
  return (arg) => fn(arg);
}

export function binary<T, R>(fn: (arg1: T, arg2: T) => R): (arg: T) => (arg2: T) => R {
  return (arg) => (arg2) => fn(arg, arg2);
}

export function converge<TR>(converter: (fn: Fn) => TR, fns: Fn[]): Fn {
  return (...args: unknown[]) => {
    const combined = (...fnsArgs: unknown[]) => {
      let result: unknown = args[0];
      for (const fn of fns) {
        result = fn.apply(null, [result as unknown, ...fnsArgs]);
      }
      return result;
    };
    return converter(combined as Fn);
  };
}

export function juxt<T>(...fns: Array<(...args: unknown[]) => T>): (...args: unknown[]) => T[] {
  return (...args: unknown[]) => fns.map(fn => fn.apply(null, args));
}

export function composeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown): (arg: A) => B;
export function composeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown, fn3: (arg: unknown) => unknown): (arg: A) => B;
export function composeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown, fn3: (arg: unknown) => unknown, fn4: (arg: unknown) => unknown): (arg: A) => B;
export function composeWith<A, B>(transform: (fn: Fn) => B, ...fns: Array<(arg: unknown) => unknown>): (arg: A) => B {
  const reversed = [...fns].reverse() as Fn[];
  return (value: A): B => {
    const piped = (v: unknown): unknown => reduceFns(reversed, v);
    const result = transform(piped as Fn);
    return (typeof result === 'function' ? (result as (v: A) => B)(value) : result);
  };
}

export function pipeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown): (arg: A) => B;
export function pipeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown, fn3: (arg: unknown) => unknown): (arg: A) => B;
export function pipeWith<A, B>(transform: (fn: Fn) => B, fn1: (arg: unknown) => unknown, fn2: (arg: unknown) => unknown, fn3: (arg: unknown) => unknown, fn4: (arg: unknown) => unknown): (arg: A) => B;
export function pipeWith<A, B>(transform: (fn: Fn) => B, ...fns: Array<(arg: unknown) => unknown>): (arg: A) => B {
  const fnArray = [...fns] as Fn[];
  return (value: A): B => {
    const piped = (v: unknown): unknown => reduceFns(fnArray, v);
    const result = transform(piped as Fn);
    return (typeof result === 'function' ? (result as (v: A) => B)(value) : result);
  };
}
