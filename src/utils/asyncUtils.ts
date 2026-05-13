export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      onRetry?.(error as Error, attempt);
      await sleep(delay * Math.pow(backoff, attempt - 1));
    }
  }
  throw new Error('Retry failed');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  const timer = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timer]);
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number
): Promise<T> {
  return timeout(fn(), ms);
}

export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  concurrency = Infinity
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
    });
    executing.push(p);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(e => e === p), 1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}

export async function sequential<T>(
  tasks: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

export async function raceWithDefault<T>(
  tasks: Array<() => Promise<T>>,
  defaultValue: T,
  timeoutMs: number
): Promise<T> {
  try {
    return await timeout(Promise.race(tasks.map(t => t())), timeoutMs);
  } catch {
    return defaultValue;
  }
}

export function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
