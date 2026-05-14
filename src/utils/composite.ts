/**
 * 🔗 函数组合工具
 * 
 * 提供 pipe、compose 等函数组合工具
 */

/**
 * 从左到右执行函数组合
 * 
 * @param funcs - 要组合的函数数组
 * @returns 组合后的函数
 * 
 * @example
 * ```ts
 * const add = (x: number) => x + 1;
 * const multiply = (x: number) => x * 2;
 * const addThenMultiply = pipe(add, multiply);
 * addThenMultiply(5); // (5 + 1) * 2 = 12
 * ```
 */
export function pipe<T>(...funcs: ((value: T) => T)[]): (value: T) => T {
  return (initialValue: T): T => {
    return funcs.reduce((value, func) => func(value), initialValue);
  };
}

/**
 * 从右到左执行函数组合
 * 
 * @param funcs - 要组合的函数数组
 * @returns 组合后的函数
 * 
 * @example
 * ```ts
 * const add = (x: number) => x + 1;
 * const multiply = (x: number) => x * 2;
 * const multiplyThenAdd = compose(add, multiply);
 * multiplyThenAdd(5); // (5 * 2) + 1 = 11
 * ```
 */
export function compose<T>(...funcs: ((value: T) => T)[]): (value: T) => T {
  return (initialValue: T): T => {
    return funcs.reduceRight((value, func) => func(value), initialValue);
  };
}

/**
 * 函数柯里化
 * 
 * @param fn - 要柯里化的函数
 * @returns 柯里化后的函数
 * 
 * @example
 * ```ts
 * const add = (a: number, b: number) => a + b;
 * const addCurried = curry(add);
 * const add5 = addCurried(5);
 * add5(3); // 8
 * ```
 */
export function curry(fn: (...args: any[]) => any) {
  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      return fn(...args);
    } else {
      return (...nextArgs: any[]) => curried(...args, ...nextArgs);
    }
  };
}

/**
 * 函数偏应用
 * 
 * @param fn - 函数
 * @param presetArgs - 预置参数
 * @returns 偏应用后的函数
 * 
 * @example
 * ```ts
 * const greet = (greeting: string, name: string) => `${greeting} ${name}`;
 * const sayHello = partial(greet, 'Hello');
 * sayHello('Alice'); // 'Hello Alice'
 * ```
 */
export function partial(fn: (...args: any[]) => any, ...presetArgs: any[]) {
  return (...nextArgs: any[]) => fn(...presetArgs, ...nextArgs);
}

/**
 * 函数记忆化（带参数缓存）
 * 
 * @param fn - 要记忆化的函数
 * @returns 记忆化后的函数
 * 
 * @example
 * ```ts
 * const expensiveFn = memoize((n: number) => {
 *   console.log('Computing...');
 *   return n * 2;
 * });
 * expensiveFn(5); // 'Computing...', 10
 * expensiveFn(5); // 10 (from cache)
 * ```
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * 创建延迟执行的函数
 * 
 * @param ms - 延迟毫秒数
 * @param fn - 要执行的函数
 * @returns 延迟函数
 * 
 * @example
 * ```ts
 * const delayedLog = delay(1000, (msg: string) => console.log(msg));
 * delayedLog('Hello'); // logs after 1 second
 * ```
 */
export function delay<T extends (...args: any[]) => any>(ms: number, fn: T) {
  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      setTimeout(() => {
        resolve(fn(...args));
      }, ms);
    });
  };
}

/**
 * 创建可取消的函数
 * 
 * @param fn - 原始函数
 * @returns 包含调用和取消方法的对象
 * 
 * @example
 * ```ts
 * const { call, cancel } = cancellable((msg: string) => console.log(msg));
 * call('Hello'); // logs 'Hello'
 * cancel();
 * call('World'); // does nothing
 * ```
 */
export function cancellable(fn: (...args: any[]) => any) {
  let isCancelled = false;
  
  return {
    call: (...args: any[]) => {
      if (!isCancelled) {
        return fn(...args);
      }
    },
    cancel: () => {
      isCancelled = true;
    }
  };
}

/**
 * 创建计数器函数
 * 
 * @param start - 起始值
 * @param step - 步长
 * @returns 计数器函数
 * 
 * @example
 * ```ts
 * const counter = count(0, 1);
 * counter(); // 0
 * counter(); // 1
 * counter(); // 2
 * ```
 */
export function count(start: number = 0, step: number = 1) {
  let current = start;
  
  return () => {
    const value = current;
    current += step;
    return value;
  };
}

/**
 * 创建函数执行限制次数的装饰器
 * 
 * @param fn - 原始函数
 * @param maxCalls - 最大调用次数
 * @returns 限制次数后的函数
 * 
 * @example
 * ```ts
 * const log = limitCalls((msg: string) => console.log(msg), 2);
 * log('1'); // logs
 * log('2'); // logs
 * log('3'); // does nothing
 * ```
 */
export function limitCalls(fn: (...args: any[]) => any, maxCalls: number) {
  let callCount = 0;
  
  return (...args: any[]) => {
    if (callCount < maxCalls) {
      callCount++;
      return fn(...args);
    }
  };
}

/**
 * 创建只执行一次的函数
 * 
 * @param fn - 原始函数
 * @returns 只执行一次的函数
 * 
 * @example
 * ```ts
 * const init = once(() => console.log('Initialized'));
 * init(); // logs
 * init(); // does nothing
 * ```
 */
export function once(fn: (...args: any[]) => any) {
  return limitCalls(fn, 1);
}

console.log('🔗 函数组合工具已加载');
